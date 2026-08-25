# luntra-ui

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

## Contributing

Every change to `packages/` needs a changeset:

```sh
pnpm changeset
```

See [PLAN.md](./PLAN.md) for the full architecture and roadmap.

## License

MIT
