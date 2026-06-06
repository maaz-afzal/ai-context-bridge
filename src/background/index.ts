import { detectPlatform } from '../services/platformDetector';
import { compressConversation } from '../services/contextEngine';

// Track active conversations
let activeConversation: any = null;

// Load saved conversation on startup
async function loadSavedConversation() {
  const result = await chrome.storage.local.get(['currentConversation', 'currentCompressed']);
  if (result.currentConversation) {
    activeConversation = result.currentConversation;
  }
}

// Call on startup
loadSavedConversation();

// Handle keyboard commands from manifest.json
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return;
  }

  switch (command) {
    case 'extract-conversation':
      await handleExtractAction(tab.id);
      break;

    case 'inject-context':
      await handleInjectAction(tab.id, tab.url);
      break;

    case 'show-history':
      // Open the popup
      chrome.action.openPopup();
      break;
  }
});

async function handleExtractAction(tabId: number) {
  try {
    await ensureContentScript(tabId);

    const response = await chrome.tabs.sendMessage(tabId, {
      action: 'extractConversation',
    });

    if (response && !response.error && response.messages && response.messages.length > 0) {
      const conversation = response;

      // Compress the conversation with default balanced mode
      const compressed = compressConversation(conversation, 'balanced');
      const mode = 'balanced';

      chrome.action.setBadgeText({ text: '✓', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
      setTimeout(() => {
        chrome.action.setBadgeText({ text: '', tabId });
      }, 2000);

      // Save all necessary data
      await chrome.storage.local.set({
        currentConversation: conversation,
        currentCompressed: compressed,
        lastExtractedAt: new Date().toISOString(),
        messageCount: conversation.messages.length,
        extractedMode: mode,
      });
      activeConversation = conversation;
    } else {
      const errorMsg = response?.error || 'No messages found';
      chrome.action.setBadgeText({ text: '!', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#F44336' });
      setTimeout(() => {
        chrome.action.setBadgeText({ text: '', tabId });
      }, 2000);
    }
  } catch (error: any) {
    chrome.action.setBadgeText({ text: '!', tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#F44336' });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '', tabId });
    }, 2000);
  }
}

async function handleInjectAction(tabId: number, tabUrl?: string) {
  try {
    // Get saved conversation
    const result = await chrome.storage.local.get(['currentConversation']);
    const conversation = result.currentConversation;

    if (!conversation || !conversation.messages) {
      chrome.action.setBadgeText({ text: '?', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#FF9800' });
      setTimeout(() => {
        chrome.action.setBadgeText({ text: '', tabId });
      }, 2000);
      return;
    }

    // Format conversation for injection
    const text = conversation.messages
      .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    // Ensure content script is injected
    await ensureContentScript(tabId);

    // Detect platform from tab URL
    const platform = detectPlatform(tabUrl);

    // Send message to content script
    const response = await chrome.tabs.sendMessage(tabId, {
      action: 'injectContext',
      text: text,
      platform: platform,
    });

    if (response?.success) {
      chrome.action.setBadgeText({ text: '✓', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
      setTimeout(() => {
        chrome.action.setBadgeText({ text: '', tabId });
      }, 2000);
    } else {
      chrome.action.setBadgeText({ text: '!', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#F44336' });
      setTimeout(() => {
        chrome.action.setBadgeText({ text: '', tabId });
      }, 2000);
    }
  } catch (error: any) {
    chrome.action.setBadgeText({ text: '!', tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#F44336' });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '', tabId });
    }, 2000);
  }
}

async function ensureContentScript(tabId: number): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, { action: 'ping' });
  } catch (error) {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['src/content/index.js'],
    });
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

// Regular message listener for popup
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

// Optional: Show notification on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Extension installed
  }
});
