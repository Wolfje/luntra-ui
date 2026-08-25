/*
 * jsx-a11y is disabled for the `render` prop cases only.
 *
 * A `render` element is a template, not the element that reaches the DOM:
 * Button merges its children, ARIA attributes and handlers into it before
 * cloning. Static analysis cannot see that, so `<a href="/" />` looks like an
 * empty anchor. What actually ships is checked against rendered output in
 * button.a11y.test.tsx.
 */
/* eslint-disable jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid -- see
   the note below; the render element is a template, not the final element */

import { createRef, type ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './button.js';

describe('Button', () => {
  describe('rendering', () => {
    it('renders a button with its label as the accessible name', () => {
      render(<Button>Save</Button>);

      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    /**
     * The HTML default is `submit`, so a button placed in a form for any other
     * purpose submits it — a bug that only appears once the component is used
     * inside a form, which is rarely where it is first tested.
     */
    it('defaults to type="button" so it cannot submit a form by accident', () => {
      render(<Button>Save</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('respects an explicit type', () => {
      render(<Button type="submit">Save</Button>);

      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('does not submit an enclosing form when used as a plain button', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());

      render(
        <form onSubmit={onSubmit}>
          <Button>Not a submit</Button>
        </form>,
      );

      await user.click(screen.getByRole('button'));

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('forwards the ref to the underlying element', () => {
      const ref = createRef<HTMLButtonElement>();

      render(<Button ref={ref}>Save</Button>);

      expect(ref.current).toBe(screen.getByRole('button'));
    });

    it('passes arbitrary props through', () => {
      render(
        <Button id="save" aria-describedby="hint">
          Save
        </Button>,
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('id', 'save');
      expect(button).toHaveAttribute('aria-describedby', 'hint');
    });

    it('keeps the consumer className alongside its own', () => {
      render(<Button className="mine">Save</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('mine');
      expect(button.className.split(' ').length).toBeGreaterThan(1);
    });
  });

  describe('data attributes', () => {
    it('exposes variant and size as a stable styling hook', () => {
      render(
        <Button variant="ghost" size="lg">
          Save
        </Button>,
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-luntra-part', 'button');
      expect(button).toHaveAttribute('data-variant', 'ghost');
      expect(button).toHaveAttribute('data-size', 'lg');
    });

    it('defaults to the primary medium button', () => {
      render(<Button>Save</Button>);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-variant', 'primary');
      expect(button).toHaveAttribute('data-size', 'md');
    });

    /**
     * `[data-disabled]` in CSS matches on presence, so rendering "false" would
     * style every enabled button as disabled.
     */
    it('omits state attributes rather than rendering them false', () => {
      render(<Button>Save</Button>);

      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('data-disabled');
      expect(button).not.toHaveAttribute('data-loading');
    });

    it('marks disabled and loading with valueless attributes', () => {
      render(
        <Button disabled loading>
          Save
        </Button>,
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-disabled', '');
      expect(button).toHaveAttribute('data-loading', '');
    });
  });

  describe('disabled', () => {
    /**
     * The central accessibility decision. A natively disabled button leaves the
     * tab order, so a screen-reader user never encounters it and gets no
     * explanation for why the action they came for has disappeared.
     */
    it('uses aria-disabled and stays focusable', async () => {
      const user = userEvent.setup();

      render(<Button disabled>Save</Button>);
      const button = screen.getByRole('button', { name: 'Save' });

      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).not.toHaveAttribute('disabled');

      await user.tab();
      expect(button).toHaveFocus();
    });

    it('blocks click', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(
        <Button disabled onClick={onClick}>
          Save
        </Button>,
      );

      await user.click(screen.getByRole('button'));

      expect(onClick).not.toHaveBeenCalled();
    });

    it.each(['{Enter}', ' '])('blocks keyboard activation with %s', async (key) => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(
        <Button disabled onClick={onClick}>
          Save
        </Button>,
      );

      screen.getByRole('button').focus();
      await user.keyboard(key);

      expect(onClick).not.toHaveBeenCalled();
    });

    /**
     * Because the element is not natively disabled, the browser will still
     * submit the form on Enter unless the default is prevented.
     */
    it('does not submit a form while disabled', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());

      render(
        <form onSubmit={onSubmit}>
          <Button type="submit" disabled>
            Save
          </Button>
        </form>,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      button.focus();
      await user.keyboard('{Enter}');

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('loading', () => {
    it('sets aria-busy and blocks activation', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(
        <Button loading onClick={onClick}>
          Save
        </Button>,
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-disabled', 'true');

      await user.click(button);
      expect(onClick).not.toHaveBeenCalled();
    });

    /**
     * Replacing the label with a spinner changes the accessible name mid-action,
     * which a screen reader announces as a different button — and announces
     * again when the action finishes.
     */
    it('keeps the accessible name unchanged', () => {
      const { rerender } = render(<Button>Save</Button>);
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();

      rerender(<Button loading>Save</Button>);
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('is not busy when idle', () => {
      render(<Button>Save</Button>);

      expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy');
    });
  });

  describe('events', () => {
    it('calls onClick when active', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<Button onClick={onClick}>Save</Button>);
      await user.click(screen.getByRole('button'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it.each(['{Enter}', ' '])('activates from the keyboard with %s', async (key) => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(<Button onClick={onClick}>Save</Button>);
      screen.getByRole('button').focus();
      await user.keyboard(key);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    /**
     * The gate is narrow on purpose: it blocks activation keys only. A disabled
     * control still lives inside things like toolbars and menus that rely on
     * arrow keys and Escape, and swallowing every key would break the
     * navigation around it.
     */
    it('blocks activation keys while disabled but passes other keys through', async () => {
      const user = userEvent.setup();
      const onKeyDown = vi.fn();

      render(
        <Button disabled onKeyDown={onKeyDown}>
          Save
        </Button>,
      );

      screen.getByRole('button').focus();

      await user.keyboard('{Enter}');
      await user.keyboard(' ');
      expect(onKeyDown).not.toHaveBeenCalled();

      await user.keyboard('{Escape}');
      await user.keyboard('{ArrowDown}');
      expect(onKeyDown).toHaveBeenCalledTimes(2);
    });
  });

  describe('render prop', () => {
    /**
     * A link is a link. Announcing it as a button while it still navigates would
     * cost the user the context menu, open-in-new-tab, and the correct
     * expectation about what pressing it does.
     */
    it('renders an anchor with the link role', () => {
      render(<Button render={<a href="/pricing" />}>Pricing</Button>);

      const link = screen.getByRole('link', { name: 'Pricing' });
      expect(link).toHaveAttribute('href', '/pricing');
      expect(link).toHaveAttribute('data-luntra-part', 'button');
      expect(link).not.toHaveAttribute('role');
      expect(link).not.toHaveAttribute('tabindex');
    });

    it('blocks navigation on a disabled link', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(
        <Button render={<a href="/pricing" />} disabled onClick={onClick}>
          Pricing
        </Button>,
      );

      await user.click(screen.getByRole('link'));

      expect(onClick).not.toHaveBeenCalled();
    });

    it('does not put a type attribute on a non-button element', () => {
      render(<Button render={<a href="/pricing" />}>Pricing</Button>);

      expect(screen.getByRole('link')).not.toHaveAttribute('type');
    });

    it('adds role and tabIndex when the element is not interactive', () => {
      render(<Button render={<span />}>Press</Button>);

      const button = screen.getByRole('button', { name: 'Press' });
      expect(button.tagName).toBe('SPAN');
      expect(button).toHaveAttribute('tabindex', '0');
    });

    /**
     * SC 2.1.1: an element presenting itself as a button must be operable from
     * the keyboard. Space does not activate a span natively.
     */
    it('activates a non-button element with Space', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(
        <Button render={<span />} onClick={onClick}>
          Press
        </Button>,
      );

      screen.getByRole('button').focus();
      await user.keyboard(' ');

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    /**
     * A disabled control stays in the tab order for the same reason a disabled
     * button does: a user must be able to reach it and find out why it will not
     * work, rather than watch it vanish.
     */
    it('keeps a disabled non-button element focusable but inert', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      render(
        <Button render={<span />} disabled onClick={onClick}>
          Press
        </Button>,
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('tabindex', '0');
      expect(button).toHaveAttribute('aria-disabled', 'true');

      await user.click(button);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('does not add a redundant role to a native button', () => {
      render(<Button render={<button type="submit" />}>Save</Button>);

      const button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('role');
      expect(button).toHaveAttribute('type', 'submit');
    });

    /**
     * An anchor without an href is neither focusable nor a link, so it needs
     * the full button treatment rather than being trusted as one.
     */
    it('treats an anchor with no href as a custom element', () => {
      render(<Button render={<a>Press</a>} />);

      const button = screen.getByRole('button', { name: 'Press' });
      expect(button).toHaveAttribute('tabindex', '0');
    });

    /**
     * Caught by the docs site, which renders its call-to-action buttons as
     * TanStack `<Link>`s.
     *
     * A router link is a *component*, so `render.type` is a function and the
     * anchor it emits does not exist yet when the element kind is decided. The
     * component used to classify it as custom and stamp `role="button"` onto a
     * real anchor — announcing it as a button while it still navigated, and
     * costing the user the link role, the context menu and open-in-new-tab.
     */
    it('treats a router link component as a link, not a custom element', () => {
      function RouterLink({ to, ...props }: { to: string } & ComponentProps<'a'>) {
        return <a href={to} {...props} />;
      }

      render(<Button render={<RouterLink to="/pricing" />}>Pricing</Button>);

      const link = screen.getByRole('link', { name: 'Pricing' });
      expect(link).toHaveAttribute('href', '/pricing');
      expect(link).not.toHaveAttribute('role');
      expect(link).not.toHaveAttribute('tabindex');
    });

    it('treats a component with an href the same way', () => {
      function Anchor(props: ComponentProps<'a'>) {
        return <a {...props} />;
      }

      render(<Button render={<Anchor href="/pricing" />}>Pricing</Button>);

      expect(screen.getByRole('link', { name: 'Pricing' })).not.toHaveAttribute('role');
    });

    /**
     * The conservative half of the same rule. A component with no destination
     * might render anything, so it gets the full button treatment: redundant if
     * it turns out to render a `<button>`, but a `<div>` is left operable
     * rather than unreachable.
     */
    it('gives a component with no destination the full button treatment', () => {
      function Box(props: ComponentProps<'div'>) {
        return <div {...props} />;
      }

      render(<Button render={<Box />}>Press</Button>);

      const button = screen.getByRole('button', { name: 'Press' });
      expect(button.tagName).toBe('DIV');
      expect(button).toHaveAttribute('tabindex', '0');
    });

    /**
     * `href` on a `<span>` is inert, so it says nothing about the element's
     * role. Only an anchor can navigate.
     *
     * TypeScript rejects `href` on a span, which is exactly why the cast is
     * here: the guard exists for JavaScript consumers the compiler cannot
     * reach, and for props spread in from an untyped source.
     */
    it('does not treat an href on a non-anchor intrinsic element as navigation', () => {
      const inertHref = { href: '/pricing' } as unknown as ComponentProps<'span'>;

      render(<Button render={<span {...inertHref} />}>Press</Button>);

      const button = screen.getByRole('button', { name: 'Press' });
      expect(button).toHaveAttribute('tabindex', '0');
    });
  });
});
