import { act, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useControllableState } from './use-controllable-state.js';
import { useMergedRefs } from './use-merged-refs.js';
import { resetDevWarnings } from '../utils/dev-warn.js';

describe('useControllableState', () => {
  beforeEach(() => {
    resetDevWarnings();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('uncontrolled', () => {
    it('starts at the default value', () => {
      const { result } = renderHook(() =>
        useControllableState({ value: undefined, defaultValue: 'a' }),
      );

      expect(result.current[0]).toBe('a');
    });

    it('updates when the setter is called', () => {
      const { result } = renderHook(() =>
        useControllableState({ value: undefined, defaultValue: 'a' }),
      );

      act(() => result.current[1]('b'));

      expect(result.current[0]).toBe('b');
    });

    /**
     * Consumers frequently want to observe changes without taking control.
     * Firing only when controlled would make `defaultChecked` + `onChange`
     * silently do nothing.
     */
    it('still calls onChange', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useControllableState({ value: undefined, defaultValue: 'a', onChange }),
      );

      act(() => result.current[1]('b'));

      expect(onChange).toHaveBeenCalledWith('b');
    });
  });

  describe('controlled', () => {
    it('reports the controlled value', () => {
      const { result } = renderHook(() =>
        useControllableState({ value: 'controlled', defaultValue: 'a' }),
      );

      expect(result.current[0]).toBe('controlled');
    });

    it('does not change value on its own', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useControllableState({ value: 'controlled', defaultValue: 'a', onChange }),
      );

      act(() => result.current[1]('ignored'));

      expect(result.current[0]).toBe('controlled');
      expect(onChange).toHaveBeenCalledWith('ignored');
    });

    it('follows the prop when it changes', () => {
      const { result, rerender } = renderHook(
        ({ value }: { value: string | undefined }) =>
          useControllableState({ value, defaultValue: 'a' }),
        { initialProps: { value: 'one' as string | undefined } },
      );

      rerender({ value: 'two' });

      expect(result.current[0]).toBe('two');
    });
  });

  describe('mode switching', () => {
    /**
     * Almost always a bug — usually `value={someUndefinedProp}` — and the
     * symptoms look nothing like the cause.
     */
    it('warns when a component becomes controlled', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { rerender } = renderHook(
        ({ value }: { value: string | undefined }) =>
          useControllableState({ value, defaultValue: 'a', name: 'Switch' }),
        { initialProps: { value: undefined as string | undefined } },
      );

      rerender({ value: 'now controlled' });

      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Switch changed from uncontrolled to controlled'),
      );
    });

    it('warns when a component becomes uncontrolled', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { rerender } = renderHook(
        ({ value }: { value: string | undefined }) =>
          useControllableState({ value, defaultValue: 'a', name: 'Switch' }),
        { initialProps: { value: 'controlled' as string | undefined } },
      );

      rerender({ value: undefined });

      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Switch changed from controlled to uncontrolled'),
      );
    });

    it('stays quiet when the mode is consistent', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { rerender } = renderHook(
        ({ value }: { value: string }) => useControllableState({ value, defaultValue: 'a' }),
        { initialProps: { value: 'one' } },
      );

      rerender({ value: 'two' });

      expect(warn).not.toHaveBeenCalled();
    });
  });

  /**
   * A setter whose identity changed every render would defeat memoisation in
   * every component that passes it down.
   */
  it('keeps a stable setter identity across renders', () => {
    const { result, rerender } = renderHook(
      ({ onChange }: { onChange: () => void }) =>
        useControllableState({ value: undefined, defaultValue: 'a', onChange }),
      { initialProps: { onChange: () => {} } },
    );

    const first = result.current[1];
    rerender({ onChange: () => {} });

    expect(result.current[1]).toBe(first);
  });

  it('calls the latest onChange even though the setter identity is stable', () => {
    const first = vi.fn();
    const second = vi.fn();

    const { result, rerender } = renderHook(
      ({ onChange }: { onChange: () => void }) =>
        useControllableState({ value: undefined, defaultValue: 'a', onChange }),
      { initialProps: { onChange: first } },
    );

    rerender({ onChange: second });
    act(() => result.current[1]('b'));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('b');
  });
});

describe('useMergedRefs', () => {
  it('gives every ref the mounted node', () => {
    const objectRef = { current: null as HTMLButtonElement | null };
    const callbackRef = vi.fn();

    function Probe() {
      const ref = useMergedRefs<HTMLButtonElement>(objectRef, callbackRef);
      return (
        <button type="button" ref={ref}>
          Press
        </button>
      );
    }

    render(<Probe />);

    const node = screen.getByRole('button', { name: 'Press' });
    expect(objectRef.current).toBe(node);
    expect(callbackRef).toHaveBeenCalledWith(node);
  });

  it('clears the refs on unmount', () => {
    const objectRef = { current: null as HTMLButtonElement | null };

    function Probe() {
      const ref = useMergedRefs<HTMLButtonElement>(objectRef);
      return <button type="button" ref={ref} />;
    }

    const { unmount } = render(<Probe />);
    expect(objectRef.current).not.toBeNull();

    unmount();
    expect(objectRef.current).toBeNull();
  });

  /**
   * React detaches and reattaches a callback ref whose identity changed, so an
   * unstable one re-fires ref effects on every render and breaks anything
   * observing the node. Stability is the entire reason this is a hook.
   */
  it('does not reattach when re-rendered with the same refs', () => {
    const objectRef = { current: null as HTMLButtonElement | null };
    const attach = vi.fn();
    const stableCallbackRef = (node: HTMLButtonElement | null) => {
      if (node) attach();
    };

    function Probe({ label }: { label: string }) {
      const ref = useMergedRefs<HTMLButtonElement>(objectRef, stableCallbackRef);
      return (
        <button type="button" ref={ref}>
          {label}
        </button>
      );
    }

    const { rerender } = render(<Probe label="one" />);
    expect(attach).toHaveBeenCalledTimes(1);

    rerender(<Probe label="two" />);
    rerender(<Probe label="three" />);

    expect(attach).toHaveBeenCalledTimes(1);
    expect(objectRef.current).toBe(screen.getByRole('button', { name: 'three' }));
  });

  it('reattaches when a ref identity actually changes', () => {
    const attach = vi.fn();

    function Probe({ token }: { token: string }) {
      const ref = useMergedRefs<HTMLButtonElement>((node) => {
        if (node) attach(token);
      });
      return <button type="button" ref={ref} />;
    }

    const { rerender } = render(<Probe token="one" />);
    rerender(<Probe token="two" />);

    expect(attach).toHaveBeenNthCalledWith(1, 'one');
    expect(attach).toHaveBeenNthCalledWith(2, 'two');
  });
});
