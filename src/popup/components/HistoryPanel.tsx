import { useState, useEffect } from 'react';
import { HistoryService, HistoryItem } from '../../services/historyService';
import { HistorySkeleton } from './HistorySkeleton';

interface Props {
  onLoadConversation: (conversation: unknown, compressed: unknown) => void;
  onClose: () => void;
}

const PLATFORM_ICONS: Record<string, string> = {
  chatgpt: '🤖', claude: '🧠', gemini: '⭐', grok: '🎯', perplexity: '🔍', deepseek: '💙',
};

const PLATFORM_COLORS: Record<string, string> = {
  chatgpt: 'border-green-200 bg-green-50',
  claude: 'border-purple-200 bg-purple-50',
  gemini: 'border-blue-200 bg-blue-50',
  grok: 'border-orange-200 bg-orange-50',
  perplexity: 'border-indigo-200 bg-indigo-50',
  deepseek: 'border-cyan-200 bg-cyan-50',
};

const formatDate = (dateString: string): string => {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
};

export const HistoryPanel = ({ onLoadConversation, onClose }: Props) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    setHistory(await HistoryService.getHistory());
    setIsLoading(false);
  };

  const handleSearch = async (term: string) => {
    setSearch(term);
    setHistory(term.trim() ? await HistoryService.searchHistory(term) : await HistoryService.getHistory());
  };

  const handleDelete = async (id: string) => {
    await HistoryService.deleteConversation(id);
    setConfirmDeleteId(null);
    await loadHistory();
  };

  const handleClearAll = async () => {
    await HistoryService.deleteAllHistory();
    setConfirmClearAll(false);
    await loadHistory();
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
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8 text-xl rounded-full hover:bg-white hover:bg-opacity-20">✕</button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search by title, platform, or content..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full py-2 pr-8 text-sm border border-gray-200 rounded-lg pl-9 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button onClick={() => handleSearch('')} className="absolute text-gray-400 right-2 top-2 hover:text-gray-600">✕</button>
            )}
          </div>
        </div>

        {/* List */}
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
                onClick={() => onLoadConversation(item.conversation, item.compressed)}
                className={`rounded-lg p-3 border cursor-pointer transition-all hover:shadow-md hover:border-blue-300 ${PLATFORM_COLORS[item.platform] ?? 'border-gray-200 bg-gray-50'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{PLATFORM_ICONS[item.platform] ?? '💬'}</span>
                      <p className="flex-1 text-sm font-semibold text-gray-800 truncate">{item.title}</p>
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

                  {/* Delete button with inline confirm */}
                  <div className="flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                    {confirmDeleteId === item.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleDelete(item.id)} className="px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600">Yes</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 text-xs text-gray-700 bg-gray-200 rounded hover:bg-gray-300">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">🗑️</button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 text-xs border-t border-gray-200 bg-gray-50">
            <span className="text-gray-500">📌 {history.length} conversation{history.length > 1 ? 's' : ''}</span>
            {confirmClearAll ? (
              <div className="flex gap-2">
                <span className="text-xs text-gray-500">Delete all?</span>
                <button onClick={handleClearAll} className="font-medium text-red-600 hover:text-red-700">Yes</button>
                <button onClick={() => setConfirmClearAll(false)} className="text-gray-500 hover:text-gray-700">No</button>
              </div>
            ) : (
              <button onClick={() => setConfirmClearAll(true)} className="px-3 py-1 text-red-600 rounded-lg hover:text-red-700 hover:bg-red-50">Clear All</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};