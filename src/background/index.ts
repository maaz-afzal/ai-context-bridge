import { detectPlatform } from '../services/platformDetector';
import { compressConversation } from '../services/contextEngine';
import { Conversation } from '../types';

let activeConversation: Conversation | null = null;

async function loadSavedConversation() {
  const result = await chrome.storage.local.get(['currentConversation']);
  if (result.currentConversation) {
    activeConversation = result.currentConversation as Conversation;
  }
}

loadSavedConversation();

chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  switch (command) {
    case 'extract-conversation':
      await handleExtractAction(tab.id);
      break;
    case 'inject-context':
      await handleInjectAction(tab.id, tab.url);
      break;
    case 'show-history':
      chrome.action.openPopup();
      break;
  }
});

async function handleExtractAction(tabId: number) {
  try {
    await ensureContentScript(tabId);

    const response = (await chrome.tabs.sendMessage(tabId, {
      action: 'extractConversation',
    })) as Conversation & { error?: string };

    if (!response?.messages?.length || response.error) {
      setBadge(tabId, '!', '#F44336');
      return;
    }

    const compressed = compressConversation(response, 'balanced');

    await chrome.storage.local.set({
      currentConversation: response,
      currentCompressed: compressed,
      lastExtractedAt: new Date().toISOString(),
      messageCount: response.messages.length,
      extractedMode: 'balanced',
    });

    activeConversation = response;
    setBadge(tabId, '✓', '#4CAF50');
  } catch {
    setBadge(tabId, '!', '#F44336');
  }
}

async function handleInjectAction(tabId: number, tabUrl?: string) {
  try {
    const result = await chrome.storage.local.get(['currentConversation']);
    const conversation = result.currentConversation as Conversation | undefined;

    if (!conversation?.messages) {
      setBadge(tabId, '?', '#FF9800');
      return;
    }

    const text = conversation.messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    await ensureContentScript(tabId);

    const platform = detectPlatform(tabUrl);
    const response = (await chrome.tabs.sendMessage(tabId, {
      action: 'injectContext',
      text,
      platform,
    })) as { success: boolean } | undefined;

    setBadge(tabId, response?.success ? '✓' : '!', response?.success ? '#4CAF50' : '#F44336');
  } catch {
    setBadge(tabId, '!', '#F44336');
  }
}

async function ensureContentScript(tabId: number): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, { action: 'ping' });
  } catch {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['src/content/index.js'] });
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

function setBadge(tabId: number, text: string, color: string) {
  chrome.action.setBadgeText({ text, tabId });
  chrome.action.setBadgeBackgroundColor({ color, tabId });
  setTimeout(() => chrome.action.setBadgeText({ text: '', tabId }), 2000);
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'extractConversation') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) {
        sendResponse({ error: 'No active tab found' });
        return;
      }
      await handleExtractAction(tab.id);
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'injectContext') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) {
        sendResponse({ success: false, error: 'No active tab found' });
        return;
      }
      await handleInjectAction(tab.id, tab.url);
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === 'getSavedConversation') {
    sendResponse({ conversation: activeConversation });
    return true;
  }

  return true;
});
