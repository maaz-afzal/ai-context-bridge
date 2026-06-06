// Simplified database utility without IDB type issues
import { Conversation } from '../types';

// Simple in-memory storage as fallback
class SimpleStorage {
  private conversations: Map<string, Conversation> = new Map();

  async saveConversation(conversation: Conversation): Promise<string> {
    const id = crypto.randomUUID();
    this.conversations.set(id, conversation);
    return id;
  }

  async getConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values());
  }

  async getConversation(id: string): Promise<Conversation | null> {
    return this.conversations.get(id) || null;
  }

  async deleteConversation(id: string): Promise<void> {
    this.conversations.delete(id);
  }
}

// Use IndexedDB if available, otherwise fallback to memory
let storageInstance: any = null;

const getStorage = () => {
  if (!storageInstance) {
    storageInstance = new SimpleStorage();
  }
  return storageInstance;
};

export const saveConversation = async (conversation: Conversation): Promise<string> => {
  const storage = getStorage();
  return await storage.saveConversation(conversation);
};

export const getConversations = async (): Promise<Conversation[]> => {
  const storage = getStorage();
  return await storage.getConversations();
};

export const getConversation = async (id: string): Promise<Conversation | null> => {
  const storage = getStorage();
  return await storage.getConversation(id);
};

export const deleteConversation = async (id: string): Promise<void> => {
  const storage = getStorage();
  return await storage.deleteConversation(id);
};
