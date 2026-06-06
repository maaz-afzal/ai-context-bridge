import { detectPlatform } from '../services/platformDetector';
import { getExtractor } from '../services/extractorFactory';
import { injectContext } from '../services/injectorFactory';
import { Platform } from '../types';

const platform = detectPlatform(window.location.href);

if (platform) {
  const extractor = getExtractor(platform);

  if (extractor) {
    try {
      chrome.runtime.sendMessage({ action: 'contentScriptReady', platform, timestamp: Date.now() });
    } catch {
      // Popup may not be open — safe to ignore
    }

    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      if (request.action === 'ping') {
        sendResponse({ status: 'ready', platform });
        return true;
      }

      if (request.action === 'extractConversation') {
        setTimeout(() => {
          extractor
            .extractConversation()
            .then((conversation) => {
              if (!conversation?.messages) {
                sendResponse({ error: 'No conversation data' });
              } else {
                sendResponse(conversation);
              }
            })
            .catch((err: Error) => {
              sendResponse({ error: 'Extraction failed: ' + err.message });
            });
        }, 500);
        return true;
      }

      if (request.action === 'injectContext') {
        try {
          const success = injectContext(platform as Platform, request.text as string);
          sendResponse({ success });
        } catch (err) {
          sendResponse({ success: false, error: (err as Error).message });
        }
        return true;
      }

      if (request.action === 'submitMessage') {
        const sendButton = document.querySelector<HTMLElement>(
          'button[type="submit"], button[aria-label*="Send"], [data-testid="send-button"]'
        );

        if (sendButton) {
          sendButton.click();
          sendResponse({ success: true });
        } else {
          const input = document.querySelector<HTMLElement>('textarea, [contenteditable="true"]');
          if (input) {
            input.dispatchEvent(
              new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true })
            );
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false });
          }
        }
        return true;
      }

      return true;
    });
  }
}
