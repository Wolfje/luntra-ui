/**
 * Primitive tokens — the raw material of the design system.
 *
 * These are context-free values: `blue-600` is just a colour, it carries no
 * meaning. Nothing in a component should reference a primitive directly;
 * components consume *semantic* tokens, which alias these. That indirection is
 * what makes re-branding possible without touching component CSS.
 *
 * This file is the source of truth. `scripts/build-tokens.ts` generates
 * `src/styles/tokens.css` from it — never hand-edit the generated CSS.
 */

export const primitives = {
  color: {
    /** Pure values, useful for surfaces and text at the extremes of the scale. */
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',

    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },

    blue: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },

    red: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },

    green: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },

    amber: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
  },

  /** 4px base scale. `rem` so the system respects the user's root font size. */
  space: {
    0: '0',
    px: '1px',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
  },

  radius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },

  borderWidth: {
    none: '0',
    thin: '1px',
    thick: '2px',
  },

  fontFamily: {
    sans: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
  },

  /**
   * `rem`-based so text scales with user preferences (WCAG 1.4.4 Resize Text).
   * Never express type sizes in `px`.
   */
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
  },

  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
  },

  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },

  duration: {
    instant: '0ms',
    fast: '120ms',
    md: '200ms',
    slow: '320ms',
  },

  easing: {
    standard: 'cubic-bezier(0.2, 0, 0.38, 1)',
    entrance: 'cubic-bezier(0, 0, 0.38, 1)',
    exit: 'cubic-bezier(0.2, 0, 1, 1)',
  },

  /**
   * WCAG 2.2 SC 2.5.8 Target Size (Minimum) requires interactive targets to be
   * at least 24x24 CSS px. `comfortable` meets the stricter AAA SC 2.5.5 (44px).
   * These are `px` on purpose: the success criterion is defined in CSS pixels.
   */
  targetSize: {
    min: '24px',
    comfortable: '44px',
  },

  /**
   * WCAG 2.2 SC 2.4.13 Focus Appearance: the indicator must be at least as
   * large as a 2px-thick perimeter and have 3:1 contrast against adjacent
   * colours. The offset keeps the ring clear of the component's own edge.
   */
  focusRing: {
    width: '2px',
    offset: '2px',
    style: 'solid',
  },
} as const;

export type Primitives = typeof primitives;
