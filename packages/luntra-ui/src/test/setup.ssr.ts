/**
 * Setup for the `ssr` project.
 *
 * Intentionally bare: no jsdom, no Testing Library, no DOM globals. Anything a
 * component needs at render time has to come from React itself. If a test in
 * this project fails with "window is not defined", that is the suite doing its
 * job.
 */

import { afterEach, expect } from 'vitest';

/** Guard against a stray environment change silently weakening these tests. */
expect(typeof globalThis.window).toBe('undefined');

afterEach(() => {
  // Nothing to clean up — no DOM is ever created here.
});
