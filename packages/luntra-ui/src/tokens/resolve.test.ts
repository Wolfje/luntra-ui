/**
 * Tests for the token resolver.
 *
 * This module is exported from `@luntra-ui/react/tokens`, so consumers building
 * their own themes or design-token pipelines call it directly. It is also the
 * single resolver shared by the CSS generator and the contrast suite, which
 * means a bug here ships wrong colours *and* a green contrast report agreeing
 * with them.
 */
import { describe, expect, it } from 'vitest';

import type { BrandRamp } from './source/brands/index.js';
import { primitives } from './source/primitives.js';
import {
  TOKEN_PREFIX,
  flatten,
  isReference,
  kebab,
  referencePath,
  resolveValue,
  toCssValue,
  toCssVarName,
} from './resolve.js';

const ramp: BrandRamp = {
  50: '#f0f9ff',
  100: '#e0f2fe',
  200: '#bae6fd',
  300: '#7dd3fc',
  400: '#38bdf8',
  500: '#0ea5e9',
  600: '#0284c7',
  700: '#0369a1',
  800: '#075985',
  900: '#0c4a6e',
  950: '#082f49',
};

describe('kebab', () => {
  it('splits camelCase at the boundary', () => {
    expect(kebab('bgHover')).toBe('bg-hover');
    expect(kebab('targetSize')).toBe('target-size');
  });

  it('leaves already-flat segments alone', () => {
    expect(kebab('bg')).toBe('bg');
  });

  it('does not mangle numeric ramp positions', () => {
    // `900` is a legitimate token segment. Splitting or lowercasing it would
    // silently rename every ramp variable.
    expect(kebab('900')).toBe('900');
  });

  it('handles a digit-to-capital boundary', () => {
    expect(kebab('gray900Hover')).toBe('gray900-hover');
  });
});

describe('toCssVarName', () => {
  it('joins a path into a prefixed custom property', () => {
    expect(toCssVarName(['color', 'action', 'bgHover'])).toBe('--luntra-color-action-bg-hover');
  });

  it('uses the exported prefix', () => {
    expect(toCssVarName(['x'])).toBe(`${TOKEN_PREFIX}-x`);
  });
});

describe('flatten', () => {
  it('walks nested objects into custom-property pairs', () => {
    const result = flatten({ color: { action: { bg: '#fff' } } });

    expect(result.get('--luntra-color-action-bg')).toBe('#fff');
  });

  it('stringifies numeric leaves', () => {
    // Line heights and z-indices are authored as numbers; CSS needs strings.
    expect(flatten({ lineHeight: { tight: 1.25 } }).get('--luntra-line-height-tight')).toBe('1.25');
  });

  it('preserves declaration order', () => {
    // The generated stylesheet should read in the same order as the source, so
    // a diff of the CSS maps onto a diff of the tokens.
    const result = flatten({ b: '2', a: '1', c: { z: '26', y: '25' } });

    expect([...result.keys()]).toEqual([
      '--luntra-b',
      '--luntra-a',
      '--luntra-c-z',
      '--luntra-c-y',
    ]);
  });

  it('accepts a value typed as an interface', () => {
    /*
     * The regression this exists for. TypeScript gives implicit index
     * signatures to type aliases but not to interfaces, so an earlier
     * `TokenTree` parameter rejected `SemanticTokens` — the very thing flatten
     * exists to flatten — and would reject any interface a consumer wrote for
     * their own tokens.
     *
     * The assertion is that this file compiles. `typecheck` is the real test;
     * the runtime expectation just stops the value being unused.
     */
    interface ConsumerTokens {
      color: { brandBg: string };
    }

    const tokens: ConsumerTokens = { color: { brandBg: '#123456' } };

    expect(flatten(tokens).get('--luntra-color-brand-bg')).toBe('#123456');
  });

  it('flattens the real primitives without throwing', () => {
    const result = flatten(primitives);

    expect(result.size).toBeGreaterThan(50);
    expect(result.get('--luntra-color-neutral-900')).toBe(primitives.color.neutral[900]);
  });

  it('returns an empty map for an empty object', () => {
    expect(flatten({}).size).toBe(0);
  });
});

describe('isReference', () => {
  it('recognises a braced reference', () => {
    expect(isReference('{color.neutral.900}')).toBe(true);
  });

  it('rejects literal values', () => {
    expect(isReference('#ffffff')).toBe(false);
    expect(isReference('1rem')).toBe(false);
  });

  it('rejects a partial or malformed brace', () => {
    expect(isReference('{color.neutral.900')).toBe(false);
    expect(isReference('calc({a} + 1px)')).toBe(false);
  });
});

describe('referencePath', () => {
  it('splits a reference into segments', () => {
    expect(referencePath('{color.neutral.900}')).toEqual(['color', 'neutral', '900']);
  });

  it('returns null for a literal', () => {
    expect(referencePath('#ffffff')).toBeNull();
  });

  it('returns null for an empty reference rather than an empty segment', () => {
    expect(referencePath('{}')).toBeNull();
  });
});

describe('toCssValue', () => {
  it('emits var() for a reference rather than inlining it', () => {
    // Inlining would flatten the alias chain, so devtools would show a hex with
    // no indication of which semantic token produced it, and a brand could no
    // longer override the ramp at runtime.
    expect(toCssValue('{color.neutral.900}')).toBe('var(--luntra-color-neutral-900)');
  });

  it('passes literals through untouched', () => {
    expect(toCssValue('#ffffff')).toBe('#ffffff');
    expect(toCssValue('0 1px 2px rgb(0 0 0 / 0.05)')).toBe('0 1px 2px rgb(0 0 0 / 0.05)');
  });
});

describe('resolveValue', () => {
  it('returns literals unchanged', () => {
    expect(resolveValue('#abcdef', ramp)).toBe('#abcdef');
  });

  it('resolves against the primitives', () => {
    expect(resolveValue('{color.neutral.900}', ramp)).toBe(primitives.color.neutral[900]);
  });

  it('resolves {brand.*} against the supplied ramp', () => {
    // The whole point of the brand indirection: the same semantic token
    // produces a different literal per brand, with no change to the semantics.
    expect(resolveValue('{brand.700}', ramp)).toBe('#0369a1');
  });

  it('follows a chain of references', () => {
    expect(resolveValue('{color.white}', ramp)).toBe('#ffffff');
  });

  it('throws on a dangling reference', () => {
    // An authoring bug should fail the build. Left alone it emits
    // `var(--luntra-color-neutral-1000)`, which resolves to nothing and
    // silently inherits — invisible until someone looks at the wrong colour.
    expect(() => resolveValue('{color.neutral.1000}', ramp)).toThrow(
      /Unknown token reference "\{color\.neutral\.1000\}"/,
    );
  });

  it('throws when a path runs through a leaf', () => {
    expect(() => resolveValue('{color.white.deeper}', ramp)).toThrow(/Unknown token reference/);
  });

  it('throws on an unknown brand ramp position', () => {
    expect(() => resolveValue('{brand.42}', ramp)).toThrow(
      /Unknown token reference "\{brand\.42\}"/,
    );
  });

  it('throws rather than hanging on a circular reference', () => {
    const circular: BrandRamp = { ...ramp, 500: '{brand.600}', 600: '{brand.500}' };

    expect(() => resolveValue('{brand.500}', circular)).toThrow(/Circular token reference/);
  });
});
