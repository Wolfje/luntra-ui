import {
  BRAND_ATTRIBUTE,
  DARK_MEDIA_QUERY,
  DEFAULT_BRAND_STORAGE_KEY,
  DEFAULT_THEME_STORAGE_KEY,
  THEME_ATTRIBUTE,
  type ThemePreference,
} from './theme-context.js';

export interface ThemeScriptOptions {
  /** `localStorage` key holding the theme preference. */
  storageKey?: string;
  /** `localStorage` key holding the brand. */
  brandStorageKey?: string;
  /** Used when nothing is stored. */
  defaultTheme?: ThemePreference;
  /** Used when nothing is stored. Omit to leave `data-brand` unset. */
  defaultBrand?: string;
}

/**
 * Returns a snippet to run synchronously in `<head>`, before first paint.
 *
 * ## Why this exists
 *
 * The theme lives in `localStorage`, which the server cannot read. If the theme
 * were applied in a React effect, the browser would paint the default theme
 * first and then repaint — the "flash of wrong theme". React cannot solve this,
 * because by the time React runs, the page has already painted.
 *
 * So the resolved theme is written to `<html>` by a blocking script *before*
 * the first paint. React never renders anything theme-dependent, which means
 * the server and client markup are byte-identical and there is no hydration
 * mismatch to reconcile.
 *
 * ## Usage
 *
 * ```tsx
 * <head>
 *   <script dangerouslySetInnerHTML={{ __html: getThemeScript() }} />
 * </head>
 * ```
 *
 * Blocking is the point — do not add `defer` or `async`.
 *
 * Everything is wrapped in `try/catch`: `localStorage` throws outright when
 * storage is blocked, and a theme preference is never worth a blank page.
 */
export function getThemeScript(options: ThemeScriptOptions = {}): string {
  const {
    storageKey = DEFAULT_THEME_STORAGE_KEY,
    brandStorageKey = DEFAULT_BRAND_STORAGE_KEY,
    defaultTheme = 'system',
    defaultBrand,
  } = options;

  const args = [
    JSON.stringify(storageKey),
    JSON.stringify(brandStorageKey),
    JSON.stringify(defaultTheme),
    JSON.stringify(defaultBrand ?? null),
    JSON.stringify(THEME_ATTRIBUTE),
    JSON.stringify(BRAND_ATTRIBUTE),
    JSON.stringify(DARK_MEDIA_QUERY),
  ].join(',');

  // Minified by hand rather than by a build step: it ships inline in the
  // document head, so every byte is render-blocking.
  const script = `!function(s,bs,dt,db,ta,ba,q){try{var e=document.documentElement,t=localStorage.getItem(s)||dt,r=t==="system"?(window.matchMedia(q).matches?"dark":"light"):t;e.setAttribute(ta,r);e.style.colorScheme=r;var b=localStorage.getItem(bs)||db;if(b)e.setAttribute(ba,b)}catch(_){}}(${args})`;

  // `</script>` inside an inline script would close the tag early; the escape
  // is inert to the JS parser but invisible to the HTML tokeniser.
  return script.replaceAll('</', '<\\/');
}
