/**
 * The single place the docs reach into the library.
 *
 * Every import below goes through a different public subpath on purpose. The
 * docs are built from the package's `exports` map exactly as a consumer would
 * resolve it, so a broken or missing entry fails `pnpm build` here rather than
 * in someone else's project after release — the integration test the library
 * cannot write about itself.
 *
 * Nothing reaches into `dist/` or `src/` directly. If an import here needs a
 * deep path, that is the signal that the export map is missing an entry.
 */

// `.` — the component barrel.
export { ThemeProvider, useTheme, getThemeScript } from '@luntra-ui/react';
export type { ThemePreference, ResolvedTheme, ThemeContextValue } from '@luntra-ui/react';

// `./button` — the per-component entry, proving components are individually
// importable and not only available through the barrel.
export { Button } from '@luntra-ui/react/button';
export type { ButtonProps, ButtonSize, ButtonVariant } from '@luntra-ui/react/button';

// `./tokens` — the token source, so the docs tables are generated from the
// same data the stylesheet is.
export {
  brands,
  contrastRatioRounded,
  flatten,
  meetsContrast,
  primitives,
  resolveValue,
  themes,
  toCssVarName,
} from '@luntra-ui/react/tokens';
export type { Brand, BrandName, BrandRamp, ThemeName } from '@luntra-ui/react/tokens';
