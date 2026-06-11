import { useState } from 'react';

interface Props {
  onClose: () => void;
  onDownload: (format: 'pdf' | 'markdown', mode: 'exact' | 'balanced' | 'aggressive') => Promise<void>;
  conversationTitle?: string;
  isLoading?: boolean;
}

const FORMATS = [
  { value: 'markdown' as const, label: 'Markdown (.md)', icon: '📝' },
  { value: 'pdf' as const, label: 'PDF Document', icon: '📕' },
];

const MODES = [
  { value: 'exact' as const, label: 'Exact', icon: '📝', desc: 'Full conversation, nothing removed' },
  { value: 'balanced' as const, label: 'Balanced', icon: '⚖️', desc: 'Removes duplicates, keeps context' },
  { value: 'aggressive' as const, label: 'Aggressive', icon: '📊', desc: 'Smart summary, saves tokens' },
];

export const DownloadDialog = ({ onClose, onDownload, conversationTitle = 'Conversation', isLoading = false }: Props) => {
  const [format, setFormat] = useState<'pdf' | 'markdown'>('markdown');
  const [mode, setMode] = useState<'exact' | 'balanced' | 'aggressive'>('balanced');
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setError(null);
      setDownloading(true);
      await onDownload(format, mode);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Download failed');
      setDownloading(false);
    }
  };

  const busy = downloading || isLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
      <div className="w-[90%] max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-slide-up">

        <div className="flex items-center justify-between px-6 py-4 text-white bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center gap-2">
            <span className="text-xl">⬇️</span>
            <h2 className="text-lg font-semibold">Download Conversation</h2>
          </div>
          <button onClick={onClose} disabled={busy} className="text-2xl hover:opacity-80 disabled:opacity-50">✕</button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="mb-1 text-xs text-gray-500">Conversation</p>
            <p className="text-sm font-medium text-gray-800 truncate">{conversationTitle}</p>
          </div>

          {/* Format */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">📄 File Format</label>
            <div className="space-y-2">
              {FORMATS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  disabled={busy}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all ${format === f.value ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-300'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="font-medium">{f.icon} {f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">🎯 Compression Mode</label>
            <div className="space-y-2">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  disabled={busy}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all ${mode === m.value ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50 hover:border-green-300'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="font-medium text-gray-800">{m.icon} {m.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 border border-red-200 rounded-lg bg-red-50">
              <p className="text-sm text-red-700">❌ {error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} disabled={busy} className="flex-1 px-4 py-2 font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleDownload} disabled={busy} className="flex items-center justify-center flex-1 gap-2 px-4 py-2 font-medium text-white rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50">
              {busy ? <><span className="animate-spin">⟳</span> Downloading...</> : <>⬇️ Download</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};