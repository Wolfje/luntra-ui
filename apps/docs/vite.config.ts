import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';

import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeShiki from '@shikijs/rehype';
import rehypeSlug from 'rehype-slug';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    /**
     * MDX has to run before the React plugin: it turns `.mdx` into JSX, and
     * the React plugin is what compiles JSX and wires Fast Refresh. Reversing
     * the order leaves raw JSX for esbuild and breaks HMR on every page.
     *
     * `enforce: 'pre'` is what actually guarantees that, since Vite sorts
     * plugins by enforce before array order.
     */
    {
      enforce: 'pre',
      ...mdx({
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [
          remarkGfm,
          [remarkFrontmatter, 'yaml'],
          /**
           * Turns the YAML block into `export const frontmatter = {…}`, which is
           * what lets the nav be built from the content itself. Without a named
           * export the frontmatter is parsed and then thrown away.
           */
          [remarkMdxFrontmatter, { name: 'frontmatter' }],
        ],
        rehypePlugins: [
          rehypeSlug,
          /**
           * `behavior: 'append'` with visually-hidden text rather than
           * `'wrap'`. Wrapping puts the heading text inside a link, so a screen
           * reader announces every heading as "link" — the heading list, which
           * is how most screen-reader users navigate a page, becomes useless.
           */
          [
            rehypeAutolinkHeadings,
            {
              behavior: 'append',
              properties: { className: 'heading-anchor' },
              content: {
                type: 'element',
                tagName: 'span',
                properties: { className: 'visually-hidden' },
                children: [{ type: 'text', value: 'Permalink to this section' }],
              },
            },
          ],
          /**
           * Shiki highlights at build time, so no highlighter ships to the
           * browser and code blocks are correct in the server HTML.
           *
           * Both themes are emitted as CSS variables and switched by
           * `data-theme`, so code follows the site theme without a re-render.
           */
          [
            rehypeShiki,
            {
              themes: { light: 'github-light', dark: 'github-dark' },
              defaultColor: false,
              cssVariablePrefix: '--shiki-',
            },
          ],
        ],
      }),
    },
    tanstackStart(),
    viteReact(),
  ],
});
