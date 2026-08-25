import { useId, type ReactNode } from 'react';

export interface A11yNotesProps {
  children: ReactNode;
  /** Heading for the callout. */
  title?: string;
  /**
   * `guarantee` — the library handles it.
   * `responsibility` — the consumer still has to do something.
   */
  tone?: 'guarantee' | 'responsibility';
}

const DEFAULT_TITLES: Record<NonNullable<A11yNotesProps['tone']>, string> = {
  guarantee: 'What this handles for you',
  responsibility: 'What you still have to do',
};

/**
 * A callout for accessibility notes.
 *
 * Deliberately two-toned. A docs site that only lists what a library handles
 * teaches readers that using the component is sufficient, which is how an
 * icon-only button ships with no accessible name. Separating the guarantees
 * from the reader's remaining obligations is the honest shape.
 */
export function A11yNotes({ children, title, tone = 'guarantee' }: A11yNotesProps) {
  const heading = title ?? DEFAULT_TITLES[tone];
  const headingId = useId();

  return (
    /*
      A plain section named by its own heading, not role="note" or a bare div.
      Naming the section makes it a region, so a screen-reader user can find it
      and skip past it the same way a sighted reader skims past a coloured box.
      A div would leave the callout with no boundary at all in audio.
    */
    <section className="a11y-notes" data-tone={tone} aria-labelledby={headingId}>
      <h3 className="a11y-notes__title" id={headingId}>
        <span className="a11y-notes__badge" aria-hidden="true" />
        {heading}
      </h3>
      <div className="a11y-notes__body">{children}</div>
    </section>
  );
}
