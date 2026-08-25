import type { ComponentType } from 'react';

export interface DocFrontmatter {
  title: string;
  description?: string;
  /** Sidebar section. Pages with no group sit at the top level. */
  group?: string;
  /** Sort order within a group. Unordered pages fall to the bottom, alphabetically. */
  order?: number;
}

interface MdxModule {
  default: ComponentType;
  frontmatter?: Partial<DocFrontmatter>;
}

/**
 * Every page, resolved at build time.
 *
 * Eager rather than lazy. A lazy glob would code-split each page, which sounds
 * like the right instinct, but here it buys nothing and costs something: the
 * site is a handful of prose pages, so the split chunks are smaller than the
 * requests that fetch them, and every navigation gains a loading state that has
 * to be designed, announced to screen readers, and kept from shifting layout.
 *
 * Eager also means a page that fails to compile fails the build, rather than
 * 404ing at runtime for whoever happens to click it first.
 */
const modules = import.meta.glob<MdxModule>('../content/**/*.mdx', { eager: true });

export interface DocPage {
  slug: string;
  href: string;
  frontmatter: DocFrontmatter;
  Content: ComponentType;
}

/** `../content/components/button.mdx` -> `components/button`; `index.mdx` -> `''`. */
function toSlug(path: string): string {
  return path
    .replace(/^\.\.\/content\//, '')
    .replace(/\.mdx$/, '')
    .replace(/(^|\/)index$/, '');
}

function buildPages(): DocPage[] {
  return Object.entries(modules).map(([path, module]) => {
    const slug = toSlug(path);
    const title = module.frontmatter?.title;

    if (!title) {
      /**
       * Thrown rather than defaulted. A missing title silently becomes a blank
       * sidebar entry and a document with no `<title>` — a page nobody can find
       * and a tab nobody can identify. Failing the build is the kinder outcome.
       */
      throw new Error(`${path} has no \`title\` in its frontmatter.`);
    }

    return {
      slug,
      href: slug ? `/docs/${slug}` : '/docs',
      frontmatter: { ...module.frontmatter, title },
      Content: module.default,
    };
  });
}

export const pages: DocPage[] = buildPages();

const bySlug = new Map(pages.map((page) => [page.slug, page]));

export function getPage(slug: string): DocPage | undefined {
  return bySlug.get(slug.replace(/^\/+|\/+$/g, ''));
}

export interface NavGroup {
  title: string;
  pages: DocPage[];
}

/** Order of the sidebar sections. Anything unlisted is appended alphabetically. */
const GROUP_ORDER = ['Overview', 'Foundations', 'Components'];

function compare(a: DocPage, b: DocPage): number {
  const orderA = a.frontmatter.order ?? Number.MAX_SAFE_INTEGER;
  const orderB = b.frontmatter.order ?? Number.MAX_SAFE_INTEGER;
  if (orderA !== orderB) return orderA - orderB;
  return a.frontmatter.title.localeCompare(b.frontmatter.title);
}

export const navigation: NavGroup[] = (() => {
  const groups = new Map<string, DocPage[]>();

  for (const page of pages) {
    const group = page.frontmatter.group ?? 'Overview';
    const existing = groups.get(group);
    if (existing) existing.push(page);
    else groups.set(group, [page]);
  }

  return [...groups.entries()]
    .map(([title, groupPages]) => ({ title, pages: groupPages.sort(compare) }))
    .sort((a, b) => {
      const indexA = GROUP_ORDER.indexOf(a.title);
      const indexB = GROUP_ORDER.indexOf(b.title);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.title.localeCompare(b.title);
    });
})();
