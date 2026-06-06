import React, { useState } from 'react';

interface DownloadDialogProps {
  onClose: () => void;
  onDownload: (format: 'pdf' | 'markdown', mode: 'exact' | 'balanced' | 'aggressive') => Promise<void>;
  conversationTitle?: string;
  isLoading?: boolean;
}

export const DownloadDialog: React.FC<DownloadDialogProps> = ({
  onClose,
  onDownload,
  conversationTitle = 'Conversation',
  isLoading = false,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'markdown'>('markdown');
  const [selectedMode, setSelectedMode] = useState<'exact' | 'balanced' | 'aggressive'>('balanced');
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadClick = async () => {
    try {
      setError(null);
      setDownloading(true);
      await onDownload(selectedFormat, selectedMode);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Download failed');
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
      <div className="w-[90%] max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 text-white bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center gap-2">
            <span className="text-xl">⬇️</span>
            <h2 className="text-lg font-semibold">Download Conversation</h2>
          </div>
          <button
            onClick={onClose}
            disabled={downloading || isLoading}
            className="text-2xl hover:opacity-80 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Conversation Title */}
          <div>
            <p className="text-sm text-gray-500 mb-1">Conversation</p>
            <p className="text-sm font-medium text-gray-800 truncate">{conversationTitle}</p>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">📄 File Format</label>
            <div className="space-y-2">
              {[
                { value: 'markdown', label: 'Markdown (.md)', icon: '📝' },
                { value: 'pdf', label: 'PDF Document', icon: '📕' },
              ].map((format) => (
                <button
                  key={format.value}
                  onClick={() => setSelectedFormat(format.value as 'pdf' | 'markdown')}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    selectedFormat === format.value
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-300'
                  } ${downloading || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  disabled={downloading || isLoading}
                >
                  <span className="font-medium">
                    {format.icon} {format.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">🎯 Compression Mode</label>
            <div className="space-y-2">
              {[
                {
                  value: 'exact',
                  label: 'Exact Mode',
                  icon: '📝',
                  description: 'Preserves everything exactly as extracted',
                },
                {
                  value: 'balanced',
                  label: 'Balanced Mode',
                  icon: '⚖️',
                  description: 'Removes redundant filler, keeps structure',
                },
                {
                  value: 'aggressive',
                  label: 'Aggressive Mode',
                  icon: '📊',
                  description: 'Summarizes, focuses on key points',
                },
              ].map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setSelectedMode(mode.value as 'exact' | 'balanced' | 'aggressive')}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    selectedMode === mode.value
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-gray-50 hover:border-green-300'
                  } ${downloading || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  disabled={downloading || isLoading}
                >
                  <div className="font-medium text-gray-800">
                    {mode.icon} {mode.label}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{mode.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">❌ {error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={downloading || isLoading}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleDownloadClick}
              disabled={downloading || isLoading}
              className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {downloading || isLoading ? (
                <>
                  <span className="animate-spin">⟳</span> Downloading...
                </>
              ) : (
                <>
                  ⬇️ Download
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
