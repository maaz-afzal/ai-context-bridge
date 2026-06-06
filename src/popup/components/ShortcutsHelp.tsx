import React, { useState, useEffect } from 'react';
import { SHORTCUTS, areShortcutsSupported } from '../../utils/shortcuts';

interface ShortcutsHelpProps {
  onClose: () => void;
}

export const ShortcutsHelp: React.FC<ShortcutsHelpProps> = ({ onClose }) => {
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    setIsSupported(areShortcutsSupported());
  }, []);

  const getPlatformModifier = () => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    return isMac ? '⌘' : 'Ctrl';
  };

  const getShortcutDisplay = (shortcut: (typeof SHORTCUTS)[0]) => {
    const parts: string[] = [];
    if (shortcut.ctrl) parts.push(getPlatformModifier());
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');
    parts.push(shortcut.key.toUpperCase());
    return parts.join('+');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
      <div className="w-[90%] max-w-md bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 text-white bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center gap-2">
            <span className="text-xl">⌨️</span>
            <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 text-xl transition-colors rounded-full hover:bg-white hover:bg-opacity-20"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {!isSupported && (
            <div className="p-3 mb-4 text-sm text-yellow-700 bg-yellow-100 rounded-lg">
              ⚠️ Keyboard shortcuts may not work in all browsers. Use Chrome for best experience.
            </div>
          )}

          <div className="mb-2 text-sm text-gray-600">
            Press these shortcuts anywhere on the page:
          </div>

          <div className="space-y-2">
            {SHORTCUTS.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-100"
              >
                <span className="text-sm text-gray-700">{shortcut.description}</span>
                <kbd className="px-2 py-1 font-mono text-xs bg-gray-100 rounded-md shadow-sm">
                  {getShortcutDisplay(shortcut)}
                </kbd>
              </div>
            ))}
          </div>

          <div className="p-3 mt-4 text-xs text-gray-500 rounded-lg bg-gray-50">
            <p className="mb-1 font-medium">💡 Tips:</p>
            <ul className="ml-4 space-y-1 list-disc">
              <li>Shortcuts work when not typing in input fields</li>
              <li>
                Use <kbd className="px-1 bg-gray-200 rounded">Ctrl+Enter</kbd> to submit messages
              </li>
              <li>Customize shortcuts in Chrome Extensions → Keyboard shortcuts</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 text-xs text-center text-gray-500 border-t">
          AI Context Bridge v1.0
        </div>
      </div>
    </div>
  );
};
