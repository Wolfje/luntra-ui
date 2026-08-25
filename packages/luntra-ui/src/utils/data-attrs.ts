/**
 * Values a data attribute can be built from.
 *
 * `number` is excluded on purpose. `data-count={0}` would render as `"0"`,
 * which is truthy in a CSS attribute selector, and that mismatch between
 * JavaScript falsiness and CSS truthiness is exactly the sort of bug this
 * module exists to prevent.
 */
export type DataAttributeValue = string | boolean | null | undefined;

/**
 * Build a `data-*` attribute map for spreading onto an element.
 *
 * ## Why falsy values are omitted rather than rendered
 *
 * CSS attribute selectors match on *presence*, not on value. `[data-disabled]`
 * matches an element with `data-disabled="false"` just as happily as one with
 * `data-disabled="true"`, so rendering `false` would style every button as
 * disabled. Omitting the attribute entirely is the only behaviour that makes
 * `[data-loading]`, `[data-disabled]` and friends work the way anyone writing
 * the CSS expects.
 *
 * `true` renders as an empty string, matching how HTML boolean attributes
 * serialise, so the DOM reads `data-disabled` rather than `data-disabled="true"`.
 *
 * Empty strings are dropped too: `data-variant=""` styles nothing and only
 * clutters the inspector.
 *
 * @example
 * dataAttrs({ variant: 'primary', disabled: false, loading: true })
 * // { 'data-variant': 'primary', 'data-loading': '' }
 */
export function dataAttrs(attributes: Record<string, DataAttributeValue>): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(attributes)) {
    if (value === false || value === null || value === undefined || value === '') {
      continue;
    }

    result[key.startsWith('data-') ? key : `data-${key}`] = value === true ? '' : value;
  }

  return result;
}
