import type { SyntheticEvent } from 'react';

/**
 * Chain an internal handler behind a consumer's handler.
 *
 * ## Why the consumer's handler runs first
 *
 * Calling the consumer first gives them a chance to `preventDefault()` and
 * suppress the library's behaviour. If the library ran first, a consumer could
 * never stop it — which is the difference between a component you can build on
 * and one you have to fork.
 *
 * ## Why `defaultPrevented` is respected
 *
 * A consumer who calls `preventDefault()` in `onKeyDown` is saying "I have
 * handled this key". Running our handler anyway would produce two responses to
 * one keystroke. `checkForDefaultPrevented: false` opts out for the rare case
 * where the library's behaviour is not optional.
 */
export function composeEventHandlers<E extends SyntheticEvent | Event>(
  consumerHandler: ((event: E) => void) | undefined,
  libraryHandler: ((event: E) => void) | undefined,
  { checkForDefaultPrevented = true }: { checkForDefaultPrevented?: boolean } = {},
): (event: E) => void {
  return function handleEvent(event: E) {
    consumerHandler?.(event);

    if (checkForDefaultPrevented && event.defaultPrevented) {
      return;
    }

    libraryHandler?.(event);
  };
}
