import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ThemeProvider } from './theme-provider.js';
import { getThemeScript } from './theme-script.js';

/**
 * Runs in the `ssr` project: Node, no jsdom, no DOM globals at all. Any
 * unguarded `window`/`document`/`localStorage` access during render throws here
 * rather than in a consumer's production server.
 */
describe('ThemeProvider on the server', () => {
  it('renders without a DOM', () => {
    expect(() =>
      renderToString(
        <ThemeProvider>
          <p>content</p>
        </ThemeProvider>,
      ),
    ).not.toThrow();
  });

  it('emits no wrapper markup of its own', () => {
    const html = renderToString(
      <ThemeProvider>
        <p>content</p>
      </ThemeProvider>,
    );

    expect(html).toBe('<p>content</p>');
  });

  it('produces identical markup regardless of theme', () => {
    // This is the property that makes hydration mismatches impossible: the
    // server has no idea which theme the client will resolve to, so it must not
    // encode one. Theming happens entirely in the CSS cascade.
    const light = renderToString(
      <ThemeProvider defaultTheme="light">
        <p>content</p>
      </ThemeProvider>,
    );
    const dark = renderToString(
      <ThemeProvider defaultTheme="dark">
        <p>content</p>
      </ThemeProvider>,
    );
    const system = renderToString(
      <ThemeProvider defaultTheme="system">
        <p>content</p>
      </ThemeProvider>,
    );

    expect(light).toBe(dark);
    expect(dark).toBe(system);
  });

  it('produces identical markup regardless of brand', () => {
    const none = renderToString(
      <ThemeProvider>
        <p>content</p>
      </ThemeProvider>,
    );
    const teal = renderToString(
      <ThemeProvider defaultBrand="teal">
        <p>content</p>
      </ThemeProvider>,
    );

    expect(none).toBe(teal);
  });

  it('builds the no-flash script without a DOM', () => {
    // The script is generated on the server and executed in the browser, so it
    // must be a pure string build with no environment access.
    const script = getThemeScript({ defaultBrand: 'teal' });

    expect(script).toContain('data-theme');
    expect(script).toContain('teal');
  });
});
