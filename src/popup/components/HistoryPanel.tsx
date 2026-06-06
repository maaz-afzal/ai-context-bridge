import React, { useState, useEffect } from 'react';
import { HistoryService, HistoryItem } from '../../services/historyService';
import { HistorySkeleton } from './HistorySkeleton';

interface HistoryPanelProps {
  onLoadConversation: (conversation: any, compressed: any) => void;
  onClose: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ onLoadConversation, onClose }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    const items = await HistoryService.getHistory();
    setHistory(items);
    setIsLoading(false);
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      const results = await HistoryService.searchHistory(term);
      setHistory(results);
    } else {
      await loadHistory();
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      await HistoryService.deleteConversation(id);
      await loadHistory();
    }
  };

  const handleLoad = (item: HistoryItem) => {
    onLoadConversation(item.conversation, item.compressed);
  };

  const handleClearAll = async () => {
    if (confirm('Delete ALL saved conversations? This cannot be undone.')) {
      await HistoryService.deleteAllHistory();
      await loadHistory();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'chatgpt':
        return '🤖';
      case 'claude':
        return '🧠';
      case 'gemini':
        return '⭐';
      case 'grok':
        return '🎯';
      case 'perplexity':
        return '🔍';
      case 'deepseek':
        return '💙';
      default:
        return '💬';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'chatgpt':
        return 'border-green-200 bg-green-50';
      case 'claude':
        return 'border-purple-200 bg-purple-50';
      case 'gemini':
        return 'border-blue-200 bg-blue-50';
      case 'grok':
        return 'border-orange-200 bg-orange-50';
      case 'perplexity':
        return 'border-indigo-200 bg-indigo-50';
      case 'deepseek':
        return 'border-cyan-200 bg-cyan-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
      <div className="w-[90%] max-w-md max-h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 text-white bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center gap-2">
            <span className="text-xl">📚</span>
            <h2 className="text-lg font-semibold">Conversation History</h2>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 text-xl transition-colors rounded-full hover:bg-white hover:bg-opacity-20"
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search by title, platform, or content..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full py-2 pr-8 text-sm border border-gray-200 rounded-lg pl-9 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearch('')}
                className="absolute text-gray-400 right-2 top-2 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-gray-50">
          {isLoading ? (
            <HistorySkeleton />
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 text-5xl">📭</div>
              <p className="font-medium text-gray-500">No saved conversations</p>
              <p className="mt-1 text-xs text-gray-400">Extract a conversation to save it here</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => handleLoad(item)}
                className={`rounded-lg p-3 border cursor-pointer transition-all duration-200 hover:shadow-md ${getPlatformColor(item.platform)} hover:border-blue-300`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{getPlatformIcon(item.platform)}</span>
                      <p className="flex-1 text-sm font-semibold text-gray-800 truncate">
                        {item.title}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="capitalize">{item.platform}</span>
                      <span>📝 {item.messageCount} msgs</span>
                      <span>🕐 {formatDate(item.savedAt)}</span>
                    </div>
                    {item.conversation?.messages?.[0] && (
                      <p className="mt-2 text-xs text-gray-500 truncate">
                        {item.conversation.messages[0].content.substring(0, 100)}...
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="ml-2 p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 text-xs border-t border-gray-200 bg-gray-50">
            <span className="text-gray-500">
              📌 {history.length} conversation{history.length > 1 ? 's' : ''} saved
            </span>
            <button
              onClick={handleClearAll}
              className="px-3 py-1 text-red-600 transition-colors rounded-lg hover:text-red-700 hover:bg-red-50"
            >
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
