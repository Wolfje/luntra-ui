'use client';

import { useCallback } from 'react';
import type { Ref } from 'react';

import { mergeRefs } from '../utils/merge-refs.js';

/**
 * Memoised {@link mergeRefs}.
 *
 * The dependency array is the spread `refs`, so the merged callback keeps a
 * stable identity for as long as the individual refs do. That stability is the
 * entire point of using a hook here: React detaches and reattaches a callback
 * ref whose identity changed, so an unstable one re-fires ref effects on every
 * render and breaks anything observing the node.
 */
export function useMergedRefs<T>(...refs: (Ref<T> | undefined)[]): (node: T | null) => () => void {
  /*
   * The dependency array is the spread `refs`, which the React Compiler lint
   * rules reject because they cannot verify a non-literal list. The pattern is
   * correct and deliberate: the merged callback must keep its identity for
   * exactly as long as the individual refs keep theirs.
   *
   * Both alternatives are worse. Returning an unmemoised callback makes React
   * detach and reattach the ref on every render, re-firing ref effects and
   * breaking anything observing the node. Caching the refs in another ref would
   * mean writing that ref during render, which is the thing the compiler is
   * genuinely trying to prevent.
   *
   * The behaviour this guards is asserted directly in hooks.test.tsx.
   */
  /* eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo --
     the refs themselves are the dependency list; see above */
  return useCallback(mergeRefs(...refs), refs);
}
