// src/utils/shortcuts.ts

export interface Shortcut {
  key: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  action: string;
  description: string;
}

export const SHORTCUTS: Shortcut[] = [
  {
    key: 'e',
    ctrl: true,
    shift: true,
    alt: false,
    action: 'extractConversation',
    description: 'Extract current conversation',
  },
  {
    key: 'i',
    ctrl: true,
    shift: true,
    alt: false,
    action: 'injectContext',
    description: 'Inject context into current chat',
  },
  {
    key: 'h',
    ctrl: true,
    shift: true,
    alt: false,
    action: 'showHistory',
    description: 'Show conversation history',
  },
  {
    key: 'c',
    ctrl: true,
    shift: true,
    alt: false,
    action: 'copyConversation',
    description: 'Copy conversation to clipboard',
  },
  {
    key: 's',
    ctrl: true,
    shift: true,
    alt: false,
    action: 'saveConversation',
    description: 'Save current conversation',
  },
  {
    key: 'd',
    ctrl: true,
    shift: true,
    alt: false,
    action: 'clearConversation',
    description: 'Clear current conversation',
  },
  {
    key: 'k',
    ctrl: true,
    shift: true,
    alt: false,
    action: 'showShortcuts',
    description: 'Show keyboard shortcuts help',
  },
  {
    key: 'ArrowUp',
    ctrl: true,
    shift: false,
    alt: false,
    action: 'previousConversation',
    description: 'Load previous conversation from history',
  },
  {
    key: 'ArrowDown',
    ctrl: true,
    shift: false,
    alt: false,
    action: 'nextConversation',
    description: 'Load next conversation from history',
  },
];

export const initKeyboardShortcuts = (
  onAction: (action: string, event: KeyboardEvent) => void
): (() => void) => {
  const handler = (event: KeyboardEvent) => {
    // Don't trigger if typing in input/textarea
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow Ctrl+Enter to submit
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        onAction('submitMessage', event);
        event.preventDefault();
      }
      return;
    }

    for (const shortcut of SHORTCUTS) {
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl === (event.ctrlKey || event.metaKey);
      const shiftMatch = shortcut.shift === event.shiftKey;
      const altMatch = shortcut.alt === event.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        onAction(shortcut.action, event);
        break;
      }
    }
  };

  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
};

// Get display text for shortcut
export const getShortcutDisplay = (shortcut: Shortcut): string => {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  parts.push(shortcut.key.toUpperCase());
  return parts.join('+');
};

// Check if shortcuts are supported
export const areShortcutsSupported = (): boolean => {
  return 'serviceWorker' in navigator;
};
