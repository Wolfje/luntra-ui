import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { MDXProvider } from '@mdx-js/react';

import { ThemeProvider, getThemeScript } from '../lib/luntra.js';
import { mdxComponents } from '../components/mdx-components.js';
import { SiteNav } from '../components/site-nav.js';
import { ThemeControls } from '../components/theme-controls.js';

import '@luntra-ui/react/styles';
import docsCss from '../styles/docs.css?url';

const DEFAULT_BRAND = 'default';

/**
 * Runs synchronously in `<head>` before first paint, so the stored theme is on
 * `<html>` by the time anything is painted. Without it the page paints light,
 * then repaints dark — a flash that is unpleasant for everyone and genuinely
 * painful for light-sensitive readers, and one that React cannot prevent
 * because React runs after the first paint.
 */
const themeScript = getThemeScript({ defaultTheme: 'system', defaultBrand: DEFAULT_BRAND });

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Luntra UI' },
      {
        name: 'description',
        content: 'Accessible, themeable React components. WCAG 2.2 AA by default.',
      },
    ],
    links: [{ rel: 'stylesheet', href: docsCss }],
    scripts: [{ children: themeScript }],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    /*
      `lang` is not decoration: it tells a screen reader which voice and
      pronunciation rules to use. Without it, English is read with whatever
      the user's default language happens to be. WCAG 2.2 SC 3.1.1.

      `suppressHydrationWarning` because the inline script above writes
      `data-theme` and `style` onto this element before React hydrates, so the
      server markup and the live DOM legitimately differ.
    */
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider defaultTheme="system" defaultBrand={DEFAULT_BRAND}>
          <MDXProvider components={mdxComponents}>
            <AppShell>{children}</AppShell>
          </MDXProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}

function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      {/*
        The skip link is the first focusable thing in the document. Without it,
        a keyboard user pays for the sidebar on every single page load — WCAG
        2.2 SC 2.4.1. It is visually hidden until focused, which is why it is a
        real anchor rather than a hidden one: `display: none` is not focusable.
      */}
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <header className="site-header">
        <a className="site-header__brand" href="/">
          Luntra&nbsp;UI
        </a>
        <ThemeControls />
      </header>

      <div className="site-layout">
        <SiteNav />
        {/*
          `tabIndex={-1}` so the skip link can actually move focus here.
          Without it the browser scrolls to the target but leaves focus on the
          link, and the next Tab goes straight back into the navigation the
          user just skipped.
        */}
        <main className="site-main" id="main" tabIndex={-1}>
          {children}
        </main>
      </div>
    </>
  );
}
