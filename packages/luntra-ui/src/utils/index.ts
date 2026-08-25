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
