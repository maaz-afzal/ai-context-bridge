import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Conversation, Settings, Toast } from '../types';
import { HistoryService } from '../services/historyService';

export interface SyncStatus {
  status: 'idle' | 'extracting' | 'compressing' | 'injecting' | 'completed' | 'failed';
  progress: number;
  message: string;
  error?: string;
}

interface AppState {
  // State
  conversation: Conversation | null;
  compressed: any;
  settings: Settings;
  syncStatus: SyncStatus;
  toasts: Toast[];
  isLoading: boolean;
  error: string | null;
  lastExtractedId: string | null;
  lastUsedMode: 'exact' | 'balanced' | 'aggressive' | null;

  // Actions
  setConversation: (conv: Conversation | null) => void;
  setCompressed: (compressed: any) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  setSyncStatus: (status: Partial<SyncStatus>) => void;
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  saveToStorage: (conversation: Conversation, compressed: any, mode: string) => Promise<void>;
  loadFromStorage: () => Promise<void>;
  clearStorage: () => Promise<void>;
  setLastUsedMode: (mode: 'exact' | 'balanced' | 'aggressive' | null) => void;
}

// Chrome storage adapter for Zustand
const chromeStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const result = await chrome.storage.local.get(name);
    return result[name] || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await chrome.storage.local.set({ [name]: value });
  },
  removeItem: async (name: string): Promise<void> => {
    await chrome.storage.local.remove(name);
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      conversation: null,
      compressed: null,
      settings: {
        compressionMode: 'balanced',
        defaultExportFormat: 'continuationPrompt',
        autoInject: false,
      },
      syncStatus: {
        status: 'idle',
        progress: 0,
        message: '',
      },
      toasts: [],
      isLoading: false,
      error: null,
      lastExtractedId: null,
      lastUsedMode: null,

      // Actions
      setConversation: (conversation) => set({ conversation }),
      setCompressed: (compressed) => set({ compressed }),
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      setSyncStatus: (status) =>
        set((state) => ({
          syncStatus: { ...state.syncStatus, ...status },
        })),
      addToast: (message, type) =>
        set((state) => {
          const id = Date.now().toString();
          const newToast = { id, message, type };

          // Auto-remove after 1.5 seconds
          setTimeout(() => {
            set((state) => ({
              toasts: state.toasts.filter((t) => t.id !== id),
            }));
          }, 1500);

          return {
            toasts: [...state.toasts, newToast],
          };
        }),
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setLastUsedMode: (mode) => set({ lastUsedMode: mode }),
      reset: () =>
        set({
          conversation: null,
          compressed: null,
          syncStatus: { status: 'idle', progress: 0, message: '' },
          error: null,
          lastUsedMode: null,
        }),

      // Save to chrome storage
      saveToStorage: async (conversation, compressed, mode) => {
        if (!conversation || !conversation.messages || conversation.messages.length === 0) {
          console.warn('Attempted to save invalid conversation');
          return;
        }

        const id = `conv_${Date.now()}`;
        await chrome.storage.local.set({
          currentConversation: conversation,
          currentCompressed: compressed,
          lastExtractedId: id,
          lastExtractedAt: new Date().toISOString(),
          messageCount: conversation.messages.length,
          extractedMode: mode,
        });
        set({ lastExtractedId: id, lastUsedMode: mode as any });

        // Save to history - only once via HistoryService
        try {
          await HistoryService.saveConversation(conversation, compressed);
        } catch (error) {
          console.error('Failed to save to history:', error);
        }

        console.log(
          `Saved conversation with ${conversation.messages.length} messages in ${mode} mode`
        );
      },

      // Load from chrome storage
      loadFromStorage: async () => {
        const result = await chrome.storage.local.get([
          'currentConversation',
          'currentCompressed',
          'lastExtractedId',
          'messageCount',
          'extractedMode',
        ]);

        if (result.currentConversation && result.currentConversation.messages) {
          set({
            conversation: result.currentConversation,
            compressed: result.currentCompressed,
            lastExtractedId: result.lastExtractedId,
            lastUsedMode: result.extractedMode || null,
          });
          console.log(
            'Loaded conversation from storage:',
            result.messageCount || result.currentConversation.messages.length,
            'messages'
          );
          console.log('Extracted with mode:', result.extractedMode || 'unknown');
        } else {
          console.log('No saved conversation found in storage');
        }
      },

      // Clear storage
      clearStorage: async () => {
        await chrome.storage.local.remove([
          'currentConversation',
          'currentCompressed',
          'lastExtractedId',
          'lastExtractedAt',
          'extractedMode',
        ]);
        set({ conversation: null, compressed: null, lastExtractedId: null, lastUsedMode: null });
      },
    }),
    {
      name: 'ai-context-bridge-storage',
      storage: createJSONStorage(() => chromeStorage),
      partialize: (state) => ({
        settings: state.settings,
      }),
    }
  )
);
