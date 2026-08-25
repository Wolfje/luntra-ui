/**
 * `@luntra-ui/react/tokens` — the design token source of truth.
 *
 * Exported so consumers can build brands, generate their own artefacts
 * (Figma, iOS, docs tables), and — importantly — validate a custom ramp with
 * the same contrast maths the library gates itself on.
 */

export { primitives } from './source/primitives.js';
export type { Primitives } from './source/primitives.js';

export { light, dark, themes } from './source/semantic.js';
export type { SemanticTokens, ThemeName, TokenValue } from './source/semantic.js';

export { brands, defaultBrand, tealBrand } from './source/brands/index.js';
export type { Brand, BrandRamp, BrandName } from './source/brands/index.js';

export {
  CONTRAST_THRESHOLD,
  contrastRatio,
  contrastRatioRounded,
  meetsContrast,
  parseHex,
  relativeLuminance,
} from './contrast.js';
export type { ContrastRequirement, Rgb } from './contrast.js';

export {
  TOKEN_PREFIX,
  flatten,
  isReference,
  resolveValue,
  toCssValue,
  toCssVarName,
} from './resolve.js';
