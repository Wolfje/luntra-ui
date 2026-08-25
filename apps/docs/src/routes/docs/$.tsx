import { createFileRoute, notFound } from '@tanstack/react-router';

import { getPage } from '../../lib/content.js';

export const Route = createFileRoute('/docs/$')({
  component: DocPage,
  /**
   * Resolved in a loader rather than in the component so that an unknown slug
   * produces a real 404 — correct status code, correct `<title>` — instead of
   * a 200 with an apology in the body. Crawlers and monitoring both care, and
   * so does anyone who bookmarked a page that has since been renamed.
   */
  loader: ({ params }) => {
    const page = getPage(params._splat ?? '');
    if (!page) throw notFound();
    return { slug: page.slug };
  },
  head: ({ loaderData }) => {
    const page = loaderData ? getPage(loaderData.slug) : undefined;
    if (!page) return {};

    return {
      meta: [
        { title: `${page.frontmatter.title} · Luntra UI` },
        ...(page.frontmatter.description
          ? [{ name: 'description', content: page.frontmatter.description }]
          : []),
      ],
    };
  },
});

/**
 * One route for every page.
 *
 * TanStack Start has no native `.mdx` file routing, and writing a `.tsx`
 * wrapper per page would mean two files to keep in step for every document —
 * the kind of duplication that drifts silently. A single splat route resolving
 * against the content glob means adding a page is adding one `.mdx` file.
 */
function DocPage() {
  const { slug } = Route.useLoaderData();
  const page = getPage(slug);

  if (!page) return null;

  const { Content, frontmatter } = page;

  return (
    <article className="prose">
      {/*
        The `h1` comes from frontmatter, not from the Markdown, so every page
        is guaranteed exactly one and it always matches the title in the tab
        and the sidebar. Leaving it to the author invites pages with none, two,
        or one that disagrees with the nav.
      */}
      <h1>{frontmatter.title}</h1>
      {frontmatter.description ? <p className="prose__lede">{frontmatter.description}</p> : null}
      <Content />
    </article>
  );
}
