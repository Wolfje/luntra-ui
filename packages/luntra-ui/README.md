# @luntra-ui/react

Accessible, themeable React components. **WCAG 2.2 AA by default.**

> ⚠️ Pre-release. The public API is not yet stable.

## Install

```sh
pnpm add @luntra-ui/react
```

React 19 is a peer dependency.

## Usage

```tsx
import { Button } from '@luntra-ui/react';
import '@luntra-ui/react/styles';

export function Example() {
  return <Button variant="primary">Save</Button>;
}
```

### Import a single component

Every component is also its own entry point, so you can pull in the smallest
possible graph:

```tsx
import { Button } from '@luntra-ui/react/button';
import '@luntra-ui/react/styles/tokens.css';
```

## Theming

Themes are pure CSS cascade — components never read the theme in JavaScript, so
server-rendered output is identical regardless of the active theme.

```html
<html data-theme="dark" data-brand="acme"></html>
```

`data-theme` and `data-brand` are inherited, so nested themes work anywhere:

```tsx
<section data-theme="light">An always-light island inside a dark page.</section>
```

## Documentation

Full docs, live examples and per-component accessibility notes live in the
[documentation portal](https://github.com/Wolfje/luntra-ui).

## License

MIT
