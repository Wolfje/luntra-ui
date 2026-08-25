/**
 * Semantic tokens — primitives given a *role*.
 *
 * Components only ever reference these. Swapping a theme swaps this mapping;
 * component CSS is untouched.
 *
 * Values use DTCG-style references: `{color.neutral.900}` resolves to a
 * primitive, `{brand.600}` resolves to the active brand ramp. The generator
 * emits them as `var(--luntra-…)` so the whole chain stays inspectable in
 * devtools, and the contrast tests resolve them to concrete hex.
 *
 * Note the brand indirection: themes map *ramp positions* to roles, brands
 * supply the ramp. A new brand therefore never has to know about light/dark —
 * it only provides 50…950 — and light/dark logic lives in exactly one place.
 */

/** A token reference (`{path.to.token}`) or a literal CSS value. */
export type TokenValue = string;

export interface SemanticTokens {
  /** Drives the native `color-scheme` property (form controls, scrollbars). */
  colorScheme: 'light' | 'dark';
  color: {
    /** Page background. */
    surface: TokenValue;
    /** Recessed areas — wells, table stripes, code blocks. */
    surfaceSubtle: TokenValue;
    /** Elevated areas — cards, popovers, menus. */
    surfaceRaised: TokenValue;

    text: TokenValue;
    /** Secondary text. Still held to 4.5:1 — "muted" is not "unreadable". */
    textMuted: TokenValue;

    /** Decorative separators. Exempt from 1.4.11 — carries no information. */
    border: TokenValue;
    /**
     * Boundaries that *identify* a control (e.g. a secondary button's edge).
     * Must meet 3:1 against the adjacent surface — WCAG 2.2 SC 1.4.11.
     */
    borderStrong: TokenValue;

    /** WCAG 2.2 SC 2.4.13 — must meet 3:1 against the surface behind it. */
    focusRing: TokenValue;

    /** Primary / filled action. */
    action: {
      bg: TokenValue;
      bgHover: TokenValue;
      bgActive: TokenValue;
      fg: TokenValue;
    };
    /** Secondary / tonal action. */
    actionSubtle: {
      bg: TokenValue;
      bgHover: TokenValue;
      bgActive: TokenValue;
      fg: TokenValue;
    };
    /** Ghost / tertiary action — no fill at rest. */
    actionGhost: {
      fg: TokenValue;
      bgHover: TokenValue;
      bgActive: TokenValue;
    };
    /** Destructive action. Never the only signal — pair with clear wording. */
    destructive: {
      bg: TokenValue;
      bgHover: TokenValue;
      bgActive: TokenValue;
      fg: TokenValue;
    };
    /**
     * WCAG exempts disabled controls from contrast requirements. We hold them
     * to 4.5:1 anyway: a control the user can still focus and read is better
     * than one they can only guess at. Disabled-ness is conveyed by the muted
     * fill and `aria-disabled`, not by making the label illegible.
     */
    disabled: {
      bg: TokenValue;
      fg: TokenValue;
      border: TokenValue;
    };
  };
}

export const light: SemanticTokens = {
  colorScheme: 'light',
  color: {
    surface: '{color.white}',
    surfaceSubtle: '{color.neutral.50}',
    surfaceRaised: '{color.white}',

    text: '{color.neutral.900}',
    textMuted: '{color.neutral.600}',

    border: '{color.neutral.200}',
    borderStrong: '{color.neutral.500}',

    focusRing: '{brand.700}',

    action: {
      bg: '{brand.700}',
      bgHover: '{brand.800}',
      bgActive: '{brand.900}',
      fg: '{color.white}',
    },
    actionSubtle: {
      bg: '{color.neutral.100}',
      bgHover: '{color.neutral.200}',
      bgActive: '{color.neutral.300}',
      fg: '{color.neutral.900}',
    },
    actionGhost: {
      /**
       * A step darker than the filled action's `bg`. Ghost text sits on the
       * page *and* on its own hover/active fills, so it needs more headroom
       * than a variant that supplies its own background — the contrast gate
       * rejects `{brand.700}` here for lower-luminance ramps.
       */
      fg: '{brand.800}',
      bgHover: '{color.neutral.100}',
      bgActive: '{color.neutral.200}',
    },
    destructive: {
      bg: '{color.red.700}',
      bgHover: '{color.red.800}',
      bgActive: '{color.red.900}',
      fg: '{color.white}',
    },
    disabled: {
      bg: '{color.neutral.100}',
      fg: '{color.neutral.600}',
      border: '{color.neutral.300}',
    },
  },
};

export const dark: SemanticTokens = {
  colorScheme: 'dark',
  color: {
    surface: '{color.neutral.900}',
    surfaceSubtle: '{color.neutral.950}',
    surfaceRaised: '{color.neutral.800}',

    text: '{color.neutral.50}',
    textMuted: '{color.neutral.400}',

    border: '{color.neutral.700}',
    borderStrong: '{color.neutral.400}',

    focusRing: '{brand.300}',

    /**
     * Dark mode inverts the fill relationship: a light brand tint carrying dark
     * text. Keeping a dark brand fill with white text cannot hold 4.5:1 across
     * hover/active on most hues, and a saturated mid-tone fill on a dark page
     * struggles to clear 3:1 for its own boundary (SC 1.4.11).
     */
    action: {
      bg: '{brand.400}',
      bgHover: '{brand.300}',
      bgActive: '{brand.200}',
      fg: '{color.neutral.950}',
    },
    actionSubtle: {
      bg: '{color.neutral.800}',
      bgHover: '{color.neutral.700}',
      bgActive: '{color.neutral.600}',
      fg: '{color.neutral.50}',
    },
    actionGhost: {
      fg: '{brand.300}',
      bgHover: '{color.neutral.800}',
      bgActive: '{color.neutral.700}',
    },
    destructive: {
      bg: '{color.red.400}',
      bgHover: '{color.red.300}',
      bgActive: '{color.red.200}',
      fg: '{color.neutral.950}',
    },
    disabled: {
      bg: '{color.neutral.800}',
      fg: '{color.neutral.400}',
      border: '{color.neutral.600}',
    },
  },
};

export const themes = { light, dark } as const;

export type ThemeName = keyof typeof themes;
