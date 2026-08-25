/**
 * jsx-a11y is disabled for this file, and only this file.
 *
 * A `render` element is a *template*, not the element that reaches the DOM:
 * `renderElement` merges the component's `children`, `aria-*` and event
 * handlers into it before cloning. Static analysis cannot see that, so every
 * `<a href="/" />` here looks like an empty, inaccessible anchor.
 *
 * Nothing is lost by turning the rules off: what actually ships is checked
 * against rendered output by the axe suites, which is where a real anchor
 * accessibility problem would surface anyway.
 */
/* eslint-disable jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid */

import { createRef } from 'react';
import { render as renderToDom, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { renderElement } from './render-element.js';

describe('renderElement', () => {
  it('creates the default element when no render prop is given', () => {
    renderToDom(renderElement('button', { children: 'Press' }, undefined));

    expect(screen.getByRole('button', { name: 'Press' })).toBeInTheDocument();
  });

  /**
   * The reason the render prop exists: a control that navigates must be an
   * anchor, or keyboard and screen-reader users get the wrong role and keys.
   */
  it('swaps the element while keeping the component props', () => {
    renderToDom(
      renderElement(
        'button',
        { children: 'Pricing', className: 'root', 'data-luntra-part': 'button' },
        <a href="/pricing" />,
      ),
    );

    const link = screen.getByRole('link', { name: 'Pricing' });
    expect(link).toHaveAttribute('href', '/pricing');
    expect(link).toHaveClass('root');
    expect(link).toHaveAttribute('data-luntra-part', 'button');
  });

  it('combines className from both sides', () => {
    renderToDom(
      renderElement('button', { className: 'root', children: 'x' }, <a className="mine" />),
    );

    expect(screen.getByText('x')).toHaveClass('root', 'mine');
  });

  it('lets the render element override plain props', () => {
    renderToDom(
      renderElement(
        'button',
        { 'aria-label': 'from component', children: 'x' },
        <a aria-label="from consumer" />,
      ),
    );

    expect(screen.getByLabelText('from consumer')).toBeInTheDocument();
  });

  it('chains event handlers from both sides', async () => {
    const user = userEvent.setup();
    const order: string[] = [];

    renderToDom(
      renderElement(
        'button',
        { onClick: () => order.push('component'), children: 'Press' },
        <button type="button" onClick={() => order.push('consumer')} />,
      ),
    );

    await user.click(screen.getByRole('button', { name: 'Press' }));

    expect(order).toEqual(['consumer', 'component']);
  });

  it('merges refs so both sides keep a reference to the node', () => {
    const componentRef = createRef<HTMLElement>();
    const consumerRef = vi.fn();

    renderToDom(
      renderElement(
        'button',
        { ref: componentRef, children: 'Press' },
        <button type="button" ref={consumerRef} />,
      ),
    );

    const node = screen.getByRole('button', { name: 'Press' });
    expect(componentRef.current).toBe(node);
    expect(consumerRef).toHaveBeenCalledWith(node);
  });

  it('keeps the component ref when the render element has none', () => {
    const componentRef = createRef<HTMLElement>();

    renderToDom(renderElement('button', { ref: componentRef, children: 'Press' }, <a href="/" />));

    expect(componentRef.current).toBe(screen.getByRole('link', { name: 'Press' }));
  });

  it('rejects a component type with an actionable message', () => {
    expect(() =>
      // @ts-expect-error -- the point of the test is the runtime guard
      renderElement('button', {}, 'a'),
    ).toThrow(/must be a React element/);
  });
});
