/**
 * `@luntra-ui/react/utils` — small, dependency-free helpers used across the
 * library. Exported because building a component that sits alongside these
 * ones should not mean reimplementing them.
 */

export {
  canUseDom,
  getDocument,
  getWindow,
  matchesMedia,
  readStorage,
  writeStorage,
} from './dom.js';

export { cx } from './cx.js';
export { dataAttrs } from './data-attrs.js';
export type { DataAttributeValue } from './data-attrs.js';
export { composeEventHandlers } from './compose-event-handlers.js';
export { mergeProps } from './merge-props.js';
export { mergeRefs } from './merge-refs.js';
export { devWarn } from './dev-warn.js';
export { renderElement } from './render-element.js';
export type { RenderProp } from './render-element.js';
