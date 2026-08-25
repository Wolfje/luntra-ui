import type { ReactNode } from 'react';

export interface TableScrollProps {
  children: ReactNode;
  /** Names the region, so a screen reader announces what is being scrolled. */
  label: string;
}

/**
 * A horizontally scrollable container for a wide table.
 *
 * Tables overflow on narrow viewports, and a container that scrolls but cannot
 * receive focus is unreachable by keyboard — the content past the right edge
 * simply does not exist for anyone not using a pointer. WCAG 2.2 SC 2.1.1.
 *
 * The fix is the pattern the WAI documents: make the scroll container focusable
 * and give it a name and a role, so it is announced as something scrollable
 * rather than as an unexplained tab stop.
 */
export function TableScroll({ children, label }: TableScrollProps) {
  return (
    /*
      eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex --
      A scrollable region is the documented exception to this rule: it is not
      interactive in the ARIA sense, but it *is* operable, and without a tab
      stop its overflow is keyboard-inaccessible. The `role` and `aria-label`
      are what make the tab stop comprehensible rather than mysterious.
    */
    <div className="table-scroll" tabIndex={0} role="region" aria-label={label}>
      {children}
    </div>
  );
}
