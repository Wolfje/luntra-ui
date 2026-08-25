import type { Ref } from 'react';

/**
 * Combine several refs into one callback ref.
 *
 * There is only one `ref` slot on an element, so a component that needs its own
 * reference to a node — to measure it, focus it, or observe it — still has to
 * honour whatever ref the consumer passed. Merging is the only way both get one.
 *
 * ## Why a cleanup function is returned
 *
 * React 19 calls the cleanup returned by a callback ref on unmount, and when a
 * cleanup is present it no longer re-invokes the callback with `null`. Relying
 * on the old `null` call would leave every merged ref pointing at a detached
 * DOM node for as long as the consumer held it.
 *
 * Prefer {@link import('../hooks/use-merged-refs.js').useMergedRefs} inside
 * components: an unstable ref callback is detached and reattached on every
 * render, which re-fires ref effects and breaks anything observing the node.
 */
export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): (node: T | null) => () => void {
  return function setRef(node: T | null) {
    const cleanups: (() => void)[] = [];

    for (const ref of refs) {
      if (!ref) continue;

      if (typeof ref === 'function') {
        const cleanup = ref(node);
        cleanups.push(typeof cleanup === 'function' ? cleanup : () => ref(null));
      } else {
        ref.current = node;
        cleanups.push(() => {
          ref.current = null;
        });
      }
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  };
}
