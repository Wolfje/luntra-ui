'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { useIsomorphicLayoutEffect } from '../../hooks/use-isomorphic-layout-effect.js';
import {
  getDocument,
  getWindow,
  matchesMedia,
  readStorage,
  writeStorage,
} from '../../utils/dom.js';
import {
  BRAND_ATTRIBUTE,
  DARK_MEDIA_QUERY,
  DEFAULT_BRAND_STORAGE_KEY,
  DEFAULT_THEME_STORAGE_KEY,
  THEME_ATTRIBUTE,
  type ResolvedTheme,
  type ThemeContextValue,
  type ThemePreference,
} from './theme-context.js';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children?: ReactNode;
  /** Preference used before anything is read from storage. */
  defaultTheme?: ThemePreference;
  defaultBrand?: string;
  storageKey?: string;
  brandStorageKey?: string;
  /** Set `false` to keep the choice in memory only, for the current page. */
  persist?: boolean;
}

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function resolve(preference: ThemePreference): ResolvedTheme {
  if (preference !== 'system') return preference;
  return matchesMedia(DARK_MEDIA_QUERY) ? 'dark' : 'light';
}

function applyToDocument(resolved: ResolvedTheme, brand: string): void {
  const doc = getDocument();
  if (!doc) return;

  const root = doc.documentElement;
  root.setAttribute(THEME_ATTRIBUTE, resolved);
  // Keeps native UI — scrollbars, form controls, the caret — in step with the
  // theme. Without it a dark page renders light scrollbars.
  root.style.colorScheme = resolved;

  if (brand) {
    root.setAttribute(BRAND_ATTRIBUTE, brand);
  } else {
    root.removeAttribute(BRAND_ATTRIBUTE);
  }
}

/**
 * Manages the theme preference and mirrors it onto `<html>`.
 *
 * ## What this does *not* do
 *
 * It renders no DOM of its own and no theme-dependent markup. That is the
 * point: server output is identical whatever the theme, so there is nothing for
 * hydration to mismatch on. Styling happens entirely through the CSS cascade
 * from `data-theme` / `data-brand`.
 *
 * ## First paint
 *
 * Pair this with {@link getThemeScript} in `<head>`. The script sets the
 * attributes before the browser paints; this provider then adopts whatever the
 * script decided rather than fighting it. Without the script everything still
 * works, but a stored non-default theme will flash once on load.
 *
 * ## Scoped themes
 *
 * You do not need a nested provider for a themed island — `data-theme` is
 * inherited, so any element can override it:
 *
 * ```tsx
 * <section data-theme="light">Always light, inside a dark page.</section>
 * ```
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  defaultBrand = '',
  storageKey = DEFAULT_THEME_STORAGE_KEY,
  brandStorageKey = DEFAULT_BRAND_STORAGE_KEY,
  persist = true,
}: ThemeProviderProps) {
  // Initialised from the props, never from storage or the DOM. Reading either
  // here would produce different output on server and client.
  const [theme, setThemeState] = useState<ThemePreference>(defaultTheme);
  const [brand, setBrandState] = useState<string>(defaultBrand);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(
    defaultTheme === 'system' ? 'light' : defaultTheme,
  );

  // Adopt the stored preference once mounted. Runs before paint in the browser,
  // so if the inline script is absent this is still the earliest possible fix.
  useIsomorphicLayoutEffect(() => {
    const storedTheme = persist ? readStorage(storageKey) : null;
    const nextTheme = isThemePreference(storedTheme) ? storedTheme : defaultTheme;

    const storedBrand = persist ? readStorage(brandStorageKey) : null;
    const nextBrand = storedBrand ?? defaultBrand;

    const nextResolved = resolve(nextTheme);

    setThemeState(nextTheme);
    setBrandState(nextBrand);
    setResolvedTheme(nextResolved);
    applyToDocument(nextResolved, nextBrand);
  }, [defaultBrand, defaultTheme, brandStorageKey, persist, storageKey]);

  // Follow the OS while the preference is `system`. Without this, a user who
  // switches their OS to dark at night keeps the stale theme until reload.
  useIsomorphicLayoutEffect(() => {
    if (theme !== 'system') return;

    const win = getWindow();
    const query = win?.matchMedia?.(DARK_MEDIA_QUERY);
    if (!query) return;

    const onChange = (event: MediaQueryListEvent) => {
      const next: ResolvedTheme = event.matches ? 'dark' : 'light';
      setResolvedTheme(next);
      applyToDocument(next, brand);
    };

    query.addEventListener('change', onChange);
    return () => {
      query.removeEventListener('change', onChange);
    };
  }, [brand, theme]);

  const setTheme = useCallback(
    (next: ThemePreference) => {
      const nextResolved = resolve(next);
      setThemeState(next);
      setResolvedTheme(nextResolved);
      applyToDocument(nextResolved, brand);
      if (persist) writeStorage(storageKey, next);
    },
    [brand, persist, storageKey],
  );

  const setBrand = useCallback(
    (next: string) => {
      setBrandState(next);
      applyToDocument(resolvedTheme, next);
      if (persist) writeStorage(brandStorageKey, next);
    },
    [brandStorageKey, persist, resolvedTheme],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, brand, setTheme, setBrand }),
    [brand, resolvedTheme, setBrand, setTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Read and change the current theme.
 *
 * Throws outside a {@link ThemeProvider} rather than returning a silent
 * default — a theme switcher that renders but does nothing is a far worse
 * failure than one that fails loudly in development.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a <ThemeProvider>.');
  }
  return context;
}
