# luntra-ui

[![CI](https://github.com/Wolfje/luntra-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/Wolfje/luntra-ui/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@luntra-ui/react.svg)](https://www.npmjs.com/package/@luntra-ui/react)

Accessible, themeable React components. **WCAG 2.2 AA by default.**

> ⚠️ Pre-release. The public API is not yet stable.

## Packages

| Package                                    | Description                                 |
| ------------------------------------------ | ------------------------------------------- |
| [`@luntra-ui/react`](./packages/luntra-ui) | The React component library                 |
| `@luntra-ui/docs` (private)                | Documentation portal — TanStack Start + MDX |

## Principles

- **Accessible by default.** Native semantics first, ARIA only where the platform falls short. WCAG 2.2 AA is the floor, not an add-on.
- **Server- and client-rendered.** No DOM access during render, no bundler-only globals, `"use client"` where it belongs.
- **Tokens are the API.** Every visual value resolves to a CSS custom property, so theming never requires a specificity fight.
- **Data-attributes for state.** `data-variant`, `data-size`, `data-disabled` — a stable, hash-free hook for consumer overrides.
- **Zero runtime dependencies.** CSS Modules compile away; nothing ships but components and CSS.

## Development

```sh
pnpm install
pnpm build        # build all packages
pnpm test         # run the full test suite (unit + a11y + ssr)
pnpm lint
pnpm typecheck
pnpm dev          # run the docs portal
```

Requires Node >= 20.19 and pnpm 10.

The docs portal depends on the library's built output, so `pnpm build` has to
run before `pnpm dev` on a fresh clone. It also generates its route tree and its
props table, which is why `pnpm --filter @luntra-ui/docs run typecheck` only
works after `pnpm --filter @luntra-ui/docs run build` — those files are derived
from source and deliberately not committed, since a checked-in props table that
disagrees with the code is worse than none.

## Quality gates

Every pull request has to clear these before it can merge. They exist because
each one covers a failure that is invisible in review and expensive after
release.

| Gate                  | What it catches                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------- |
| Contrast tests        | A token whose foreground/background pair fails WCAG 2.2 AA, in any brand, theme or state    |
| axe (component)       | Missing names, wrong roles, broken relationships in a component's own markup                |
| axe (server-rendered) | Document-scope failures no component test can see — landmarks, heading order, duplicate ids |
| SSR tests             | Render-time DOM access, and hydration mismatches                                            |
| `build-output` tests  | A broken `exports` entry, a stripped `"use client"`, CSS that didn't ship                   |
| `publint` + `attw`    | Packaging that only fails once someone installs it                                          |
| `size-limit`          | A bundle regression, and tree-shaking quietly breaking                                      |
| Node 20.19 / 22 / 24  | Code that only works on the maintainer's Node version                                       |

## Contributing

Every change to `packages/` needs a changeset:

```sh
pnpm changeset
```

Pick the bump that describes what a consumer has to do — patch if nothing about
their code changes, minor if they gain something without losing anything, major
if something they wrote will stop working. CI enforces this, because a change
that ships with no changeset silently never reaches npm.

Releases are automated: merging to `main` opens a "Version Packages" pull
request, and merging _that_ publishes to npm with provenance.

See [PLAN.md](./PLAN.md) for the full architecture and roadmap.

## License

MIT
