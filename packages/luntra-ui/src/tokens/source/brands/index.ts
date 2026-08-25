/**
 * Brands supply a colour ramp; themes decide what to do with it.
 *
 * A brand never mentions light or dark. It provides 50…950 and the semantic
 * layer maps ramp positions to roles per theme (`{brand.700}` in light,
 * `{brand.400}` in dark). Adding a brand is therefore a data change, not a
 * design-system change.
 *
 * Every brand is run through the contrast suite in `tokens.contrast.test.ts`,
 * in both themes, across resting/hover/active states. A ramp that cannot hold
 * 4.5:1 for its text pairs or 3:1 for its boundaries fails the build.
 */

export interface BrandRamp {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface Brand {
  /** Value used in `data-brand="…"`. */
  name: string;
  label: string;
  ramp: BrandRamp;
}

/** Blue — the default brand, also the `:root` fallback when no brand is set. */
export const defaultBrand: Brand = {
  name: 'default',
  label: 'Luntra',
  ramp: {
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
};

/** Teal — a second brand, included to prove the mechanism and guard it in CI. */
export const tealBrand: Brand = {
  name: 'teal',
  label: 'Teal',
  ramp: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
    950: '#042f2e',
  },
};

export const brands = {
  default: defaultBrand,
  teal: tealBrand,
} as const;

export type BrandName = keyof typeof brands;
