/**
 * Token flattening and reference resolution.
 *
 * Shared by the CSS generator (which needs `var(--luntra-…)` output) and the
 * contrast tests (which need concrete hex). Keeping both consumers on one
 * resolver means the tests validate the exact values that ship.
 */

import { primitives } from './source/primitives.js';
import type { BrandRamp } from './source/brands/index.js';

export const TOKEN_PREFIX = '--luntra';

const REFERENCE = /^\{([^}]+)\}$/;

/** `bgHover` -> `bg-hover`, `targetSize` -> `target-size`, `900` -> `900`. */
export function kebab(segment: string): string {
  return segment.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/** `['color','action','bgHover']` -> `--luntra-color-action-bg-hover`. */
export function toCssVarName(path: readonly string[]): string {
  return `${TOKEN_PREFIX}-${path.map(kebab).join('-')}`;
}

/**
 * A nested token object: string or number leaves, arbitrarily deep.
 *
 * This documents the shape. It is deliberately *not* the parameter type of
 * `flatten` — see below.
 */
export type TokenTree = {
  readonly [key: string]: string | number | TokenTree;
};

/**
 * Walk a nested token object into `{ '--luntra-a-b': 'value' }` pairs,
 * preserving declaration order so the generated CSS reads top-to-bottom in the
 * same shape as the source.
 *
 * ## Why the parameter is `object` rather than `TokenTree`
 *
 * TypeScript gives implicit index signatures to type aliases but not to
 * interfaces, so `SemanticTokens` — an interface, and the exact thing this
 * function exists to flatten — is not assignable to `TokenTree`. Neither is any
 * interface a consumer declares for their own tokens. A public function that
 * rejects the public data it was built for is not much of an API.
 *
 * The walk only reads keys and narrows leaves with `typeof`, so a wider
 * parameter costs no safety here: anything that is not a string or number is
 * recursed into, and anything that is, is emitted.
 */
export function flatten(tree: object, prefix: readonly string[] = []): Map<string, string> {
  const out = new Map<string, string>();

  for (const [key, value] of Object.entries(tree)) {
    const path = [...prefix, key];
    if (typeof value === 'string' || typeof value === 'number') {
      out.set(toCssVarName(path), String(value));
    } else {
      for (const [name, nested] of flatten(value, path)) {
        out.set(name, nested);
      }
    }
  }

  return out;
}

/** Is this a `{token.reference}` rather than a literal CSS value? */
export function isReference(value: string): boolean {
  return REFERENCE.test(value);
}

/** `{color.neutral.900}` -> `['color','neutral','900']`. */
export function referencePath(value: string): string[] | null {
  const match = REFERENCE.exec(value);
  return match?.[1] ? match[1].split('.') : null;
}

/**
 * Turn a token value into CSS output. References become `var(…)` rather than
 * being inlined, so the alias chain stays visible in devtools and a brand can
 * override the ramp at runtime.
 */
export function toCssValue(value: string): string {
  const path = referencePath(value);
  return path ? `var(${toCssVarName(path)})` : value;
}

function lookup(tree: unknown, path: readonly string[]): string | undefined {
  let current: unknown = tree;
  for (const segment of path) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === 'string' ? current : undefined;
}

/**
 * Resolve a token value all the way down to a literal (usually hex).
 *
 * `{brand.*}` resolves against the supplied ramp, everything else against the
 * primitives. Follows chains, and throws on a dangling or circular reference —
 * both are authoring bugs that should fail the build rather than render as an
 * invalid CSS value that silently falls back to `inherit`.
 */
export function resolveValue(value: string, brandRamp: BrandRamp, depth = 0): string {
  if (depth > 10) {
    throw new Error(`Circular token reference while resolving "${value}".`);
  }

  const path = referencePath(value);
  if (!path) return value;

  const [head, ...rest] = path;

  const resolved =
    head === 'brand' ? lookup(brandRamp, rest) : lookup(primitives, path as [string, ...string[]]);

  if (resolved === undefined) {
    throw new Error(`Unknown token reference "{${path.join('.')}}".`);
  }

  return resolveValue(resolved, brandRamp, depth + 1);
}
