/**
 * Theme types and the DOM contract shared by the provider, the no-flash script
 * and the docs. Kept in a module of its own so the inline script (which must
 * not import React) and the provider can agree on names.
 */

/** What the user chose. `system` follows the OS setting. */
export type ThemePreference = 'light' | 'dark' | 'system';

/** What is actually painted. `system` is resolved away before it reaches CSS. */
export type ResolvedTheme = 'light' | 'dark';

export const THEME_ATTRIBUTE = 'data-theme';
export const BRAND_ATTRIBUTE = 'data-brand';

export const DEFAULT_THEME_STORAGE_KEY = 'luntra-ui-theme';
export const DEFAULT_BRAND_STORAGE_KEY = 'luntra-ui-brand';

export const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

export interface ThemeContextValue {
  /** The user's preference, including `system`. */
  theme: ThemePreference;
  /**
   * The concrete theme in the DOM. Always `light` or `dark` — never `system`,
   * because CSS cannot act on an unresolved preference.
   */
  resolvedTheme: ResolvedTheme;
  brand: string;
  setTheme: (theme: ThemePreference) => void;
  setBrand: (brand: string) => void;
}
