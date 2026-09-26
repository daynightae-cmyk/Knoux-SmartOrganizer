import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

/**
 * React-native focus containment, focus return and Escape handling.
 *
 * Ported as a concept from the curated design reference's `c-focus-lock` and
 * `c-modal` engineering notes. No Vue composable, no framework runtime, no
 * positioning library. The only dependency is the DOM.
 */

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])', 'textarea:not([disabled])', 'summary', '[tabindex]:not([tabindex="-1"])'
].join(',');

/**
 * Pure Tab-order arithmetic, separated from the DOM so the keyboard contract
 * is unit-testable. Returns the index that should receive focus next, or null
 * when the browser default should be allowed to run.
 */
export function nextFocusIndex(total: number, currentIndex: number, shiftKey: boolean): number | null {
  if (total <= 0) return null;
  if (shiftKey) {
    if (currentIndex <= 0) return total - 1;
    return currentIndex - 1;
  }
  if (currentIndex >= total - 1) return 0;
  return currentIndex + 1;
}

function focusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(element => {
    if (element.getAttribute('aria-hidden') === 'true') return false;
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0 || element === document.activeElement;
  });
}

export interface FocusTrapOptions {
  active: boolean;
  onEscape?: () => void;
  /** Element focus returns to when the trap closes. */
  returnFocusTo?: HTMLElement | null;
  labelledBy?: string;
  describedBy?: string;
}

export function useFocusTrap<T extends HTMLElement>({ active, onEscape, returnFocusTo, labelledBy, describedBy }: FocusTrapOptions) {
  const containerRef = useRef<T | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    previouslyFocused.current = (document.activeElement as HTMLElement) ?? null;
    const container = containerRef.current;
    if (!container) return;

    const first = focusable(container)[0] ?? container;
    const focusTimer = window.setTimeout(() => {
      (container.querySelector<HTMLElement>('[data-autofocus]') ?? first).focus();
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        event.stopPropagation();
        onEscape();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable(container);
      if (!items.length) { event.preventDefault(); return; }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const active_ = document.activeElement as HTMLElement | null;
      const currentIndex = items.indexOf(active_ as HTMLElement);
      const next = currentIndex < 0
        ? (event.shiftKey ? items.length - 1 : 0)
        : nextFocusIndex(items.length, currentIndex, event.shiftKey);
      if (next === null) return;
      // Contain Tab inside the dialog instead of letting it escape to the page behind.
      const atEdge = (currentIndex <= 0 && event.shiftKey) || (currentIndex === items.length - 1 && !event.shiftKey) || currentIndex < 0;
      if (!atEdge && next === currentIndex) return;
      event.preventDefault();
      (items[next] ?? firstItem ?? container).focus();
      if (next === items.length - 1 && !event.shiftKey) lastItem.focus();
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown, true);
      const target = returnFocusTo ?? previouslyFocused.current;
      if (target && document.contains(target)) target.focus();
    };
  }, [active, onEscape, returnFocusTo]);

  const bind = (node: T | null) => { containerRef.current = node; return node; };

  return {
    ref: bind,
    dialogProps: {
      role: 'dialog' as const,
      'aria-modal': true as const,
      ...(labelledBy ? { 'aria-labelledby': labelledBy } : {}),
      ...(describedBy ? { 'aria-describedby': describedBy } : {})
    }
  };
}

/** Polite live region that announces operation state changes to assistive technology. */
export function LiveRegion({ message }: { message: string }) {
  return <div className="live-region" role="status" aria-live="polite" aria-atomic="true">{message}</div>;
}

/** Visually hidden text used to give icons and colour-only badges a text equivalent. */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="visually-hidden">{children}</span>;
}

/** Skip link target so keyboard users can bypass the navigation. */
export function SkipLink({ href, label }: { href: string; label: string }) {
  return <a className="skip-link" href={href}>{label}</a>;
}
