import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Conversation, CompressedConversation, Settings, Toast } from '../types';

export interface SyncStatus {
  status: 'idle' | 'extracting' | 'compressing' | 'injecting' | 'completed' | 'failed';
  progress: number;
  message: string;
  error?: string;
}

interface AppState {
  conversation: Conversation | null;
  compressed: CompressedConversation | null;
  settings: Settings;
  syncStatus: SyncStatus;
  toasts: Toast[];
  isLoading: boolean;
  error: string | null;
  lastUsedMode: 'exact' | 'balanced' | 'aggressive' | null;

  setConversation: (conv: Conversation | null) => void;
  setCompressed: (c: CompressedConversation | null) => void;
  updateSettings: (s: Partial<Settings>) => void;
  setSyncStatus: (s: Partial<SyncStatus>) => void;
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setLastUsedMode: (m: 'exact' | 'balanced' | 'aggressive' | null) => void;
  reset: () => void;
  saveToStorage: (
    conversation: Conversation,
    compressed: CompressedConversation,
    mode: string
  ) => Promise<void>;
  loadFromStorage: () => Promise<void>;
  clearStorage: () => Promise<void>;
}

// Minimal chrome.storage adapter for Zustand persist (settings only)
const chromeStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const result = await chrome.storage.local.get(name);
    return (result[name] as string) ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await chrome.storage.local.set({ [name]: value });
  },
  removeItem: async (name: string): Promise<void> => {
    await chrome.storage.local.remove(name);
  },
};

const TOAST_DURATION = 1500;

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      conversation: null,
      compressed: null,
      settings: {
        compressionMode: 'balanced',
        defaultExportFormat: 'continuationPrompt',
        autoInject: false,
      },
      syncStatus: { status: 'idle', progress: 0, message: '' },
      toasts: [],
      isLoading: false,
      error: null,
      lastUsedMode: null,

      setConversation: (conversation) => set({ conversation }),
      setCompressed: (compressed) => set({ compressed }),
      updateSettings: (s) => set((state) => ({ settings: { ...state.settings, ...s } })),
      setSyncStatus: (s) => set((state) => ({ syncStatus: { ...state.syncStatus, ...s } })),

      addToast: (message, type) =>
        set((state) => {
          const id = Date.now().toString();
          setTimeout(() => {
            set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
          }, TOAST_DURATION);
          return { toasts: [...state.toasts, { id, message, type }] };
        }),

      removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setLastUsedMode: (lastUsedMode) => set({ lastUsedMode }),

      reset: () =>
        set({
          conversation: null,
          compressed: null,
          syncStatus: { status: 'idle', progress: 0, message: '' },
          error: null,
          lastUsedMode: null,
        }),

      saveToStorage: async (conversation, compressed, mode) => {
        if (!conversation?.messages?.length) return;

        await chrome.storage.local.set({
          currentConversation: conversation,
          currentCompressed: compressed,
          lastExtractedAt: new Date().toISOString(),
          messageCount: conversation.messages.length,
          extractedMode: mode,
        });

        set({ lastUsedMode: mode as 'exact' | 'balanced' | 'aggressive' });
      },

      loadFromStorage: async () => {
        const result = await chrome.storage.local.get([
          'currentConversation',
          'currentCompressed',
          'extractedMode',
        ]);

        if (result.currentConversation?.messages) {
          set({
            conversation: result.currentConversation as Conversation,
            compressed: (result.currentCompressed as CompressedConversation) ?? null,
            lastUsedMode: (result.extractedMode as 'exact' | 'balanced' | 'aggressive') ?? null,
          });
        }
      },

      clearStorage: async () => {
        await chrome.storage.local.remove([
          'currentConversation',
          'currentCompressed',
          'lastExtractedAt',
          'extractedMode',
        ]);
        set({ conversation: null, compressed: null, lastUsedMode: null });
      },
    }),
    {
      name: 'ai-context-bridge-settings',
      storage: createJSONStorage(() => chromeStorage),
      // Only persist user settings — conversation state is loaded from chrome.storage directly
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
