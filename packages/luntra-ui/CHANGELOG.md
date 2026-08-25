# @luntra-ui/react

## 0.1.0

### Minor Changes

- [`a2832f8`](https://github.com/Wolfje/luntra-ui/commit/a2832f8e1e6cc4ecb1bce5120ca51511d97f0be9) Thanks [@luntra-ui](https://github.com/luntra-ui)! - Initial release.
  
  An accessible React component library with `Button`, a three-tier design token
  system, and light/dark theming across multiple brands.
  
  **Accessibility** is a build gate rather than a review step. Every
  foreground/background pair is checked against the WCAG 2.2 contrast formula
  across every brand, theme and interaction state, so a token that fails cannot
  be committed. Components carry axe assertions, and the documentation site is
  audited as server-rendered HTML — which is what assistive technology and a
  reader whose JavaScript hasn't arrived actually meet.
  
  **Server rendering** works without a flash of the wrong theme. `getThemeScript()`
  emits a small blocking script that resolves the stored or system preference and
  sets `data-theme` before first paint, so the page never renders light and then
  correct. Only the components that need browser APIs are marked `"use client"`.
  
  **Styling** is CSS Modules over custom properties. Themes and brands are plain
  CSS files selected by `data-theme` and `data-brand` attributes, so switching
  either is an attribute change the browser handles — no re-render, no context
  propagation, no flash. Consumers can restyle by overriding custom properties
  rather than by out-specifying the library.
  
  **Packaging** supports both `@luntra-ui/react` and per-component subpaths such
  as `@luntra-ui/react/button`. Importing `Button` costs the same either way,
  verified by a bundle size budget in CI rather than assumed.
  
  `Button` renders as a `<button>`, an `<a>`, or any component you hand it via
  `render`, and derives the correct semantics from the destination rather than
  from the element you happened to pass. Disabled buttons stay focusable using
  `aria-disabled`, because a disabled control that vanishes from the tab order
  cannot tell a keyboard user why it is unavailable.
