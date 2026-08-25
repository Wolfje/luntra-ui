import { useId, useState, type ReactNode } from 'react';

export interface PreviewProps {
  children: ReactNode;
  /** The source shown under the example. Usually passed by MDX as a fenced block. */
  code?: string;
  /** Lay the example out in a row rather than a column. */
  inline?: boolean;
  /** Give the example a dark surface regardless of the site theme. */
  surface?: 'default' | 'subtle';
}

/**
 * A live, interactive example with its source underneath.
 *
 * The example is real components rather than a screenshot, which is the point:
 * a screenshot cannot be tabbed into, cannot be read by a screen reader, and
 * cannot go stale visibly. If the Button's focus ring regresses, it regresses
 * here in front of the reader.
 */
export function Preview({ children, code, inline = false, surface = 'default' }: PreviewProps) {
  const [showCode, setShowCode] = useState(false);
  const codeId = useId();

  return (
    <div className="preview" data-surface={surface}>
      {/*
        Not a <figure>/<figcaption>: the example is interactive content, not an
        illustration, and wrapping focusable controls in a figure adds a
        landmark that screen-reader users have to step over on every example.
      */}
      <div className="preview__stage" data-inline={inline || undefined}>
        {children}
      </div>

      {code ? (
        <>
          <div className="preview__toolbar">
            <button
              type="button"
              className="preview__toggle"
              aria-expanded={showCode}
              aria-controls={codeId}
              onClick={() => setShowCode((open) => !open)}
            >
              {showCode ? 'Hide code' : 'Show code'}
            </button>
          </div>

          {/*
            `hidden` rather than unmounting. Keeping the node in the DOM means
            the `aria-controls` reference stays valid, so a screen reader can
            follow it, and the expanded state describes something that exists.
          */}
          <div className="preview__code" id={codeId} hidden={!showCode}>
            <pre>
              <code>{code}</code>
            </pre>
          </div>
        </>
      ) : null}
    </div>
  );
}
