export interface Shortcut {
  key: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  action: string;
  description: string;
}

export const SHORTCUTS: Shortcut[] = [
  { key: 'e', ctrl: true, shift: true, alt: false, action: 'extractConversation', description: 'Extract current conversation' },
  { key: 'i', ctrl: true, shift: true, alt: false, action: 'injectContext', description: 'Inject context into current chat' },
  { key: 'h', ctrl: true, shift: true, alt: false, action: 'showHistory', description: 'Show conversation history' },
  { key: 'c', ctrl: true, shift: true, alt: false, action: 'copyConversation', description: 'Copy conversation to clipboard' },
  { key: 's', ctrl: true, shift: true, alt: false, action: 'saveConversation', description: 'Save current conversation' },
  { key: 'd', ctrl: true, shift: true, alt: false, action: 'clearConversation', description: 'Clear current conversation' },
  { key: 'k', ctrl: true, shift: true, alt: false, action: 'showShortcuts', description: 'Show keyboard shortcuts help' },
];

export const initKeyboardShortcuts = (
  onAction: (action: string) => void
): (() => void) => {
  const handler = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    const isTyping =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable;

    if (isTyping) {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        onAction('submitMessage');
        event.preventDefault();
      }
      return;
    }

    for (const shortcut of SHORTCUTS) {
      const matches =
        shortcut.key.toLowerCase() === event.key.toLowerCase() &&
        shortcut.ctrl === (event.ctrlKey || event.metaKey) &&
        shortcut.shift === event.shiftKey &&
        shortcut.alt === event.altKey;

      if (matches) {
        event.preventDefault();
        onAction(shortcut.action);
        break;
      }
    }
  };

  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
};

export const areShortcutsSupported = (): boolean => 'serviceWorker' in navigator;