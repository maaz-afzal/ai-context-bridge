import { Conversation, Settings } from '../types';

const KEYS = {
  RECENT: 'recentExports',
  SETTINGS: 'userSettings',
};

const DEFAULT_SETTINGS: Settings = {
  compressionMode: 'balanced',
  defaultExportFormat: 'continuationPrompt',
  autoInject: false,
};

export const saveRecentExport = async (conversation: Conversation): Promise<void> => {
  const { recentExports = [] } = await chrome.storage.local.get(KEYS.RECENT);
  const updated = [conversation, ...recentExports].slice(0, 10);
  await chrome.storage.local.set({ [KEYS.RECENT]: updated });
};

export const getRecentExports = async (): Promise<Conversation[]> => {
  const { recentExports = [] } = await chrome.storage.local.get(KEYS.RECENT);
  return recentExports;
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  await chrome.storage.local.set({ [KEYS.SETTINGS]: settings });
};

export const getSettings = async (): Promise<Settings> => {
  const { userSettings = DEFAULT_SETTINGS } = await chrome.storage.local.get(KEYS.SETTINGS);
  return userSettings;
};
