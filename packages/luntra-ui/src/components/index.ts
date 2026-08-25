/**
 * `@luntra-ui/react` — the component barrel.
 *
 * Every component is also its own entry point (`@luntra-ui/react/button`), so
 * importing from here is a convenience, not a cost: the build emits one chunk
 * per component and bundlers tree-shake the rest.
 */

export { ThemeProvider, useTheme, getThemeScript } from './theme-provider/index.js';
export type {
  ThemeProviderProps,
  ThemeScriptOptions,
  ThemeContextValue,
  ThemePreference,
  ResolvedTheme,
} from './theme-provider/index.js';
export {
  THEME_ATTRIBUTE,
  BRAND_ATTRIBUTE,
  DEFAULT_THEME_STORAGE_KEY,
  DEFAULT_BRAND_STORAGE_KEY,
} from './theme-provider/index.js';
