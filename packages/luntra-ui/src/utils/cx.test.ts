import { describe, expect, it } from 'vitest';

import { cx } from './cx.js';
import { dataAttrs } from './data-attrs.js';

describe('cx', () => {
  it('joins truthy values with single spaces', () => {
    expect(cx('a', 'b', 'c')).toBe('a b c');
  });

  it('drops every falsy value', () => {
    expect(cx('a', false, null, undefined, '', 'b')).toBe('a b');
  });

  it('returns an empty string when nothing survives', () => {
    expect(cx(false, null, undefined)).toBe('');
  });

  it('does not introduce leading or trailing whitespace', () => {
    expect(cx(undefined, 'a', undefined)).toBe('a');
  });
});

describe('dataAttrs', () => {
  it('prefixes bare keys', () => {
    expect(dataAttrs({ variant: 'primary' })).toEqual({ 'data-variant': 'primary' });
  });

  it('leaves already-prefixed keys alone', () => {
    expect(dataAttrs({ 'data-luntra-part': 'button' })).toEqual({
      'data-luntra-part': 'button',
    });
  });

  it('renders true as an empty string, matching HTML boolean attributes', () => {
    expect(dataAttrs({ loading: true })).toEqual({ 'data-loading': '' });
  });

  /**
   * The reason this helper exists. `[data-disabled]` in CSS matches on presence,
   * so `data-disabled="false"` would style every enabled control as disabled.
   */
  it('omits false rather than rendering it', () => {
    expect(dataAttrs({ disabled: false })).toEqual({});
  });

  it('omits null, undefined and the empty string', () => {
    expect(dataAttrs({ a: null, b: undefined, c: '' })).toEqual({});
  });

  it('keeps only the attributes that should be selectable', () => {
    expect(dataAttrs({ variant: 'ghost', size: 'md', disabled: false, loading: true })).toEqual({
      'data-variant': 'ghost',
      'data-size': 'md',
      'data-loading': '',
    });
  });
});
