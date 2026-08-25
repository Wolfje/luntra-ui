import { useEffect, useLayoutEffect } from 'react';

import { canUseDom } from '../utils/dom.js';

/**
 * `useLayoutEffect` in the browser, `useEffect` on the server.
 *
 * React warns when `useLayoutEffect` runs during server rendering, because it
 * cannot run before paint on the server. Swapping to `useEffect` there keeps
 * the console clean without giving up synchronous, pre-paint measurement in the
 * browser — which is what layout effects are for.
 *
 * Use this anywhere a component needs to read or write the DOM before the user
 * sees the frame.
 */
export const useIsomorphicLayoutEffect = canUseDom ? useLayoutEffect : useEffect;
