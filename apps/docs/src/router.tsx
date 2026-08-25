import { createRouter as createTanStackRouter } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';

export function getRouter() {
  return createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: NotFound,
  });
}

function NotFound() {
  return (
    <main className="prose" id="main">
      <h1>Page not found</h1>
      <p>That page does not exist. Try the navigation, or start from the beginning.</p>
      <p>
        <a href="/docs/getting-started">Getting started</a>
      </p>
    </main>
  );
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
