# luntra-ui — Architecture & Build Plan

> Status: **Plan (pre-implementation)** · Target: React 19 · Node 20.19+ · pnpm 10

---

## 1. Goals & Non-Goals

### Goals

| #   | Goal                                            | How it's satisfied                                                                                              |
| --- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| G1  | React + Vite project setup                      | pnpm workspace, Vite 8 library mode, Vitest 4                                                                   |
| G2  | Works in SSR **and** CSR                        | No DOM access in render, `useId`, isomorphic layout effect, `"use client"` banners, no bundler-only globals     |
| G3  | WCAG 2.2 AA compliant **by default**            | Native semantics first, token-enforced focus/contrast/target-size, axe in CI, manual SC checklist per component |
| G4  | Vitest unit testing                             | Vitest 4 + Testing Library + user-event                                                                         |
| G5  | vitest-axe a11y testing                         | Dedicated `*.a11y.test.tsx` project, jsdom env                                                                  |
| G6  | CSS token styling                               | CSS custom properties as the styling contract; CSS Modules for scoping                                          |
| G7  | Whole-package **and** per-component consumption | `exports` map with subpath entries + multi-entry Rollup build                                                   |
| G8  | Theming: light/dark + multi-brand               | `data-theme` / `data-brand` cascade, no-flash SSR script                                                        |
| G9  | Data-attributes where appropriate               | All variant/state styling driven by `data-*`, giving consumers a stable override API                            |
| G10 | Shared utilities                                | `src/utils/*` — pure, tree-shakable, unit tested                                                                |
| G11 | Shared + local hooks                            | `src/hooks/*` (shared) and co-located component hooks                                                           |
| G12 | Changesets versioning                           | `@changesets/cli` 3.x + GitHub release workflow                                                                 |
| G13 | Docs portal                                     | TanStack Start 1.x + MDX, SSR'd                                                                                 |
| G14 | First component: `Button`                       | Full vertical slice proving every decision above                                                                |

### Non-Goals (v0)

- No CSS-in-JS runtime, no styled-components.
- No React 18 support (React 19 peer only) — revisit if needed.
- No Vue/Svelte/Web Component targets — the `/react` subpath leaves the door open.
- No design-token sync from Figma (v1 candidate).

---

## 2. Key Decisions (agreed)

| Decision        | Choice                                                      | Rationale                                                                      |
| --------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------ |
| A11y foundation | **From scratch** — own hooks/utils                          | Zero runtime deps, full control over WCAG 2.2 specifics, no upstream API churn |
| Package shape   | **Scoped package `@luntra-ui/react`** with subpath exports  | One version, one changelog; the scope leaves room for sibling packages later   |
| Styling         | **CSS Modules + CSS custom properties**                     | Zero runtime, SSR-safe, statically extractable, tokens are the public contract |
| Theming         | **`data-theme` + `data-brand`** with no-flash inline script | Supports nested/scoped themes, server-renderable, no FOUC                      |

---

## 3. Repository Layout

```
luntra-ui/
├── package.json                  # private root, scripts only
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── eslint.config.js              # ESLint 9 flat config
├── .changeset/config.json
├── .github/workflows/
│   ├── ci.yml                    # lint, typecheck, test, build, publint, attw
│   └── release.yml               # changesets/action -> npm publish (provenance)
├── PLAN.md
├── packages/
│   └── luntra-ui/                # ← the ONLY published package
│       ├── package.json
│       ├── vite.config.ts        # library build (multi-entry)
│       ├── vitest.config.ts      # projects: unit | a11y | ssr
│       ├── tsconfig.json
│       ├── scripts/build-tokens.ts
│       └── src/
│           ├── components/
│           │   ├── index.ts                # → "@luntra-ui/react"  (barrel)
│           │   └── button/
│           │       ├── index.ts            # → "@luntra-ui/react/button"
│           │       ├── button.tsx
│           │       ├── button.module.css
│           │       ├── button.types.ts
│           │       ├── button.test.tsx
│           │       ├── button.a11y.test.tsx
│           │       └── button.ssr.test.tsx
│           ├── hooks/
│           │   ├── index.ts
│           │   ├── use-isomorphic-layout-effect.ts
│           │   ├── use-merged-refs.ts
│           │   ├── use-controllable-state.ts
│           │   ├── use-button.ts           # ← Button's a11y behaviour
│           │   └── use-theme.ts
│           ├── utils/
│           │   ├── index.ts
│           │   ├── cx.ts                   # class joiner
│           │   ├── data-attrs.ts           # boolean → data-* serialiser
│           │   ├── merge-props.ts          # event/prop composition
│           │   ├── compose-event-handlers.ts
│           │   ├── polymorphic.ts          # `render` prop types + slot merge
│           │   └── dev-warn.ts             # DEV-only invariants (stripped in prod)
│           ├── tokens/
│           │   ├── source/                 # TS source of truth
│           │   │   ├── primitives.ts       # raw palette, scale, radii
│           │   │   ├── semantic.ts         # role-based aliases
│           │   │   └── brands/default.ts
│           │   └── index.ts                # typed token name unions
│           └── styles/                     # generated + hand-written CSS
│               ├── index.css               # → "@luntra-ui/react/styles"  (everything)
│               ├── reset.css
│               ├── tokens.css              # generated from tokens/source
│               └── themes/
│                   ├── light.css
│                   ├── dark.css
│                   └── brands/default.css
└── apps/
    └── docs/                     # TanStack Start docs portal (private)
```

---

## 4. Package Exports Contract

```jsonc
{
  "name": "@luntra-ui/react",
  "type": "module",
  "sideEffects": ["**/*.css"],
  "exports": {
    ".": {
      "types": "./dist/components/index.d.ts",
      "default": "./dist/components/index.js",
    },
    "./button": {
      "types": "./dist/components/button/index.d.ts",
      "default": "./dist/components/button/index.js",
    },
    "./hooks": {
      "types": "./dist/hooks/index.d.ts",
      "default": "./dist/hooks/index.js",
    },
    "./utils": {
      "types": "./dist/utils/index.d.ts",
      "default": "./dist/utils/index.js",
    },
    "./tokens": {
      "types": "./dist/tokens/index.d.ts",
      "default": "./dist/tokens/index.js",
    },
    "./styles": "./dist/styles/index.css",
    "./styles/tokens.css": "./dist/styles/tokens.css",
    "./styles/themes/*": "./dist/styles/themes/*",
    "./package.json": "./package.json",
  },
  "peerDependencies": { "react": "^19", "react-dom": "^19" },
  "publishConfig": { "access": "public" },
}
```

**Consumer stories**

```ts
// whole package
import { Button } from '@luntra-ui/react';
import '@luntra-ui/react/styles';

// single component (smallest possible graph)
import { Button } from '@luntra-ui/react/button';
import '@luntra-ui/react/styles/tokens.css';
```

> The `react` segment now lives in the **package name** (`@luntra-ui/react`), so subpaths are one level shallower: `./button`, not `./react/button`. `publishConfig.access: "public"` is required — scoped packages default to restricted.

### Build pipeline

- **Vite library mode**, `rollupOptions.input` built from a glob of every `index.ts` under `src/` → one entry per subpath, `output.preserveModules: false` but `manualChunks` off so shared code lands in `dist/_chunks/`.
- `react`, `react-dom`, `react/jsx-runtime` marked **external**.
- **CSS Modules** with deterministic `generateScopedName: 'luntra-[name]__[local]__[hash:base64:5]'`. Per-component CSS is code-split so `@luntra-ui/react/button` pulls only `button.css`.
- **`"use client"` preservation**: a small Rollup `renderChunk` plugin re-emits the directive at the top of client chunks (Rollup strips it otherwise). Only interactive components get it; `utils`/`tokens` stay server-safe.
- **Types**: `vite-plugin-dts` with `rollupTypes: false` so each subpath keeps its own `.d.ts`.
- **Validation**: `publint` + `@arethetypeswrong/cli` run in CI — export maps break silently otherwise.

---

## 5. Design Token Architecture

Three tiers, single direction of dependency:

```
primitives  →  semantic  →  component
--luntra-color-blue-600    --luntra-color-action-bg    --luntra-button-bg
--luntra-space-3           --luntra-space-inline-md    --luntra-button-padding-inline
```

- **Source of truth is TypeScript** (`tokens/source/*.ts`). `scripts/build-tokens.ts` emits `styles/tokens.css` + a typed `LuntraToken` union. This gives autocomplete in docs, lets us unit-test token values, and keeps CSS generated/consistent.
- All custom properties are prefixed `--luntra-` to avoid collisions.
- **Component tokens are the public theming API.** Every visual value in `button.module.css` resolves to a `--luntra-button-*` var with a semantic fallback:

```css
background: var(--luntra-button-bg, var(--luntra-color-action-bg));
```

Consumers rebrand by setting component tokens — no CSS specificity war.

- **A11y-critical tokens** are first-class: `--luntra-focus-ring-width` (min `2px`), `--luntra-focus-ring-offset`, `--luntra-focus-ring-color`, `--luntra-target-size-min` (`24px`, WCAG 2.5.8).
- A Vitest test asserts contrast ratios of every semantic fg/bg pair ≥ 4.5:1 (text) and ≥ 3:1 (non-text/UI), in **both** light and dark. Token changes cannot silently regress WCAG 1.4.3 / 1.4.11.

---

## 6. Theming Model

```html
<html data-theme="dark" data-brand="acme" style="color-scheme: dark"></html>
```

- `data-theme`: `light` | `dark` — resolved value, always concrete in the DOM.
- `data-brand`: arbitrary string, selects a brand token sheet.
- Both are **inheritable via any element**, so nested/scoped themes work:

```html
<section data-theme="light">
  …an always-light island inside a dark page…
</section>
```

- CSS selectors: `[data-theme='dark'] { --luntra-color-surface: … }` — cascade does the rest.
- `color-scheme` is set alongside so native widgets, scrollbars and form controls follow.

### SSR / no-flash

- `<ThemeProvider>` is a **client** component that only manages state + the `useTheme()` context. It does **not** own first paint.
- A tiny (~400 byte) synchronous inline script, exported as `getThemeScript()`, runs in `<head>`: reads `localStorage` → falls back to `prefers-color-scheme` → writes `data-theme` / `color-scheme` on `<html>` **before** first paint. Zero flash, zero hydration mismatch (server renders no theme-dependent markup).
- `system` is a _preference_, never a DOM value — a `matchMedia` listener updates the resolved attribute.
- Components **never** read the theme in JS. Theming is 100% CSS cascade → SSR output is byte-identical regardless of theme.

---

## 7. Accessibility Strategy (WCAG 2.2 AA)

**Principle: native semantics first.** ARIA only when the platform can't express it.

### Baked into the system

| SC                                           | Requirement                      | Enforcement                                                       |
| -------------------------------------------- | -------------------------------- | ----------------------------------------------------------------- |
| 1.4.3 Contrast (Min)                         | 4.5:1 text                       | Automated token contrast test                                     |
| 1.4.11 Non-text Contrast                     | 3:1 UI/state                     | Automated token contrast test                                     |
| 1.4.12 Text Spacing                          | No clipping                      | Fluid sizing, no fixed heights (`min-block-size` only)            |
| 2.1.1 / 2.1.2 Keyboard                       | Full keyboard, no traps          | `user-event` keyboard tests per component                         |
| **2.4.11 Focus Not Obscured** _(new in 2.2)_ | Focused item not fully hidden    | `scroll-margin` tokens; docs sticky header audited                |
| **2.4.13 Focus Appearance** _(new in 2.2)_   | ≥2px perimeter, 3:1 contrast     | `--luntra-focus-ring-*` tokens; `:focus-visible` never removed    |
| 2.5.3 Label in Name                          | Visible label ⊆ accessible name  | Lint rule + unit assertion                                        |
| **2.5.8 Target Size (Min)** _(new in 2.2)_   | 24×24 CSS px                     | `--luntra-target-size-min`; size variants tested                  |
| 1.4.13 Content on Hover                      | Dismissible/hoverable/persistent | Applies to Tooltip/Popover later                                  |
| —                                            | Reduced motion                   | `@media (prefers-reduced-motion: reduce)` in every transition     |
| —                                            | Windows High Contrast            | `@media (forced-colors: active)` fallbacks, `forced-color-adjust` |

### Testing layers

1. **Static** — `eslint-plugin-jsx-a11y`.
2. **Automated (axe)** — `vitest-axe` per component, all variants × both themes. Catches ~30–40% of issues; we treat it as a floor, not a ceiling.
3. **Behavioural** — `@testing-library/user-event`: real keyboard sequences, focus order, roving tabindex, announcement assertions.
4. **Token-level** — contrast + target-size unit tests.
5. **Manual checklist** — every component ships an `a11y.md` with SC-by-SC notes, screen-reader results (NVDA/VoiceOver), and known caveats. Reviewed at PR time.

---

## 8. Testing Setup

`vitest.config.ts` using **Vitest 4 projects**:

| Project | Env     | Purpose                                                                                                |
| ------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `unit`  | `jsdom` | Behaviour, props, events, hooks, utils                                                                 |
| `a11y`  | `jsdom` | `vitest-axe` violation scans (⚠️ jsdom, **not** happy-dom — happy-dom's `isConnected` breaks axe-core) |
| `ssr`   | `node`  | `renderToString` snapshot + hydration mismatch detection via `onRecoverableError` spy                  |

- Setup file: `import 'vitest-axe/extend-expect'` + `@testing-library/jest-dom`.
- Coverage via `@vitest/coverage-v8`; thresholds enforced in CI.
- Optional later: **Vitest browser mode** (Playwright provider) for true `:focus-visible`, real focus rings, and forced-colors emulation — jsdom can't do these.

---

## 9. Shared Utilities & Hooks (v0 surface)

**Utils** — pure, dependency-free, individually tested:

- `cx(...)` — conditional class joiner.
- `dataAttrs({ disabled: true, loading: false })` → `{ 'data-disabled': '' }` (omits falsy — matches CSS `[data-disabled]` selectors).
- `mergeProps(...)` / `composeEventHandlers(a, b)` — composition with `defaultPrevented` respect.
- `polymorphic` — `render`-prop typing helpers + slot prop merging (for `<Button render={<a href=… />}>`).
- `devWarn(cond, msg)` — `process.env.NODE_ENV !== 'production'` guarded invariants, stripped from prod builds.

**Hooks**:

- `useIsomorphicLayoutEffect` — kills SSR `useLayoutEffect` warnings.
- `useMergedRefs` — ref forwarding + internal refs.
- `useControllableState` — controlled/uncontrolled pattern, used by every stateful component later.
- `useTheme` — read/set theme + brand, `system` resolution.
- `useButton` — **Button-local**: normalises native vs non-native elements, keyboard activation, `aria-disabled` semantics, press state.

---

## 10. Component Spec — `Button`

### API

```ts
interface ButtonProps extends Omit<ComponentProps<'button'>, 'disabled'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'; // default 'primary'
  size?: 'sm' | 'md' | 'lg'; // default 'md'
  disabled?: boolean;
  loading?: boolean;
  render?: ReactElement; // polymorphic escape hatch (a, Link, …)
}
```

### Rendered output

```html
<button
  class="luntra-button__root__a1b2c"
  data-luntra-part="button"
  data-variant="primary"
  data-size="md"
  data-loading            <!-- present only when true -->
  data-disabled
  aria-disabled="true"    <!-- instead of `disabled` -->
  aria-busy="true"
>
```

### Accessibility decisions

- **Native `<button>` by default.** `render` swaps the element; `useButton` then adds `role="button"`, `tabIndex={0}` and Space/Enter activation only when the element isn't natively a button.
- **`aria-disabled` over `disabled`.** A `disabled` DOM button is removed from the tab order and announces nothing — users can't discover _why_ it's unavailable. We keep it focusable, block activation (click, Enter, Space, form submit) and expose `data-disabled` for styling. `disabled` remains available via `render` for the rare native-form case.
- **Loading**: `aria-busy="true"` and activation blocked, while the accessible name stays **unchanged** — the spinner is `aria-hidden` and `children` are kept in the DOM (visually hidden, not removed). The name never mutates mid-interaction (SC 4.1.2), and there's no hardcoded English string to i18n.
- **Icon-only**: `devWarn` if no `aria-label`/`aria-labelledby` and no text child.
- **Target size**: even `size="sm"` meets 24×24 via `--luntra-target-size-min`; `md`/`lg` exceed 44×44 (AAA-friendly).
- **Focus**: `:focus-visible` only, 2px outline + 2px offset, 3:1 against both button and page background — validated in **both** themes.
- **Forced colors**: `border: 1px solid ButtonBorder` fallback so variants stay distinguishable in HCM.
- **Reduced motion**: spinner degrades to a static indicator; transitions disabled.

### Styling

`button.module.css` — one `.root` class, **all** variation via data-attributes:

```css
.root { background: var(--luntra-button-bg, var(--luntra-color-action-bg)); }
.root[data-variant='destructive'] { --luntra-button-bg: var(--luntra-color-destructive-bg); }
.root[data-size='sm'] { --luntra-button-block-size: var(--luntra-target-size-min); }
.root[data-disabled] { … }
```

Consumers override with `[data-luntra-part='button'][data-variant='primary'] { --luntra-button-bg: … }` — stable, hash-free, low specificity.

### Test matrix

`unit` (renders, variants, click, disabled blocks activation, loading blocks activation, keyboard Enter/Space, `render` polymorphism, ref forwarding, event composition) · `a11y` (axe × 4 variants × 3 sizes × 2 themes × loading/disabled) · `ssr` (renderToString has no `undefined`, hydrates without recoverable errors).

---

## 11. Documentation Portal (`apps/docs`)

- **TanStack Start 1.x**, SSR enabled — the docs site is itself the proof that the library server-renders.
- **MDX** via `@mdx-js/rollup` in the Vite config. Since Start has no native `.mdx` file-routing yet, use a **single catch-all route** (`routes/docs/$.tsx`) that resolves content through `import.meta.glob('../content/**/*.mdx')` — no per-page `.tsx` wrappers to maintain.
- Plugins: `remark-gfm`, `remark-frontmatter`, `rehype-slug`, `rehype-autolink-headings`, `shiki` for code.
- MDX component map provides `<Preview>` (live, interactive), `<PropsTable>` (generated from TS via `react-docgen-typescript`), `<TokenTable>` (generated from `tokens/source`), `<A11yNotes>`.
- Docs site consumes `luntra-ui` via the workspace, **through its public export map** — so a broken `exports` entry breaks the docs build. Free integration test.
- Docs site is held to the same WCAG 2.2 bar: skip link, landmarks, single `h1`, visible focus, accessible theme/brand switchers (which also serve as the live theming demo).

---

## 12. Versioning, Release & CI

- `@changesets/cli` 3.x, `main` as the release branch, `access: public`.
- `apps/docs` in `ignore` — never published.
- PR gate: a changeset is required for any diff under `packages/`.
- `release.yml`: `changesets/action` opens a "Version Packages" PR; merging it publishes to npm with **provenance** (`NPM_CONFIG_PROVENANCE=true`, OIDC).
- `ci.yml`: lint → typecheck → `test --coverage` → build → `publint` → `attw --pack` → `size-limit` → docs build.
- Node 20.19 / 22 / 24 matrix.

---

## 13. Milestones

| #      | Milestone          | Output                                                                                                                                  |
| ------ | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **M0** | Workspace scaffold | pnpm workspace, TS config, ESLint 9 flat, git + GitHub repo `Wolfje/luntra-ui`                                                          |
| **M1** | Tokens & theming   | `tokens/source`, generator script, `tokens.css`, light/dark/brand sheets, `ThemeProvider` + `getThemeScript()`, contrast tests          |
| **M2** | Build & exports    | Vite multi-entry lib build, `"use client"` plugin, dts, export map, `publint`/`attw` green                                              |
| **M3** | Utils & hooks      | `cx`, `dataAttrs`, `mergeProps`, `polymorphic`, `devWarn`, `useMergedRefs`, `useIsomorphicLayoutEffect`, `useControllableState` + tests |
| **M4** | `Button`           | Component, CSS module, `useButton`, full unit + axe + SSR test matrix, `a11y.md`                                                        |
| **M5** | Docs portal        | TanStack Start + MDX, catch-all content route, `Preview`/`PropsTable`/`TokenTable`, Button page                                         |
| **M6** | CI & first release | `ci.yml`, `release.yml`, changeset, publish `@luntra-ui/react@0.1.0`                                                                    |

---

## 14. Risks & Mitigations

| Risk                                                 | Mitigation                                                                                                                                |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Rollup strips `"use client"` directives              | Custom `renderChunk` plugin re-emits them; asserted by a build smoke test                                                                 |
| CSS Modules in a published lib break non-bundler SSR | Ship `@luntra-ui/react/styles` as a plain aggregated CSS entry; document bundler requirement; class names stay deterministic              |
| `vitest-axe` is `0.1.0` and lightly maintained       | Peer range is `vitest >=0.16.0` (works with Vitest 4); it's a thin wrapper over `axe-core` — swap to direct `axe-core` calls if it stalls |
| TanStack Start has no native MDX routing             | Catch-all route + `import.meta.glob` avoids per-file wrappers                                                                             |
| axe gives false confidence                           | Explicit manual SC checklist + behavioural tests per component; axe is a floor                                                            |
| `aria-disabled` diverges from native `disabled`      | Block click/Enter/Space/submit explicitly and cover each path with a test                                                                 |
| Node 23 is non-LTS                                   | CI matrix pins 20.19 / 22 / 24; `engines` field set                                                                                       |
