import { cx } from './cx.js';
import { composeEventHandlers } from './compose-event-handlers.js';

type Props = Record<string, unknown>;

const EVENT_HANDLER = /^on[A-Z]/;

/**
 * Merge two prop objects, with the override winning.
 *
 * Three kinds of prop cannot simply be overwritten, because doing so silently
 * destroys behaviour the consumer never asked to lose:
 *
 * - **Event handlers** are chained, not replaced. A consumer passing `onClick`
 *   to a Button expects their handler *and* the component's to run.
 * - **`className`** is concatenated. Replacing it would strip the component's
 *   own styling the moment anyone passed a class.
 * - **`style`** is shallow-merged, with the override winning per property, so
 *   setting one property does not wipe the rest.
 *
 * Everything else is a plain override, which is what `aria-label`, `id` and
 * friends should do.
 *
 * `undefined` in the override is treated as "not specified" so that spreading
 * an object with optional keys does not blank out the base — this is the single
 * most common way a merge helper surprises people.
 */
export function mergeProps<T extends Props, U extends Props>(base: T, overrides: U): T & U {
  const result: Props = { ...base };

  for (const [key, overrideValue] of Object.entries(overrides)) {
    const baseValue = result[key];

    if (overrideValue === undefined) {
      continue;
    }

    if (
      EVENT_HANDLER.test(key) &&
      typeof overrideValue === 'function' &&
      typeof baseValue === 'function'
    ) {
      result[key] = composeEventHandlers(
        overrideValue as (event: never) => void,
        baseValue as (event: never) => void,
      );
      continue;
    }

    if (key === 'className') {
      result[key] = cx(baseValue as string | undefined, overrideValue as string | undefined);
      continue;
    }

    if (key === 'style' && isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      result[key] = { ...baseValue, ...overrideValue };
      continue;
    }

    result[key] = overrideValue;
  }

  return result as T & U;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
