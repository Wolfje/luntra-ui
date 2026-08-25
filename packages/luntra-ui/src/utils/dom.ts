/* eslint-disable no-restricted-globals -- This module is the one audited boundary for DOM access. */

/**
 * The single place in the library that touches browser globals.
 *
 * Everywhere else, `no-restricted-globals` makes `window`/`document`/
 * `localStorage` a lint error. Funnelling access through here means SSR safety
 * is enforced by the linter rather than by remembering to check, and there is
 * exactly one file to audit when something breaks on the server.
 */

/**
 * True when a real DOM is available.
 *
 * Checks `createElement` rather than just `typeof window`, because some SSR
 * and test environments define a partial `window` shim that would otherwise
 * pass a naive check and then fail on first use.
 */
export const canUseDom: boolean =
  typeof window !== 'undefined' && typeof window.document?.createElement === 'function';

export function getDocument(): Document | undefined {
  return canUseDom ? document : undefined;
}

export function getWindow(): Window | undefined {
  return canUseDom ? window : undefined;
}

/**
 * Read a key from `localStorage`, or `null` if unavailable.
 *
 * Access is wrapped because `localStorage` throws — not returns null — when
 * storage is disabled, quota-exceeded, or blocked by a privacy setting. An
 * unavailable preference store should degrade to "no preference", never take
 * the page down.
 */
export function readStorage(key: string): string | null {
  if (!canUseDom) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Write a key to `localStorage`, silently doing nothing if unavailable. */
export function writeStorage(key: string, value: string): void {
  if (!canUseDom) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable — the in-memory preference still applies for this
    // session, it just will not survive a reload.
  }
}

/** Evaluate a media query, defaulting to `false` on the server. */
export function matchesMedia(query: string): boolean {
  const win = getWindow();
  return win?.matchMedia?.(query).matches ?? false;
}
