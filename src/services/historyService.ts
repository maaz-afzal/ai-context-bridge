import { Conversation } from '../types';

export interface HistoryItem {
  id: string;
  conversation: Conversation;
  compressed: any;
  savedAt: string;
  platform: string;
  messageCount: number;
  title: string;
}

export class HistoryService {
  private static readonly STORAGE_KEY = 'conversationHistory';
  private static readonly MAX_HISTORY = 50;

  static async saveConversation(conversation: Conversation, compressed: any): Promise<void> {
    try {
      if (!conversation || !conversation.messages || conversation.messages.length === 0) {
        console.warn('Invalid conversation, not saving to history');
        return;
      }

      const history = await this.getHistory();

      // Better duplicate detection using content hashing
      const existingIndex = history.findIndex((item) => {
        if (item.conversation.messages.length !== conversation.messages.length) return false;

        const firstMsg1 = item.conversation.messages[0]?.content;
        const firstMsg2 = conversation.messages[0]?.content;

        if (firstMsg1 !== firstMsg2) return false;

        const lastMsg1 = item.conversation.messages[item.conversation.messages.length - 1]?.content;
        const lastMsg2 = conversation.messages[conversation.messages.length - 1]?.content;

        if (lastMsg1 !== lastMsg2) return false;

        return true;
      });

      // Update existing instead of adding new
      if (existingIndex !== -1) {
        const updated = [...history];
        updated[existingIndex] = {
          ...updated[existingIndex],
          conversation,
          compressed,
          savedAt: new Date().toISOString(),
        };
        await chrome.storage.local.set({ [this.STORAGE_KEY]: updated });
        console.log(`Updated existing conversation in history`);
        return;
      }

      const newItem: HistoryItem = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversation,
        compressed,
        savedAt: new Date().toISOString(),
        platform: conversation.platform,
        messageCount: conversation.messages.length,
        title: conversation.title || `Conversation ${new Date().toLocaleString()}`,
      };

      history.unshift(newItem);
      const trimmed = history.slice(0, this.MAX_HISTORY);
      await chrome.storage.local.set({ [this.STORAGE_KEY]: trimmed });
      console.log(
        `Saved conversation to history: ${newItem.title} (${newItem.messageCount} messages)`
      );
    } catch (error) {
      console.error('Failed to save conversation to history:', error);
    }
  }

  static async getHistory(): Promise<HistoryItem[]> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      const history = result[this.STORAGE_KEY] || [];
      return history.sort(
        (a: HistoryItem, b: HistoryItem) =>
          new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      );
    } catch (error) {
      console.error('Failed to get history:', error);
      return [];
    }
  }

  static async deleteConversation(id: string): Promise<void> {
    try {
      const history = await this.getHistory();
      const updated = history.filter((item) => item.id !== id);
      await chrome.storage.local.set({ [this.STORAGE_KEY]: updated });
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }

  static async deleteAllHistory(): Promise<void> {
    try {
      await chrome.storage.local.remove(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }

  static async searchHistory(query: string): Promise<HistoryItem[]> {
    if (!query || !query.trim()) {
      return await this.getHistory();
    }

    const history = await this.getHistory();
    const lowerQuery = query.toLowerCase().trim();

    return history.filter((item) => {
      if (item.title.toLowerCase().includes(lowerQuery)) return true;
      if (item.platform.toLowerCase().includes(lowerQuery)) return true;
      if (item.conversation.messages) {
        const contentMatch = item.conversation.messages
          .slice(0, 10)
          .some((msg) => msg.content.toLowerCase().includes(lowerQuery));
        if (contentMatch) return true;
      }
      return false;
    });
  }
}
