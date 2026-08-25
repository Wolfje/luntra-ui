import type { ComponentProps } from 'react';

import type { RenderProp } from '../../utils/render-element.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ComponentProps<'button'>, 'disabled'> {
  /**
   * Visual weight. Carries no meaning on its own — `destructive` styles a
   * button red, it does not warn anybody. If an action is irreversible, say so
   * in the label or confirm it.
   *
   * @default 'primary'
   */
  variant?: ButtonVariant;

  /**
   * Control height. Every size clears the 24x24 CSS pixel minimum of WCAG 2.2
   * SC 2.5.8; `lg` reaches the 44px AAA figure from SC 2.5.5. Prefer `lg` for
   * primary actions on touch, where a mis-tap costs the user a page load.
   *
   * @default 'md'
   */
  size?: ButtonSize;

  /**
   * Marks the button unavailable.
   *
   * Rendered as `aria-disabled`, never the native `disabled` attribute. A
   * natively disabled button is removed from the tab order, so a keyboard or
   * screen-reader user cannot reach it, cannot read it, and gets no explanation
   * for why the thing they were looking for has vanished. `aria-disabled` keeps
   * it focusable and announced while this component blocks activation.
   */
  disabled?: boolean;

  /**
   * Marks an action as in progress.
   *
   * Implies {@link ButtonProps.disabled} for activation purposes and sets
   * `aria-busy`. Children stay in the DOM so the accessible name never changes
   * mid-action — swapping the label for a spinner would make a screen reader
   * announce a different button, and re-announce it again when the action
   * finishes.
   */
  loading?: boolean;

  /**
   * Render a different element while keeping every Button behaviour.
   *
   * Use it when the control navigates: `render={<a href="/pricing" />}`.
   * A `<button>` that navigates gives keyboard and screen-reader users the
   * wrong role, the wrong activation keys and no context menu.
   *
   * @example
   * <Button render={<a href="/pricing" />}>Pricing</Button>
   */
  render?: RenderProp;
}
