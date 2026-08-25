/* eslint-disable jsx-a11y/anchor-has-content -- see button.test.tsx; the render
   element is a template and its children are merged in at runtime */

import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Button } from './button.js';

/**
 * Runs in the `ssr` project: Node, no jsdom, no DOM globals at all.
 *
 * Two separate guarantees are being made here. First, that rendering never
 * touches a browser global — an unguarded `window` would throw in a consumer's
 * production server rather than in their tests. Second, that the server's
 * markup is exactly what the client produces on its first render, because any
 * difference is a hydration mismatch, and React resolves those by discarding
 * the server HTML and re-rendering the whole tree on the client.
 */
describe('Button on the server', () => {
  it('renders without a DOM', () => {
    expect(() => renderToString(<Button>Save</Button>)).not.toThrow();
  });

  it('emits the accessible name in the server HTML', () => {
    expect(renderToString(<Button>Save</Button>)).toContain('Save');
  });

  it('emits the styling hooks so the first paint is already correct', () => {
    const html = renderToString(
      <Button variant="ghost" size="lg">
        Save
      </Button>,
    );

    expect(html).toContain('data-luntra-part="button"');
    expect(html).toContain('data-variant="ghost"');
    expect(html).toContain('data-size="lg"');
  });

  it('emits type="button" so a form is safe before hydration', () => {
    expect(renderToString(<Button>Save</Button>)).toContain('type="button"');
  });

  /**
   * The disabled state has to be correct in the server HTML, not applied on
   * hydration. A button that is live for the first few hundred milliseconds of
   * a page's life is a real defect on a slow connection.
   */
  it('emits aria-disabled rather than the native attribute', () => {
    const html = renderToString(<Button disabled>Save</Button>);

    expect(html).toContain('aria-disabled="true"');
    // Matched as a standalone attribute: `data-disabled=""` contains the
    // substring `disabled=""` and would pass a naive check.
    expect(html).not.toMatch(/\sdisabled(=|\s|>)/);
  });

  it('emits aria-busy while loading', () => {
    expect(renderToString(<Button loading>Save</Button>)).toContain('aria-busy="true"');
  });

  it('omits state attributes rather than serialising them false', () => {
    const html = renderToString(<Button>Save</Button>);

    expect(html).not.toContain('data-disabled');
    expect(html).not.toContain('data-loading');
    expect(html).not.toContain('aria-disabled');
  });

  it('renders the render prop element on the server too', () => {
    const html = renderToString(<Button render={<a href="/pricing" />}>Pricing</Button>);

    expect(html).toContain('<a');
    expect(html).toContain('href="/pricing"');
    expect(html).not.toContain('type="button"');
    expect(html).not.toContain('role="button"');
  });

  it('adds role and tabindex to a non-interactive element before hydration', () => {
    const html = renderToString(<Button render={<span />}>Press</Button>);

    expect(html).toContain('role="button"');
    expect(html).toContain('tabindex="0"');
  });

  /**
   * Output must depend only on props. If anything read the environment, the
   * same props would produce different HTML on server and client.
   */
  it('is deterministic across renders', () => {
    const once = renderToString(<Button variant="secondary">Save</Button>);
    const twice = renderToString(<Button variant="secondary">Save</Button>);

    expect(once).toBe(twice);
  });
});
