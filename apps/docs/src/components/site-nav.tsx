import { Link, useRouterState } from '@tanstack/react-router';

import { navigation } from '../lib/content.js';

/**
 * The documentation sidebar.
 *
 * A `<nav>` with an accessible name, containing real lists. The list structure
 * is what tells a screen reader "8 items" before the user commits to stepping
 * through them, and the name is what distinguishes this nav from the site
 * header in the landmarks list.
 */
export function SiteNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav className="site-nav" aria-label="Documentation">
      {navigation.map((group) => (
        <div className="site-nav__group" key={group.title}>
          {/*
            Each group is labelled by a heading rather than a styled div, so the
            sidebar is navigable by heading as well as by link.
          */}
          <h2 className="site-nav__heading">{group.title}</h2>
          <ul className="site-nav__list">
            {group.pages.map((page) => {
              const current = pathname === page.href;

              return (
                <li key={page.slug}>
                  {/*
                    `aria-current="page"` alongside the visual highlight. The
                    highlight is a colour change, which is invisible in audio
                    and unreliable in forced-colors mode.
                  */}
                  <Link
                    to="/docs/$"
                    params={{ _splat: page.slug }}
                    className="site-nav__link"
                    aria-current={current ? 'page' : undefined}
                  >
                    {page.frontmatter.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
