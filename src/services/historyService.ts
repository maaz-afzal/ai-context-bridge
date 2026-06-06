import { Conversation } from '../types';

export interface HistoryItem {
  id: string;
  conversation: Conversation;
  compressed: unknown;
  savedAt: string;
  platform: string;
  messageCount: number;
  title: string;
}

const STORAGE_KEY = 'conversationHistory';
const MAX_HISTORY = 50;

const isSameConversation = (a: Conversation, b: Conversation): boolean => {
  if (a.messages.length !== b.messages.length) return false;
  const firstMatch = a.messages[0]?.content === b.messages[0]?.content;
  const lastMatch =
    a.messages[a.messages.length - 1]?.content === b.messages[b.messages.length - 1]?.content;
  return firstMatch && lastMatch;
};

export class HistoryService {
  static async saveConversation(conversation: Conversation, compressed: unknown): Promise<void> {
    if (!conversation?.messages?.length) return;

    const history = await this.getHistory();
    const existingIndex = history.findIndex((item) =>
      isSameConversation(item.conversation, conversation)
    );

    if (existingIndex !== -1) {
      history[existingIndex] = {
        ...history[existingIndex],
        conversation,
        compressed,
        savedAt: new Date().toISOString(),
        messageCount: conversation.messages.length,
      };
      await chrome.storage.local.set({ [STORAGE_KEY]: history });
      return;
    }

    const newItem: HistoryItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      conversation,
      compressed,
      savedAt: new Date().toISOString(),
      platform: conversation.platform,
      messageCount: conversation.messages.length,
      title: conversation.title ?? `Conversation ${new Date().toLocaleString()}`,
    };

    const updated = [newItem, ...history].slice(0, MAX_HISTORY);
    await chrome.storage.local.set({ [STORAGE_KEY]: updated });
  }

  static async getHistory(): Promise<HistoryItem[]> {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const history: HistoryItem[] = result[STORAGE_KEY] ?? [];
    return history.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }

  static async deleteConversation(id: string): Promise<void> {
    const history = await this.getHistory();
    await chrome.storage.local.set({
      [STORAGE_KEY]: history.filter((item) => item.id !== id),
    });
  }

  static async deleteAllHistory(): Promise<void> {
    await chrome.storage.local.remove(STORAGE_KEY);
  }

  static async searchHistory(query: string): Promise<HistoryItem[]> {
    if (!query.trim()) return this.getHistory();

    const history = await this.getHistory();
    const lower = query.toLowerCase().trim();

    return history.filter((item) => {
      if (item.title.toLowerCase().includes(lower)) return true;
      if (item.platform.toLowerCase().includes(lower)) return true;
      return item.conversation.messages
        .slice(0, 10)
        .some((msg) => msg.content.toLowerCase().includes(lower));
    });
  }
}
