import { cloneElement, createElement, isValidElement } from 'react';
import type { ElementType, ReactElement, Ref } from 'react';

import { mergeProps } from './merge-props.js';
import { mergeRefs } from './merge-refs.js';

/**
 * A `render` prop: an element to render *instead of* the default tag, keeping
 * all of the component's behaviour, styling and accessibility wiring.
 *
 * @example
 * <Button render={<a href="/pricing" />}>Pricing</Button>
 */
export type RenderProp = ReactElement<Record<string, unknown>>;

/**
 * Render a component's own props onto either its default element or a
 * consumer-supplied one.
 *
 * ## Why a `render` prop rather than `as` / `asChild`
 *
 * An `as="a"` prop is nearly impossible to type honestly — the valid props
 * change with the tag, and the usual generic gymnastics degrade to `any` at the
 * first sign of a union. Handing over a real element instead means TypeScript
 * checks it against `<a>`'s own props with no extra machinery, and the consumer
 * can pre-fill whatever they like.
 *
 * This matters for accessibility more than for ergonomics: a "button" that
 * navigates must be an `<a>`, or keyboard and screen-reader users get the wrong
 * role, the wrong keys and no context menu. Making the correct element easy to
 * reach is how the library stays accessible in real applications rather than
 * only in its own tests.
 *
 * ## Merge order
 *
 * The component's props are the base and the consumer's element wins, so
 * `render={<a aria-label="…" />}` overrides. Event handlers, `className` and
 * `style` are combined rather than replaced (see {@link mergeProps}), and refs
 * are merged so both sides keep their reference to the node.
 */
export function renderElement(
  defaultElement: ElementType,
  props: Record<string, unknown>,
  render: RenderProp | undefined,
): ReactElement {
  if (!render) {
    return createElement(defaultElement, props);
  }

  if (!isValidElement(render)) {
    throw new TypeError(
      'The `render` prop must be a React element, for example render={<a href="/" />}. ' +
        'A component type or a function is not accepted, because the element is what carries ' +
        'the props to merge.',
    );
  }

  const renderProps = render.props as Record<string, unknown>;
  const merged = mergeProps(props, renderProps);

  // `ref` lives in props from React 19 onward, but mergeProps treats it as an
  // ordinary value and the override would win — silently costing the component
  // its own reference to the node.
  const ownRef = props['ref'] as Ref<unknown> | undefined;
  const renderRef = renderProps['ref'] as Ref<unknown> | undefined;

  if (ownRef && renderRef) {
    merged['ref'] = mergeRefs(ownRef, renderRef);
  } else {
    merged['ref'] = ownRef ?? renderRef;
  }

  return cloneElement(render, merged);
}
