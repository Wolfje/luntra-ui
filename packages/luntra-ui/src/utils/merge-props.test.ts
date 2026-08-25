import { describe, expect, it, vi } from 'vitest';

import { composeEventHandlers } from './compose-event-handlers.js';
import { mergeProps } from './merge-props.js';
import { mergeRefs } from './merge-refs.js';

function fakeEvent(defaultPrevented = false) {
  return {
    defaultPrevented,
    preventDefault() {
      this.defaultPrevented = true;
    },
  };
}

describe('composeEventHandlers', () => {
  it('runs the consumer handler before the library handler', () => {
    const order: string[] = [];
    const handler = composeEventHandlers(
      () => order.push('consumer'),
      () => order.push('library'),
    );

    handler(fakeEvent() as never);

    expect(order).toEqual(['consumer', 'library']);
  });

  /**
   * The whole point of the ordering: a consumer must be able to opt out of the
   * library's behaviour. If they could not, they would have to fork.
   */
  it('lets the consumer suppress the library handler with preventDefault', () => {
    const library = vi.fn();
    const handler = composeEventHandlers((event: ReturnType<typeof fakeEvent>) => {
      event.preventDefault();
    }, library);

    handler(fakeEvent() as never);

    expect(library).not.toHaveBeenCalled();
  });

  it('respects an event that arrived already default-prevented', () => {
    const library = vi.fn();
    const handler = composeEventHandlers(undefined, library);

    handler(fakeEvent(true) as never);

    expect(library).not.toHaveBeenCalled();
  });

  it('runs the library handler regardless when checkForDefaultPrevented is false', () => {
    const library = vi.fn();
    const handler = composeEventHandlers(
      (event: ReturnType<typeof fakeEvent>) => event.preventDefault(),
      library,
      { checkForDefaultPrevented: false },
    );

    handler(fakeEvent() as never);

    expect(library).toHaveBeenCalledTimes(1);
  });

  it('tolerates either handler being absent', () => {
    expect(() => composeEventHandlers(undefined, undefined)(fakeEvent() as never)).not.toThrow();
  });
});

describe('mergeProps', () => {
  it('chains event handlers instead of replacing them', () => {
    const order: string[] = [];
    const merged = mergeProps(
      { onClick: () => order.push('library') },
      { onClick: () => order.push('consumer') },
    );

    (merged.onClick as (event: unknown) => void)(fakeEvent());

    expect(order).toEqual(['consumer', 'library']);
  });

  it('concatenates className rather than dropping the component styling', () => {
    expect(mergeProps({ className: 'root' }, { className: 'mine' }).className).toBe('root mine');
  });

  it('shallow-merges style so setting one property keeps the rest', () => {
    const merged = mergeProps({ style: { color: 'red', margin: 0 } }, { style: { color: 'blue' } });

    expect(merged.style).toEqual({ color: 'blue', margin: 0 });
  });

  it('overrides plain values', () => {
    expect(mergeProps({ 'aria-label': 'a' }, { 'aria-label': 'b' })['aria-label']).toBe('b');
  });

  /**
   * Spreading an object with optional keys must not blank out the base. This is
   * the most common way a merge helper surprises people.
   */
  it('treats undefined in the override as "not specified"', () => {
    const overrides: { id: string | undefined } = { id: undefined };

    expect(mergeProps({ id: 'keep' }, overrides).id).toBe('keep');
  });

  it('adds keys the base does not have', () => {
    expect(mergeProps({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
  });

  it('does not mutate either input', () => {
    const base = { className: 'root' };
    const overrides = { className: 'mine' };

    mergeProps(base, overrides);

    expect(base).toEqual({ className: 'root' });
    expect(overrides).toEqual({ className: 'mine' });
  });

  it('replaces an event handler when the base has no handler to chain', () => {
    const consumer = vi.fn();
    const merged = mergeProps({} as Record<string, unknown>, { onClick: consumer });

    (merged.onClick as (event: unknown) => void)(fakeEvent());

    expect(consumer).toHaveBeenCalledTimes(1);
  });
});

describe('mergeRefs', () => {
  it('assigns the node to object refs and callback refs alike', () => {
    const objectRef = { current: null as string | null };
    const callbackRef = vi.fn();

    mergeRefs<string>(objectRef, callbackRef)('node');

    expect(objectRef.current).toBe('node');
    expect(callbackRef).toHaveBeenCalledWith('node');
  });

  it('skips null and undefined refs', () => {
    expect(() => mergeRefs<string>(null, undefined)('node')).not.toThrow();
  });

  /**
   * React 19 stops calling a ref callback with `null` once it returns a cleanup,
   * so without this every merged ref would keep a detached DOM node alive.
   */
  it('clears object refs through the returned cleanup', () => {
    const objectRef = { current: null as string | null };

    const cleanup = mergeRefs<string>(objectRef)('node');
    expect(objectRef.current).toBe('node');

    cleanup();
    expect(objectRef.current).toBeNull();
  });

  it('calls a callback ref with null on cleanup when it returned no cleanup of its own', () => {
    const callbackRef = vi.fn();

    mergeRefs<string>(callbackRef)('node')();

    expect(callbackRef).toHaveBeenNthCalledWith(1, 'node');
    expect(callbackRef).toHaveBeenNthCalledWith(2, null);
  });

  it('prefers a cleanup the callback ref returned itself', () => {
    const ownCleanup = vi.fn();
    const callbackRef = vi.fn(() => ownCleanup);

    mergeRefs<string>(callbackRef)('node')();

    expect(ownCleanup).toHaveBeenCalledTimes(1);
    expect(callbackRef).toHaveBeenCalledTimes(1);
  });
});
