import { useEffect, useRef } from 'react';

/**
 * Registers keyboard shortcuts. Ignores keystrokes when user is focused
 * on input/textarea/select elements.
 *
 * @param {Object<string, Function>} shortcuts  key → handler map
 */
export function useKeyboardShortcuts(shortcuts) {
  // Keep a ref so the effect doesn't re-register on every render
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    function handleKeyDown(e) {
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.target.isContentEditable) return;

      const key = e.key.toLowerCase();
      const handler = shortcutsRef.current[key];
      if (handler) {
        e.preventDefault();
        handler();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
