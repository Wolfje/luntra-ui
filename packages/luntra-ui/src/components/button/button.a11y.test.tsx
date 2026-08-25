/* eslint-disable jsx-a11y/anchor-has-content -- see button.test.tsx; the render
   element is a template and its children are merged in at runtime */

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { Button } from './button.js';
import type { ButtonSize, ButtonVariant } from './button.types.js';

/**
 * Automated accessibility checks over the rendered output.
 *
 * axe catches roughly a third of real accessibility problems, so this is a
 * regression net rather than a certificate — the behavioural guarantees that
 * matter most (focusability while disabled, a stable accessible name while
 * loading, keyboard activation of non-button elements) are asserted directly in
 * button.test.tsx, and colour contrast is proved against the tokens themselves
 * in tokens.contrast.test.ts.
 *
 * axe is not asked to evaluate contrast here: jsdom does not resolve CSS custom
 * properties or load the stylesheet, so every colour rule would report against
 * transparent-on-transparent and mean nothing.
 */

const variants: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'destructive'];
const sizes: ButtonSize[] = ['sm', 'md', 'lg'];

describe('Button accessibility', () => {
  it.each(variants)('has no violations as a %s button', async (variant) => {
    const { container } = render(<Button variant={variant}>Save</Button>);

    expect(await axe(container)).toHaveNoViolations();
  });

  it.each(sizes)('has no violations at size %s', async (size) => {
    const { container } = render(<Button size={size}>Save</Button>);

    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations when disabled', async () => {
    const { container } = render(<Button disabled>Save</Button>);

    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations when loading', async () => {
    const { container } = render(<Button loading>Save</Button>);

    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations rendered as a link', async () => {
    const { container } = render(<Button render={<a href="/pricing" />}>Pricing</Button>);

    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no violations rendered as a span with an explicit role', async () => {
    const { container } = render(<Button render={<span />}>Press</Button>);

    expect(await axe(container)).toHaveNoViolations();
  });

  /**
   * SC 4.1.2 requires a name, and axe's `button-name` rule is one of the few
   * checks that reliably catches a real, common defect: an icon-only button.
   */
  it('flags a button with no accessible name', async () => {
    const { container } = render(<Button />);

    expect(await axe(container)).not.toHaveNoViolations();
  });

  it('accepts an icon-only button labelled with aria-label', async () => {
    const { container } = render(<Button aria-label="Close" />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
