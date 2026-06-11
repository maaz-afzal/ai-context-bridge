import { useState, useEffect } from 'react';
import { SHORTCUTS, areShortcutsSupported } from '../../utils/shortcuts';

interface Props {
  onClose: () => void;
}

const isMac = () => navigator.platform.toUpperCase().includes('MAC');

const displayShortcut = (s: (typeof SHORTCUTS)[0]): string => {
  const parts: string[] = [];
  if (s.ctrl) parts.push(isMac() ? '⌘' : 'Ctrl');
  if (s.shift) parts.push('Shift');
  if (s.alt) parts.push('Alt');
  parts.push(s.key.toUpperCase());
  return parts.join('+');
};

export const ShortcutsHelp = ({ onClose }: Props) => {
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(areShortcutsSupported());
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
      <div className="w-[90%] max-w-md bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 text-white bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center gap-2">
            <span className="text-xl">⌨️</span>
            <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 text-xl rounded-full hover:bg-white hover:bg-opacity-20"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {!supported && (
            <div className="p-3 text-sm text-yellow-700 bg-yellow-100 rounded-lg">
              ⚠️ Keyboard shortcuts work best in Chrome.
            </div>
          )}

          <p className="text-sm text-gray-600">Press these shortcuts anywhere on the page:</p>

          <div className="space-y-2">
            {SHORTCUTS.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-gray-100"
              >
                <span className="text-sm text-gray-700">{s.description}</span>
                <kbd className="px-2 py-1 font-mono text-xs bg-gray-100 rounded-md shadow-sm">
                  {displayShortcut(s)}
                </kbd>
              </div>
            ))}
          </div>

          <div className="p-3 mt-4 text-xs text-gray-500 rounded-lg bg-gray-50">
            <p className="mb-1 font-medium">💡 Tips:</p>
            <ul className="ml-4 space-y-1 list-disc">
              <li>Shortcuts work when not typing in input fields</li>
              <li>Customize at chrome://extensions/shortcuts</li>
            </ul>
          </div>
        </div>

        <div className="px-5 py-3 text-xs text-center text-gray-500 border-t">
          AI Context Bridge v1.0
        </div>
      </div>
    </div>
  );
};
