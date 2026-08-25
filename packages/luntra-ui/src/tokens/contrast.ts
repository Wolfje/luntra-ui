/**
 * WCAG contrast maths.
 *
 * Used by the token test suite to gate every colour pair the design system
 * ships, and exported so consumers authoring a custom brand can run their ramp
 * through the same check rather than eyeballing it.
 *
 * Implements the relative luminance and contrast ratio definitions from
 * WCAG 2.2 (https://www.w3.org/TR/WCAG22/#dfn-relative-luminance).
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Minimum ratios defined by WCAG 2.2. */
export const CONTRAST_THRESHOLD = {
  /** SC 1.4.3 — body text at normal size. */
  text: 4.5,
  /** SC 1.4.3 — text >= 24px, or >= 18.66px bold. */
  largeText: 3,
  /** SC 1.4.11 — UI component boundaries and meaningful graphics. */
  nonText: 3,
  /** SC 1.4.6 — enhanced (AAA) body text. */
  textEnhanced: 7,
} as const;

const HEX_SHORT = /^#([\da-f])([\da-f])([\da-f])$/i;
const HEX_LONG = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i;

/**
 * Parse a hex colour into 0-255 channels.
 *
 * Deliberately narrow: the token system authors colours as hex only, so
 * anything else is a mistake we want surfaced loudly rather than silently
 * treated as black.
 */
export function parseHex(color: string): Rgb {
  const value = color.trim();

  const short = HEX_SHORT.exec(value);
  if (short) {
    const [, r, g, b] = short;
    return {
      r: Number.parseInt(`${r}${r}`, 16),
      g: Number.parseInt(`${g}${g}`, 16),
      b: Number.parseInt(`${b}${b}`, 16),
    };
  }

  const long = HEX_LONG.exec(value);
  if (long) {
    const [, r, g, b] = long;
    return {
      r: Number.parseInt(r as string, 16),
      g: Number.parseInt(g as string, 16),
      b: Number.parseInt(b as string, 16),
    };
  }

  throw new Error(
    `Cannot compute contrast for "${color}": expected a hex colour such as "#1d4ed8".`,
  );
}

/** Undo sRGB gamma encoding for a single 0-255 channel. */
function linearise(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance(color: string | Rgb): number {
  const { r, g, b } = typeof color === 'string' ? parseHex(color) : color;
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

/**
 * Contrast ratio between two colours, 1 to 21. Order-independent.
 *
 * Both colours must be opaque — a ratio against a translucent colour is
 * meaningless without knowing what is behind it, so compose first.
 */
export function contrastRatio(a: string | Rgb, b: string | Rgb): number {
  const lumA = relativeLuminance(a);
  const lumB = relativeLuminance(b);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Contrast ratio rounded to 2dp — for readable assertion output and docs. */
export function contrastRatioRounded(a: string | Rgb, b: string | Rgb): number {
  return Math.round(contrastRatio(a, b) * 100) / 100;
}

export type ContrastRequirement = keyof typeof CONTRAST_THRESHOLD;

/** Does this pair clear the given WCAG requirement? */
export function meetsContrast(
  foreground: string | Rgb,
  background: string | Rgb,
  requirement: ContrastRequirement = 'text',
): boolean {
  return contrastRatio(foreground, background) >= CONTRAST_THRESHOLD[requirement];
}
