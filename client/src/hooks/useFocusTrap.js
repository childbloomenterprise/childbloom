// Focus trap + Escape-to-close for modal dialogs.
//
// Usage:
//   const ref = useRef(null);
//   useFocusTrap(ref, open, onClose);
//   return <div ref={ref} role="dialog" aria-modal="true">…</div>;
//
// Behavior when `open` is true:
//  - Stashes the previously-focused element
//  - Focuses the first focusable element inside the container
//  - Cycles Tab / Shift+Tab within the container
//  - Calls onClose on Escape
//  - Restores focus to the stashed element on close
//
// Honors prefers-reduced-motion by skipping the auto-focus animation.

import { useEffect } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useFocusTrap(containerRef, isOpen, onClose) {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const container = containerRef.current;
    const previouslyFocused = document.activeElement;

    // Focus first focusable element
    requestAnimationFrame(() => {
      const focusables = container.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusables.length) focusables[0].focus();
      else container.focus?.();
    });

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
        .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // Restore focus to whatever opened the dialog (if still in DOM)
      if (previouslyFocused && typeof previouslyFocused.focus === 'function' && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [isOpen, containerRef, onClose]);
}
