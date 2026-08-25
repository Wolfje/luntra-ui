import { useId } from 'react';

import { brands, useTheme, type ThemePreference } from '../lib/luntra.js';

const THEMES: ReadonlyArray<{ value: ThemePreference; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

/**
 * The site's theme and brand switchers.
 *
 * These are also the live theming demo: they drive the real `ThemeProvider`
 * over the whole document, so every example, token table and code block on the
 * page responds. A demo confined to a preview box would not prove that theming
 * survives contact with an actual application.
 *
 * Native `<select>`s rather than custom dropdowns. A native select is
 * keyboard-operable, works with every screen reader, respects the platform's
 * touch conventions, and — on a page whose entire subject is accessibility —
 * a hand-rolled listbox would be an odd thing to ask readers to trust.
 */
export function ThemeControls() {
  const { theme, brand, setTheme, setBrand } = useTheme();
  const themeId = useId();
  const brandId = useId();

  return (
    <div className="theme-controls">
      <div className="theme-controls__field">
        <label htmlFor={themeId}>Theme</label>
        <select
          id={themeId}
          value={theme}
          onChange={(event) => setTheme(event.target.value as ThemePreference)}
        >
          {THEMES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="theme-controls__field">
        <label htmlFor={brandId}>Brand</label>
        <select id={brandId} value={brand} onChange={(event) => setBrand(event.target.value)}>
          {Object.values(brands).map((option) => (
            <option key={option.name} value={option.name}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
