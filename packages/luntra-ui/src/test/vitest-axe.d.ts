import 'vitest';

/**
 * Type declaration for `toHaveNoViolations`.
 *
 * vitest-axe ships its own augmentation, but it targets the global `Vi`
 * namespace that Vitest used up to v2. Vitest 4 resolves custom matchers
 * through `declare module 'vitest'` instead, so the bundled types are invisible
 * and every a11y assertion fails to typecheck even though it runs correctly.
 *
 * The matchers themselves are registered in `setup.ts`; this only teaches
 * TypeScript that they exist. Remove it once vitest-axe augments the module.
 */
declare module 'vitest' {
  interface Assertion<T = unknown> {
    toHaveNoViolations(): T;
  }

  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): unknown;
  }
}
