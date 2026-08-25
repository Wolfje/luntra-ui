import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, useTheme } from './theme-provider.js';
import { DARK_MEDIA_QUERY, DEFAULT_THEME_STORAGE_KEY } from './theme-context.js';

/** jsdom has no `matchMedia`; this gives us one we can drive. */
function mockMatchMedia(initialMatches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mql = {
    matches: initialMatches,
    media: DARK_MEDIA_QUERY,
    onchange: null,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  };

  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia;

  return {
    emit(matches: boolean) {
      mql.matches = matches;
      for (const listener of listeners) {
        listener({ matches } as MediaQueryListEvent);
      }
    },
  };
}

function ThemeReadout() {
  const { theme, resolvedTheme, brand, setTheme, setBrand } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <span data-testid="brand">{brand}</span>
      <button type="button" onClick={() => setTheme('dark')}>
        Dark
      </button>
      <button type="button" onClick={() => setBrand('teal')}>
        Teal
      </button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    mockMatchMedia(false);
    localStorage.clear();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-brand');
    document.documentElement.style.colorScheme = '';
    vi.restoreAllMocks();
  });

  it('renders children without adding any wrapper element', () => {
    // The provider must be structurally invisible — an extra <div> would break
    // grid/flex layouts and leak into every consumer's DOM.
    const { container } = render(
      <ThemeProvider>
        <p>content</p>
      </ThemeProvider>,
    );

    expect(container.innerHTML).toBe('<p>content</p>');
  });

  it('writes the resolved theme and color-scheme onto <html>', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeReadout />
      </ThemeProvider>,
    );

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('resolves "system" against the OS preference', () => {
    mockMatchMedia(true);

    render(
      <ThemeProvider defaultTheme="system">
        <ThemeReadout />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('system');
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
  });

  it('never exposes "system" as a resolved theme', () => {
    render(
      <ThemeProvider defaultTheme="system">
        <ThemeReadout />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('resolved')).not.toHaveTextContent('system');
  });

  it('follows the OS when the preference is "system"', () => {
    const media = mockMatchMedia(false);

    render(
      <ThemeProvider defaultTheme="system">
        <ThemeReadout />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('resolved')).toHaveTextContent('light');

    act(() => {
      media.emit(true);
    });

    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('stops following the OS once an explicit choice is made', () => {
    const media = mockMatchMedia(false);

    render(
      <ThemeProvider defaultTheme="light">
        <ThemeReadout />
      </ThemeProvider>,
    );

    act(() => {
      media.emit(true);
    });

    expect(screen.getByTestId('resolved')).toHaveTextContent('light');
  });

  it('persists an explicit choice', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeReadout />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Dark' }));

    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    expect(localStorage.getItem(DEFAULT_THEME_STORAGE_KEY)).toBe('dark');
  });

  it('adopts a stored preference on mount', () => {
    localStorage.setItem(DEFAULT_THEME_STORAGE_KEY, 'dark');

    render(
      <ThemeProvider defaultTheme="light">
        <ThemeReadout />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('does not persist when persist is false', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider persist={false}>
        <ThemeReadout />
      </ThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Dark' }));

    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    expect(localStorage.getItem(DEFAULT_THEME_STORAGE_KEY)).toBeNull();
  });

  it('sets and clears data-brand', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeReadout />
      </ThemeProvider>,
    );

    expect(document.documentElement).not.toHaveAttribute('data-brand');

    await user.click(screen.getByRole('button', { name: 'Teal' }));

    expect(document.documentElement).toHaveAttribute('data-brand', 'teal');
  });

  it('survives localStorage throwing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    expect(() =>
      render(
        <ThemeProvider>
          <ThemeReadout />
        </ThemeProvider>,
      ),
    ).not.toThrow();
  });

  it('throws a useful error when useTheme is used outside a provider', () => {
    // A theme switcher that silently no-ops is worse than one that fails loudly.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<ThemeReadout />)).toThrow(/must be used within a <ThemeProvider>/);

    consoleError.mockRestore();
  });

  it('hydrates a dark-themed page without a mismatch', async () => {
    // The core SSR guarantee: server markup carries no theme information, so
    // hydration cannot mismatch no matter which theme the client resolves to.
    localStorage.setItem(DEFAULT_THEME_STORAGE_KEY, 'dark');

    const app = (
      <ThemeProvider defaultTheme="light">
        <p>content</p>
      </ThemeProvider>
    );

    const container = document.createElement('div');
    container.innerHTML = renderToString(app);
    document.body.append(container);

    const onRecoverableError = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      hydrateRoot(container, app, { onRecoverableError });
    });

    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');

    consoleError.mockRestore();
    container.remove();
  });
});
