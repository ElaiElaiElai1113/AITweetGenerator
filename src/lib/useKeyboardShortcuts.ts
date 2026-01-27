import { useEffect } from "react";

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Only allow Ctrl/Cmd + Enter in textareas
        if (
          event.key === "Enter" &&
          (event.ctrlKey || event.metaKey) &&
          target.tagName === "TEXTAREA"
        ) {
          const shortcut = shortcuts.find(
            (s) =>
              s.key === "Enter" &&
              (s.ctrlKey || s.metaKey) &&
              !s.shiftKey === !event.shiftKey
          );
          if (shortcut) {
            event.preventDefault();
            shortcut.action();
          }
        }
        return;
      }

      // Check for matching shortcuts
      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrlKey === (event.ctrlKey || event.metaKey);
        const metaMatch = !!shortcut.metaKey === (event.metaKey || event.ctrlKey);
        const shiftMatch = !!shortcut.shiftKey === event.shiftKey;

        // For single letter shortcuts, require Ctrl/Cmd unless no modifiers specified
        const requiresModifier =
          shortcut.key.length === 1 &&
          !shortcut.ctrlKey &&
          !shortcut.metaKey &&
          !shortcut.shiftKey;

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

// Predefined keyboard shortcut descriptions for UI display
export const SHORTCUT_DESCRIPTIONS = {
  generate: "Generate Tweet",
  copy: "Copy to Clipboard",
  regenerate: "Regenerate",
  history: "Open History",
  close: "Close Dialog",
} as const;
