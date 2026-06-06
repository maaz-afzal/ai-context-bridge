import React, { useEffect, useCallback, useState } from 'react';
import { useAppStore } from './store';
import { ToastContainer } from './components/ToastContainer';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { formatConversation, compressConversation } from '../services/contextEngine';
import { estimateConversationTokens } from '../utils/tokenCounter';
import { HistoryPanel } from './components/HistoryPanel';
import { initKeyboardShortcuts } from '../utils/shortcuts';
import { ShortcutsHelp } from './components/ShortcutsHelp';
import { HistoryService } from '../services/historyService';
import { DownloadDialog } from './components/DownloadDialog';
import { handleDownload } from '../utils/downloadExport';

const App: React.FC = () => {
  const {
    conversation,
    compressed,
    settings,
    syncStatus,
    toasts,
    isLoading,
    error,
    lastUsedMode,
    setConversation,
    setCompressed,
    updateSettings,
    setSyncStatus,
    addToast,
    removeToast,
    setLoading,
    setError,
    reset,
    saveToStorage,
    loadFromStorage,
    clearStorage,
    setLastUsedMode,
  } = useAppStore();

  const [showHistory, setShowHistory] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);

  // Load saved conversation when popup opens
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Get active tab ID
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) setActiveTabId(tabs[0].id);
    });
  }, []);

  // Derive if mode changed after extraction
  const modeChanged = !!(lastUsedMode && lastUsedMode !== settings.compressionMode);

  // Validate conversation on load and auto-generate compressed if missing
  useEffect(() => {
    if (conversation && (!conversation.messages || conversation.messages.length === 0)) {
      clearStorage();
      reset();
    }

    // Auto-generate compressed if conversation exists but compressed is missing
    if (conversation && !compressed && conversation.messages && conversation.messages.length > 0) {
      const autoCompressed = compressConversation(conversation, settings.compressionMode);
      setCompressed(autoCompressed);
      setLastUsedMode(settings.compressionMode);
    }
  }, [conversation, compressed, clearStorage, reset, setCompressed, setLastUsedMode, settings.compressionMode]);

  const handleLoadFromHistory = useCallback(
    (historyConversation: any, historyCompressed: any) => {
      setConversation(historyConversation);
      setCompressed(historyCompressed);
      setShowHistory(false);
      addToast(
        `Loaded ${historyConversation?.messages?.length || 0} messages from history`,
        'success'
      );
    },
    [setConversation, setCompressed, addToast]
  );

  const handleExtract = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSyncStatus({ status: 'extracting', progress: 20, message: 'Extracting conversation...' });

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) throw new Error('No active tab found');

      const response = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id!, { action: 'extractConversation' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });

      setSyncStatus({ progress: 60, message: 'Processing conversation...' });

      if ((response as any)?.error) {
        throw new Error((response as any).error);
      }

      if (!response || !(response as any).messages) {
        throw new Error('No conversation data received');
      }

      const conversationData = response as any;
      const originalMessageCount = conversationData.messages.length;

      setConversation(conversationData);
      setSyncStatus({
        progress: 80,
        message: `Compressing with ${settings.compressionMode} mode...`,
      });

      const compressedResult = compressConversation(conversationData, settings.compressionMode);

      let compressedMessageCount = 0;
      if (settings.compressionMode === 'exact') {
        compressedMessageCount = compressedResult?.full?.messages?.length || 0;
      } else if (settings.compressionMode === 'balanced') {
        compressedMessageCount = compressedResult?.balanced?.messages?.length || 0;
      } else {
        compressedMessageCount = 1;
      }

      setCompressed(compressedResult);

      await saveToStorage(conversationData, compressedResult, settings.compressionMode);

      // Save to history only once
      await HistoryService.saveConversation(conversationData, compressedResult);

      setSyncStatus({ status: 'completed', progress: 100, message: 'Extraction complete!' });

      if (settings.compressionMode === 'aggressive') {
        addToast(
          `Extracted summary (${originalMessageCount} messages compressed into summary)!`,
          'success'
        );
      } else {
        addToast(
          `Extracted ${compressedMessageCount} messages using ${settings.compressionMode} mode!`,
          'success'
        );
      }

      setTimeout(() => {
        setSyncStatus({ status: 'idle', progress: 0, message: '' });
      }, 2000);
    } catch (e: any) {
      setError(e.message || 'Failed to extract conversation');
      addToast(e.message || 'Extraction failed', 'error');
      setSyncStatus({ status: 'failed', error: e.message });
    } finally {
      setLoading(false);
    }
  }, [
    settings.compressionMode,
    setConversation,
    setCompressed,
    setLoading,
    setError,
    setSyncStatus,
    addToast,
    saveToStorage,
  ]);

  const handleReExtract = useCallback(async () => {
    addToast(`Re-extracting with ${settings.compressionMode} mode...`, 'info');
    await handleExtract();
  }, [handleExtract, settings.compressionMode, addToast]);

  const handleCopy = useCallback(
    async (format: string) => {
      if (!conversation) {
        addToast('No conversation to copy. Please extract first.', 'error');
        return;
      }

      if (!compressed) {
        addToast('Please extract a conversation first.', 'error');
        return;
      }

      if (modeChanged) {
        addToast(
          `Mode changed to ${settings.compressionMode}. Please re-extract to apply new mode.`,
          'info'
        );
        return;
      }

      let textToCopy = null;
      let messageCount = 0;

      if (settings.compressionMode === 'aggressive') {
        textToCopy = compressed.aggressive;
        messageCount = 1;
      } else {
        textToCopy = settings.compressionMode === 'exact' ? compressed.full : compressed.balanced;
        messageCount = (textToCopy as any)?.messages?.length || 0;
      }

      if (!textToCopy) {
        addToast('Failed to prepare conversation data', 'error');
        return;
      }

      let formattedText = '';
      try {
        if (settings.compressionMode === 'aggressive' && typeof textToCopy === 'string') {
          formattedText = textToCopy;
        } else {
          formattedText = formatConversation(textToCopy, format as any);
        }
      } catch (err) {
        addToast('Failed to format conversation', 'error');
        return;
      }

      if (!formattedText || formattedText.length === 0) {
        addToast('Failed to format conversation.', 'error');
        return;
      }

      try {
        await navigator.clipboard.writeText(formattedText);
        if (settings.compressionMode === 'aggressive') {
          addToast(`Copied summary as ${format}!`, 'success');
        } else {
          addToast(
            `Copied ${messageCount} messages as ${format} (${settings.compressionMode} mode)!`,
            'success'
          );
        }
      } catch (e) {
        addToast('Failed to copy to clipboard', 'error');
      }
    },
    [conversation, compressed, settings.compressionMode, lastUsedMode, modeChanged, addToast]
  );

  const handleInject = useCallback(async () => {
    if (!conversation) {
      addToast('No conversation to inject. Please extract first.', 'error');
      return;
    }

    if (!compressed) {
      addToast('Please extract a conversation first.', 'error');
      return;
    }

    if (modeChanged) {
      addToast(
        `Mode changed to ${settings.compressionMode}. Please re-extract to apply new mode.`,
        'info'
      );
      return;
    }

    let textToInject = null;
    let messageCount = 0;

    if (settings.compressionMode === 'aggressive') {
      textToInject = compressed.aggressive;
      messageCount = 1;
    } else {
      textToInject = settings.compressionMode === 'exact' ? compressed.full : compressed.balanced;
      messageCount = (textToInject as any)?.messages?.length || 0;
    }

    if (!textToInject) {
      addToast('No conversation data to inject', 'error');
      return;
    }

    if (messageCount === 0 && settings.compressionMode !== 'aggressive') {
      addToast('No messages in conversation to inject.', 'error');
      return;
    }

    setSyncStatus({ status: 'injecting', progress: 30, message: 'Preparing context...' });

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) {
        throw new Error('No active tab found');
      }

      let text = '';
      if (settings.compressionMode === 'aggressive' && typeof textToInject === 'string') {
        text = textToInject;
      } else {
        text = formatConversation(textToInject, settings.defaultExportFormat);
      }

      if (!text || text.length === 0) {
        throw new Error('Failed to format conversation');
      }

      setSyncStatus({ progress: 70, message: 'Injecting into chat...' });

      const response = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(
          tab.id!,
          {
            action: 'injectContext',
            text: text,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          }
        );
      });

      if ((response as any)?.success) {
        setSyncStatus({ status: 'completed', progress: 100, message: 'Injection successful!' });
        if (settings.compressionMode === 'aggressive') {
          addToast(`Injected conversation summary!`, 'success');
        } else {
          addToast(
            `Successfully injected ${messageCount} messages (${settings.compressionMode} mode)!`,
            'success'
          );
        }
      } else {
        throw new Error((response as any)?.error || 'Injection failed');
      }

      setTimeout(() => {
        setSyncStatus({ status: 'idle', progress: 0, message: '' });
      }, 2000);
    } catch (e: any) {
      addToast(e.message || 'Failed to inject context', 'error');
      setSyncStatus({ status: 'failed', error: e.message });
    }
  }, [
    conversation,
    compressed,
    settings.compressionMode,
    settings.defaultExportFormat,
    lastUsedMode,
    modeChanged,
    addToast,
    setSyncStatus,
  ]);

  const handleClear = useCallback(async () => {
    await clearStorage();
    reset();
    setLastUsedMode(null);
    addToast('Conversation cleared from memory', 'info');
  }, [clearStorage, reset, setLastUsedMode, addToast]);

  const handleDownloadClick = useCallback(
    async (format: 'pdf' | 'markdown', mode: 'exact' | 'balanced' | 'aggressive') => {
      if (!conversation) {
        addToast('No conversation to download. Please extract first.', 'error');
        return;
      }

      if (!compressed) {
        addToast('Please extract a conversation first.', 'error');
        return;
      }

      try {
        let textToExport = null;
        if (mode === 'aggressive' && typeof compressed.aggressive === 'string') {
          textToExport = compressed.aggressive;
        } else {
          const selected =
            mode === 'exact' ? compressed.full : mode === 'balanced' ? compressed.balanced : compressed.full;
          textToExport = selected;
        }

        await handleDownload({
          format,
          mode,
          conversation: textToExport,
          compressed: compressed,
        });

        addToast(`Downloaded as ${format.toUpperCase()} (${mode} mode)!`, 'success');
      } catch (err: any) {
        addToast(err.message || 'Download failed', 'error');
      }
    },
    [conversation, compressed, addToast]
  );

  const handleModeChange = useCallback(
    (newMode: 'exact' | 'balanced' | 'aggressive') => {
      updateSettings({ compressionMode: newMode });
      if (conversation) {
        addToast(`Mode changed to ${newMode}. Click "Re-extract" to apply.`, 'info');
      }
    },
    [updateSettings, conversation, addToast]
  );

  // Initialize keyboard shortcuts after all handlers are defined
  useEffect(() => {
    const cleanup = initKeyboardShortcuts((action) => {
      switch (action) {
        case 'extractConversation':
          handleExtract();
          break;
        case 'injectContext':
          handleInject();
          break;
        case 'showHistory':
          setShowHistory(true);
          break;
        case 'copyConversation':
          handleCopy(settings.defaultExportFormat);
          break;
        case 'saveConversation':
          if (conversation) {
            addToast('Conversation saved to history', 'success');
          }
          break;
        case 'clearConversation':
          handleClear();
          break;
        case 'showShortcuts':
          setShowShortcuts(true);
          break;
        case 'submitMessage':
          if (activeTabId) {
            chrome.tabs.sendMessage(activeTabId, { action: 'submitMessage' });
          }
          break;
      }
    });

    return cleanup;
  }, [
    handleExtract,
    handleInject,
    handleCopy,
    handleClear,
    conversation,
    settings.defaultExportFormat,
    activeTabId,
    addToast,
  ]);

  const getCompressionStats = () => {
    if (!compressed) return null;

    const originalCount = conversation?.messages?.length || 0;

    if (settings.compressionMode === 'exact') {
      return { currentCount: originalCount, savedCount: 0 };
    } else if (settings.compressionMode === 'balanced') {
      const balancedCount = compressed.balanced?.messages?.length || originalCount;
      return { currentCount: balancedCount, savedCount: originalCount - balancedCount };
    } else {
      return { currentCount: 1, savedCount: originalCount - 1 };
    }
  };

  const stats = getCompressionStats();

  return (
    <ErrorBoundary>
      <div className="w-96 min-h-[500px] relative bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 text-white bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">AI Context Bridge</h1>
              <p className="text-xs opacity-90">Extract → Compress → Inject</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowShortcuts(true)}
                className="text-sm text-white hover:text-gray-200"
                title="Keyboard Shortcuts"
              >
                ⌨️
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className="text-sm text-white hover:text-gray-200"
                title="History"
              >
                📚
              </button>
            </div>
          </div>
        </div>

        {/* Modals */}
        {showHistory && (
          <HistoryPanel
            onLoadConversation={handleLoadFromHistory}
            onClose={() => setShowHistory(false)}
          />
        )}

        {showShortcuts && <ShortcutsHelp onClose={() => setShowShortcuts(false)} />}

        {showDownloadDialog && (
          <DownloadDialog
            onClose={() => setShowDownloadDialog(false)}
            onDownload={handleDownloadClick}
            conversationTitle={conversation?.title || 'Conversation'}
            isLoading={isLoading}
          />
        )}

        {/* Sync Status Bar */}
        {syncStatus.status !== 'idle' && (
          <div className="p-3 border-b border-blue-200 bg-blue-50">
            <div className="flex items-center justify-between mb-1 text-sm">
              <span className="text-blue-700">{syncStatus.message}</span>
              <span className="font-medium text-blue-600">{syncStatus.progress}%</span>
            </div>
            <div className="w-full h-2 overflow-hidden bg-blue-200 rounded-full">
              <div
                className="h-2 transition-all duration-300 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                style={{ width: `${syncStatus.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Toast Container */}
        <ToastContainer toasts={toasts} onRemove={removeToast} duration={1500} />

        {/* Main Content */}
        <div className="p-4">
          {error && (
            <div className="p-3 mb-4 border-l-4 border-red-500 rounded bg-red-50">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-1 text-xs text-red-500 hover:text-red-700"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Compression Mode Selection */}
          <div className="p-3 mb-4 bg-white border border-gray-200 rounded-lg shadow-sm">
            <p className="mb-2 text-xs font-medium text-gray-500">
              🎯 Select Compression Mode (Before Extract)
            </p>
            <div className="flex gap-2">
              {(['exact', 'balanced', 'aggressive'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  className={`flex-1 text-xs py-2 rounded transition-colors ${
                    settings.compressionMode === mode
                      ? mode === 'exact'
                        ? 'bg-blue-500 text-white'
                        : mode === 'balanced'
                          ? 'bg-green-500 text-white'
                          : 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {mode === 'exact' && '📝 Exact'}
                  {mode === 'balanced' && '⚖️ Balanced'}
                  {mode === 'aggressive' && '📊 Aggressive'}
                </button>
              ))}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {settings.compressionMode === 'exact' && '🔵 Full conversation, no changes'}
              {settings.compressionMode === 'balanced' &&
                '🟢 Removes duplicates, best for injection'}
              {settings.compressionMode === 'aggressive' &&
                '🟡 Creates smart summary, saves tokens'}
            </div>
          </div>

          {isLoading ? (
            <LoadingSpinner message="Extracting conversation..." />
          ) : (
            <>
              {/* Extract Button */}
              <button
                onClick={handleExtract}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 shadow-md mb-4"
              >
                📥 Extract Conversation ({settings.compressionMode} mode)
              </button>

              {/* Mode Change Warning */}
              {modeChanged && conversation && (
                <div className="p-3 mb-4 border-l-4 border-yellow-400 rounded bg-yellow-50">
                  <p className="text-sm font-medium text-yellow-700">⚠️ Mode Changed!</p>
                  <p className="mt-1 text-xs text-yellow-600">
                    Extracted with {lastUsedMode}, current mode is {settings.compressionMode}.
                  </p>
                  <button
                    onClick={handleReExtract}
                    className="mt-2 text-xs text-blue-500 underline"
                  >
                    Click here to re-extract with {settings.compressionMode} mode
                  </button>
                </div>
              )}

              {/* Conversation Info */}
              {conversation && conversation.messages && conversation.messages.length > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                        {conversation.platform || 'Unknown'}
                      </span>
                      <button
                        onClick={handleClear}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Clear
                      </button>
                    </div>
                    <p className="mb-2 text-sm text-gray-700 line-clamp-2">
                      {conversation.title || 'Untitled Conversation'}
                    </p>

                    {/* Compression Stats */}
                    {stats && (
                      <div className="p-2 mt-2 text-xs rounded bg-gray-50">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">📊 Compression Stats:</span>
                          <span className="font-bold text-blue-600">
                            {settings.compressionMode}
                          </span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span>Original: {conversation.messages.length} msgs</span>
                          <span>→</span>
                          <span>After: {stats.currentCount} msgs</span>
                          {stats.savedCount > 0 && (
                            <span className="text-green-600">Saved: {stats.savedCount}</span>
                          )}
                        </div>
                        {settings.compressionMode === 'aggressive' && (
                          <p className="mt-1 text-gray-500 truncate">
                            Summary: {compressed?.aggressive?.substring(0, 80)}...
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>{conversation.messages.length} messages</span>
                      <span>~{estimateConversationTokens(conversation)} tokens</span>
                    </div>
                    {lastUsedMode && (
                      <div className="mt-2 text-xs text-green-600">
                        ✓ Extracted with {lastUsedMode} mode
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={handleInject}
                      disabled={modeChanged}
                      className={`py-2 rounded-lg transition-colors text-sm font-medium ${
                        modeChanged
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      🚀 Inject
                    </button>
                    <button
                      onClick={() => handleCopy(settings.defaultExportFormat)}
                      disabled={modeChanged}
                      className={`py-2 rounded-lg transition-colors text-sm font-medium ${
                        modeChanged
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-500 text-white hover:bg-gray-600'
                      }`}
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={() => setShowDownloadDialog(true)}
                      disabled={modeChanged || !conversation}
                      className={`py-2 rounded-lg transition-colors text-sm font-medium ${
                        modeChanged || !conversation
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      ⬇️ Download
                    </button>
                  </div>

                  {/* Format Options */}
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <p className="mb-2 text-xs font-medium text-gray-500">Export Formats</p>
                    <div className="flex flex-wrap gap-2">
                      {['json', 'markdown', 'plaintext', 'continuationPrompt'].map((format) => (
                        <button
                          key={format}
                          onClick={() => handleCopy(format)}
                          disabled={modeChanged}
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            modeChanged
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          {format === 'continuationPrompt' ? 'Continuation Prompt' : format}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border border-gray-200 rounded-lg bg-gray-50">
                  <div className="mb-2 text-4xl">💬</div>
                  <p className="text-sm text-gray-500">No conversation extracted yet</p>
                  <p className="mt-1 text-xs text-gray-400">
                    1. Select compression mode above
                    <br />
                    2. Click "Extract Conversation" to start
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    💡 Tip: Press <kbd className="px-1 bg-gray-200 rounded">Ctrl+Shift+E</kbd> to
                    extract quickly
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
