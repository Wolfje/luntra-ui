/**
 * The contrast gate.
 *
 * Every colour pair the design system can produce is checked here, for every
 * brand, in both themes, across resting/hover/active states. A palette tweak
 * that quietly drops a pair below WCAG cannot reach `main`.
 *
 * This is the piece that makes "WCAG 2.2 AA by default" a property of the
 * system rather than a promise in a README.
 */

import { describe, expect, it } from 'vitest';

import { CONTRAST_THRESHOLD, contrastRatioRounded } from './contrast.js';
import { resolveValue } from './resolve.js';
import { brands, type Brand } from './source/brands/index.js';
import { themes, type SemanticTokens, type ThemeName } from './source/semantic.js';

type Requirement = keyof typeof CONTRAST_THRESHOLD;

interface Pair {
  label: string;
  foreground: string;
  background: string;
  requirement: Requirement;
}

/**
 * Every pair that a user can actually perceive together.
 *
 * Hover and active states are included deliberately — they are the states most
 * often skipped in an audit, and the easiest to regress when someone "just
 * darkens the hover a bit".
 */
function pairsFor(tokens: SemanticTokens): Pair[] {
  const c = tokens.color;

  return [
    // Text on surfaces — SC 1.4.3.
    { label: 'text on surface', foreground: c.text, background: c.surface, requirement: 'text' },
    {
      label: 'text on subtle surface',
      foreground: c.text,
      background: c.surfaceSubtle,
      requirement: 'text',
    },
    {
      label: 'text on raised surface',
      foreground: c.text,
      background: c.surfaceRaised,
      requirement: 'text',
    },
    {
      label: 'muted text on surface',
      foreground: c.textMuted,
      background: c.surface,
      requirement: 'text',
    },
    {
      label: 'muted text on subtle surface',
      foreground: c.textMuted,
      background: c.surfaceSubtle,
      requirement: 'text',
    },

    // Primary action — label legibility in all three states.
    {
      label: 'action label',
      foreground: c.action.fg,
      background: c.action.bg,
      requirement: 'text',
    },
    {
      label: 'action label (hover)',
      foreground: c.action.fg,
      background: c.action.bgHover,
      requirement: 'text',
    },
    {
      label: 'action label (active)',
      foreground: c.action.fg,
      background: c.action.bgActive,
      requirement: 'text',
    },

    // Secondary action.
    {
      label: 'subtle action label',
      foreground: c.actionSubtle.fg,
      background: c.actionSubtle.bg,
      requirement: 'text',
    },
    {
      label: 'subtle action label (hover)',
      foreground: c.actionSubtle.fg,
      background: c.actionSubtle.bgHover,
      requirement: 'text',
    },
    {
      label: 'subtle action label (active)',
      foreground: c.actionSubtle.fg,
      background: c.actionSubtle.bgActive,
      requirement: 'text',
    },

    // Ghost action — sits directly on the page, and on its own hover fill.
    {
      label: 'ghost action label on surface',
      foreground: c.actionGhost.fg,
      background: c.surface,
      requirement: 'text',
    },
    {
      label: 'ghost action label (hover)',
      foreground: c.actionGhost.fg,
      background: c.actionGhost.bgHover,
      requirement: 'text',
    },
    {
      label: 'ghost action label (active)',
      foreground: c.actionGhost.fg,
      background: c.actionGhost.bgActive,
      requirement: 'text',
    },

    // Destructive action.
    {
      label: 'destructive label',
      foreground: c.destructive.fg,
      background: c.destructive.bg,
      requirement: 'text',
    },
    {
      label: 'destructive label (hover)',
      foreground: c.destructive.fg,
      background: c.destructive.bgHover,
      requirement: 'text',
    },
    {
      label: 'destructive label (active)',
      foreground: c.destructive.fg,
      background: c.destructive.bgActive,
      requirement: 'text',
    },

    // Disabled. WCAG exempts these; we hold the line anyway.
    {
      label: 'disabled label',
      foreground: c.disabled.fg,
      background: c.disabled.bg,
      requirement: 'text',
    },

    // Non-text contrast — SC 1.4.11.
    {
      label: 'action fill against surface',
      foreground: c.action.bg,
      background: c.surface,
      requirement: 'nonText',
    },
    {
      label: 'destructive fill against surface',
      foreground: c.destructive.bg,
      background: c.surface,
      requirement: 'nonText',
    },
    {
      label: 'strong border against surface',
      foreground: c.borderStrong,
      background: c.surface,
      requirement: 'nonText',
    },
    {
      label: 'strong border against subtle action fill',
      foreground: c.borderStrong,
      background: c.actionSubtle.bg,
      requirement: 'nonText',
    },

    // Focus indicator — SC 2.4.13. Checked against every surface the ring can
    // land on, since the 2px offset means the *page* is what it sits against.
    {
      label: 'focus ring against surface',
      foreground: c.focusRing,
      background: c.surface,
      requirement: 'nonText',
    },
    {
      label: 'focus ring against subtle surface',
      foreground: c.focusRing,
      background: c.surfaceSubtle,
      requirement: 'nonText',
    },
    {
      label: 'focus ring against raised surface',
      foreground: c.focusRing,
      background: c.surfaceRaised,
      requirement: 'nonText',
    },
  ];
}

const themeNames = Object.keys(themes) as ThemeName[];
const brandList = Object.values(brands) as Brand[];

describe.each(brandList)('brand "$name"', (brand) => {
  describe.each(themeNames)('%s theme', (themeName) => {
    const tokens = themes[themeName];
    const pairs = pairsFor(tokens);

    it.each(pairs)(
      '$label meets its WCAG requirement',
      ({ label, foreground, background, requirement }) => {
        const fg = resolveValue(foreground, brand.ramp);
        const bg = resolveValue(background, brand.ramp);
        const ratio = contrastRatioRounded(fg, bg);
        const threshold = CONTRAST_THRESHOLD[requirement];

        // Message names the exact colours, so a failure tells you what to change.
        expect(
          ratio,
          `${label}: ${fg} on ${bg} is ${ratio}:1, needs ${threshold}:1`,
        ).toBeGreaterThanOrEqual(threshold);
      },
    );
  });
});

describe('token references', () => {
  it('resolves every semantic value to a concrete colour', () => {
    for (const brand of brandList) {
      for (const themeName of themeNames) {
        const stack: unknown[] = [themes[themeName].color];
        while (stack.length > 0) {
          const node = stack.pop();
          if (typeof node === 'string') {
            expect(() => resolveValue(node, brand.ramp)).not.toThrow();
          } else if (typeof node === 'object' && node !== null) {
            stack.push(...Object.values(node));
          }
        }
      }
    }
  });

  it('throws on an unknown reference rather than emitting invalid CSS', () => {
    expect(() => resolveValue('{color.neutral.42}', brands.default.ramp)).toThrow(
      /Unknown token reference/,
    );
  });
});
