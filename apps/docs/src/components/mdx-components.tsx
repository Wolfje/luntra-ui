import type { MDXComponents } from 'mdx/types';

import { Button } from '../lib/luntra.js';
import { A11yNotes } from './a11y-notes.js';
import { Preview } from './preview.js';
import { PropsTable } from './props-table.js';
import { TableScroll } from './table-scroll.js';
import { TokenTable } from './token-table.js';

/**
 * What MDX pages can use without importing anything.
 *
 * The library's own components are in scope so examples are written the way a
 * reader would write them, not wrapped in a docs-only shim that could quietly
 * paper over a defect.
 */
export const mdxComponents: MDXComponents = {
  A11yNotes,
  Preview,
  PropsTable,
  TokenTable,
  Button,

  /**
   * Tables get a focusable scroll container.
   *
   * Markdown tables overflow on narrow viewports, and this is the one place a
   * Markdown author cannot fix it themselves. See `table-scroll.tsx`.
   */
  table: (props) => (
    <TableScroll label="Table">
      <table {...props} />
    </TableScroll>
  ),
};
