const warned = new Set<string>();

/**
 * Warn about component misuse in development only.
 *
 * ## Why the `process.env.NODE_ENV` shape matters
 *
 * The literal `process.env.NODE_ENV !== 'production'` check is what every
 * bundler's dead-code elimination recognises. Hoisting it into a constant, or
 * reading it through a helper, defeats that and ships the warning strings to
 * production. Keeping the check inline means the whole body is dropped from
 * production builds.
 *
 * `typeof process` is guarded because the library runs in browsers, workers and
 * edge runtimes where `process` may not exist at all — an unguarded read there
 * is a hard crash, not a missing warning.
 *
 * ## Why warnings are deduplicated
 *
 * A misused component usually renders many times, and a hundred identical
 * console lines buries the one message that matters.
 *
 * @param condition Warn when this is `false`, mirroring `invariant`.
 */
export function devWarn(condition: boolean, message: string): void {
  if (typeof process === 'undefined' || process.env['NODE_ENV'] === 'production') {
    return;
  }

  if (condition || warned.has(message)) {
    return;
  }

  warned.add(message);
  console.warn(`[luntra-ui] ${message}`);
}

/**
 * Clear the deduplication cache.
 *
 * Exported for tests, which need each case to observe its own warning rather
 * than inherit suppression from a previous one.
 */
export function resetDevWarnings(): void {
  warned.clear();
}
