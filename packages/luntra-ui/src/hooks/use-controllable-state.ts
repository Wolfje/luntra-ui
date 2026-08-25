'use client';

import { useCallback, useRef, useState } from 'react';

import { useIsomorphicLayoutEffect } from './use-isomorphic-layout-effect.js';
import { devWarn } from '../utils/dev-warn.js';

export interface UseControllableStateOptions<T> {
  /** The controlled value. Passing anything but `undefined` takes control. */
  value: T | undefined;
  /** The initial value when uncontrolled. */
  defaultValue: T;
  /** Called on every change, controlled or not. */
  onChange?: ((value: T) => void) | undefined;
  /** Component name, used to make the control-mode warning actionable. */
  name?: string;
}

/**
 * State that works the same whether the consumer controls it or not.
 *
 * Every interactive component needs this: `<Switch checked>` must obey the
 * consumer, `<Switch defaultChecked>` must manage itself, and the component's
 * internal logic should not have to care which it got.
 *
 * ## Why internal state exists even when controlled
 *
 * The `useState` call is unconditional because hooks cannot be called
 * conditionally, and because a component can be remounted uncontrolled after
 * being controlled. The controlled value simply wins when reading.
 *
 * ## Why switching modes warns
 *
 * Going from uncontrolled to controlled (or back) mid-life is almost always a
 * bug — usually `value={someUndefinedProp}` — and it produces symptoms that
 * look nothing like the cause: an input that stops accepting typing, or a
 * checkbox that snaps back. React itself warns about this for form elements;
 * this extends the courtesy to library components.
 *
 * ## Why `onChange` is called even when uncontrolled
 *
 * Consumers frequently want to *observe* changes without taking control.
 * Firing only in controlled mode would make `<Switch defaultChecked onChange>`
 * silently do nothing.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
  name = 'Component',
}: UseControllableStateOptions<T>): [T, (next: T) => void] {
  const [uncontrolledValue, setUncontrolledValue] = useState<T>(defaultValue);

  const isControlled = value !== undefined;
  const wasControlled = useRef(isControlled);

  // Both refs are written from an effect rather than during render. Render must
  // stay pure — React may render a component without committing it, and under
  // React Compiler a render-phase ref write is a hard error. Neither ref is read
  // during render: the warning is a side effect, and `onChangeRef` is only read
  // from `setValue`, which runs in event handlers, long after commit.
  useIsomorphicLayoutEffect(() => {
    devWarn(
      wasControlled.current === isControlled,
      `${name} changed from ${wasControlled.current ? 'controlled' : 'uncontrolled'} to ` +
        `${isControlled ? 'controlled' : 'uncontrolled'}. Decide on one for the lifetime of ` +
        'the component: pass a defined value for controlled, or omit it entirely and use the ' +
        'default. A value that is sometimes undefined is the usual cause.',
    );

    wasControlled.current = isControlled;
  }, [isControlled, name]);

  // Read the callback through a ref so `setValue` never lists it as a
  // dependency. A setter whose identity changed on every render would defeat
  // memoisation in every component that passes it to a child.
  const onChangeRef = useRef(onChange);

  useIsomorphicLayoutEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) {
        setUncontrolledValue(next);
      }

      onChangeRef.current?.(next);
    },
    [isControlled],
  );

  return [isControlled ? value : uncontrolledValue, setValue];
}
