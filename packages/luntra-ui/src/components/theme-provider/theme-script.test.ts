import { describe, expect, it } from 'vitest';

import { getThemeScript } from './theme-script.js';

/**
 * The inline script is the one piece of the theming system that cannot be
 * tested through React, and the one piece where a mistake is invisible until it
 * ships (a flash, or a broken document head). So it is tested as what it is:
 * a string of JavaScript, executed in isolation.
 */
describe('getThemeScript', () => {
  interface FakeRoot {
    attributes: Record<string, string>;
    style: { colorScheme: string };
    setAttribute: (name: string, value: string) => void;
  }

  function run(
    script: string,
    options: { storage?: Record<string, string>; prefersDark?: boolean; throwOnStorage?: boolean },
  ): FakeRoot {
    const attributes: Record<string, string> = {};
    const root: FakeRoot = {
      attributes,
      style: { colorScheme: '' },
      setAttribute(name, value) {
        attributes[name] = value;
      },
    };

    const store = options.storage ?? {};
    const localStorage = {
      getItem(key: string) {
        if (options.throwOnStorage) throw new Error('storage disabled');
        return store[key] ?? null;
      },
    };

    const fakeWindow = {
      matchMedia: (_query: string) => ({ matches: options.prefersDark ?? false }),
    };

    // The script ships as a string, so executing it is the only honest test.
    const fn = new Function('document', 'localStorage', 'window', script);
    fn({ documentElement: root }, localStorage, fakeWindow);

    return root;
  }

  it('applies a stored explicit preference', () => {
    const root = run(getThemeScript(), { storage: { 'luntra-ui-theme': 'dark' } });

    expect(root.attributes['data-theme']).toBe('dark');
    expect(root.style.colorScheme).toBe('dark');
  });

  it('resolves "system" against the OS preference', () => {
    const dark = run(getThemeScript(), {
      storage: { 'luntra-ui-theme': 'system' },
      prefersDark: true,
    });
    expect(dark.attributes['data-theme']).toBe('dark');

    const light = run(getThemeScript(), {
      storage: { 'luntra-ui-theme': 'system' },
      prefersDark: false,
    });
    expect(light.attributes['data-theme']).toBe('light');
  });

  it('falls back to the OS preference when nothing is stored', () => {
    const root = run(getThemeScript(), { prefersDark: true });
    expect(root.attributes['data-theme']).toBe('dark');
  });

  it('honours an explicit defaultTheme over the OS preference', () => {
    const root = run(getThemeScript({ defaultTheme: 'light' }), { prefersDark: true });
    expect(root.attributes['data-theme']).toBe('light');
  });

  it('applies a stored brand', () => {
    const root = run(getThemeScript(), { storage: { 'luntra-ui-brand': 'teal' } });
    expect(root.attributes['data-brand']).toBe('teal');
  });

  it('leaves data-brand unset when there is no brand', () => {
    const root = run(getThemeScript(), {});
    expect(root.attributes['data-brand']).toBeUndefined();
  });

  it('applies defaultBrand when nothing is stored', () => {
    const root = run(getThemeScript({ defaultBrand: 'teal' }), {});
    expect(root.attributes['data-brand']).toBe('teal');
  });

  it('respects custom storage keys', () => {
    const script = getThemeScript({ storageKey: 'app.theme', brandStorageKey: 'app.brand' });
    const root = run(script, { storage: { 'app.theme': 'dark', 'app.brand': 'teal' } });

    expect(root.attributes['data-theme']).toBe('dark');
    expect(root.attributes['data-brand']).toBe('teal');
  });

  it('does not throw when storage is unavailable', () => {
    // Safari private mode, blocked cookies, exceeded quota — `localStorage`
    // throws rather than returning null. A theme preference must never be able
    // to take the whole page down.
    expect(() => run(getThemeScript(), { throwOnStorage: true })).not.toThrow();
  });

  it('escapes closing tags so it is safe to inline in a <script>', () => {
    // An unescaped `</script>` anywhere in the payload would terminate the tag
    // early and dump the rest of the script into the document as text.
    expect(getThemeScript()).not.toContain('</');
  });
});
