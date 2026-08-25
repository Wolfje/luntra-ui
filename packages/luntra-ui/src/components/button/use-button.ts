'use client';

import { useMemo } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';

import { dataAttrs } from '../../utils/data-attrs.js';

/**
 * What the button props are landing on.
 *
 * - `button` — a real `<button>`. The browser already provides the role, the
 *   tab stop and activation on both Enter and Space.
 * - `link` — an `<a>` with an `href`. It is a *link*: it keeps the link role,
 *   activates on Enter only, and Space must go on scrolling the page. Forcing
 *   `role="button"` here would announce it as a button while it still
 *   navigates, and cost the user the context menu and open-in-new-tab that
 *   every link is expected to offer.
 * - `custom` — anything else. Nothing is provided, so everything has to be:
 *   role, tab stop and Space activation.
 */
export type ButtonElementKind = 'button' | 'link' | 'custom';

export interface UseButtonOptions<E extends HTMLElement = HTMLElement> {
  disabled: boolean;
  loading: boolean;
  variant: string;
  size: string;
  elementKind: ButtonElementKind;
  onClick?: ((event: MouseEvent<E>) => void) | undefined;
  onKeyDown?: ((event: KeyboardEvent<E>) => void) | undefined;
  onKeyUp?: ((event: KeyboardEvent<E>) => void) | undefined;
}

/**
 * The behaviour behind Button, separated from its markup.
 *
 * Extracted so the same semantics can back anything button-like — a menu item,
 * a toggle, a split button — without any of them re-deriving what "disabled"
 * has to mean.
 *
 * ## Why activation is blocked by hand
 *
 * The component sets `aria-disabled`, never the native `disabled` attribute, so
 * the browser still treats the element as fully interactive: it fires click, it
 * responds to Enter and Space, and inside a form it still submits. Every one of
 * those routes has to be closed explicitly, or a disabled button quietly goes
 * on working for anyone using a keyboard.
 *
 * That trade is worth making. A natively disabled button leaves the tab order
 * entirely, so a screen-reader user navigating by Tab never encounters it and
 * is given no reason why the action they came for has gone.
 *
 * ## Why blocking is a gate rather than a composed handler
 *
 * While the button is inactive the consumer's handler is not called at all.
 * Chaining it — even chaining it second — would leave a disabled button running
 * the consumer's `onClick`, which is the exact thing "disabled" promises will
 * not happen. This is the one place in the library where the consumer's handler
 * does not run first, because `disabled` is a guarantee rather than a default.
 */
export function useButton<E extends HTMLElement = HTMLElement>({
  disabled,
  loading,
  variant,
  size,
  elementKind,
  onClick,
  onKeyDown,
  onKeyUp,
}: UseButtonOptions<E>) {
  const inactive = disabled || loading;

  return useMemo(() => {
    const suppress = (event: MouseEvent<E> | KeyboardEvent<E>) => {
      // preventDefault alone would not stop a form submitting on Enter, and
      // stopPropagation alone would still let the default action fire.
      event.preventDefault();
      event.stopPropagation();
    };

    const isCustom = elementKind === 'custom';

    return {
      ...dataAttrs({
        'luntra-part': 'button',
        variant,
        size,
        disabled: inactive,
        loading,
      }),

      'aria-disabled': inactive || undefined,
      'aria-busy': loading || undefined,

      // Supplied only where the element provides neither. A native button needs
      // no role, and an explicit tabIndex on one merely overrides document order.
      ...(isCustom ? { role: 'button', tabIndex: 0 } : {}),

      onClick(event: MouseEvent<E>) {
        if (inactive) {
          suppress(event);
          return;
        }

        onClick?.(event);
      },

      onKeyDown(event: KeyboardEvent<E>) {
        if (inactive && (event.key === 'Enter' || event.key === ' ')) {
          suppress(event);
          return;
        }

        onKeyDown?.(event);

        // Space scrolls the page by default. An element presenting itself as a
        // button must not scroll when the user tries to press it.
        if (isCustom && event.key === ' ' && !event.defaultPrevented) {
          event.preventDefault();
        }
      },

      onKeyUp(event: KeyboardEvent<E>) {
        if (inactive) {
          if (event.key === 'Enter' || event.key === ' ') suppress(event);
          return;
        }

        onKeyUp?.(event);

        /*
         * A native button activates on Space at keyup. A span does not activate
         * on Space at all, so the click is synthesised here — SC 2.1.1 requires
         * every function to be reachable from the keyboard, and an element
         * announced as a button will be pressed with Space.
         */
        if (isCustom && event.key === ' ' && !event.defaultPrevented) {
          event.preventDefault();
          event.currentTarget.click();
        }
      },
    };
  }, [inactive, loading, variant, size, elementKind, onClick, onKeyDown, onKeyUp]);
}
