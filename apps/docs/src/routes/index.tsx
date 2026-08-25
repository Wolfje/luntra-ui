import { createFileRoute, Link } from '@tanstack/react-router';

import { Button } from '../lib/luntra.js';

export const Route = createFileRoute('/')({ component: Home });

function Home() {
  return (
    <div className="prose">
      <h1>Luntra UI</h1>
      <p className="prose__lede">
        Accessible, themeable React components. WCAG 2.2 AA by default, server-rendered, styled with
        CSS custom properties.
      </p>

      <p className="home__actions">
        {/*
          The splat route is the only `/docs/*` route there is, so links to a
          page go through it with the slug as `_splat`. TanStack types `to`
          against the generated route tree, which is what stops a typo here from
          becoming a 404 nobody notices.
        */}
        <Button render={<Link to="/docs/$" params={{ _splat: 'getting-started' }} />} size="lg">
          Get started
        </Button>
        <Button
          render={<Link to="/docs/$" params={{ _splat: 'components/button' }} />}
          variant="secondary"
          size="lg"
        >
          Browse components
        </Button>
      </p>

      <h2>What you get</h2>
      <ul>
        <li>
          Accessibility built in, not bolted on — every component is tested against axe and asserted
          behaviourally for keyboard and screen-reader use.
        </li>
        <li>
          Colour contrast proved against the tokens, in every brand and both themes, rather than
          eyeballed.
        </li>
        <li>Server rendering with no flash of the wrong theme, and no hydration mismatch.</li>
        <li>
          Importable whole or one component at a time, with styles that stay out of your
          bundler&rsquo;s way.
        </li>
      </ul>
    </div>
  );
}
