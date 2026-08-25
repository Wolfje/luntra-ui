/**
 * Join class names, dropping anything falsy.
 *
 * Deliberately tiny and dependency-free: `clsx` and `classnames` also handle
 * objects and nested arrays, but a component library would be forcing that
 * dependency on every consumer for a feature it never uses internally.
 *
 * @example
 * cx('root', isActive && 'active', undefined) // 'root active'
 */
export function cx(...values: (string | false | null | undefined)[]): string {
  let result = '';

  for (const value of values) {
    if (!value) continue;
    result = result ? `${result} ${value}` : value;
  }

  return result;
}
