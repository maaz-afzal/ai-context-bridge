import { detectPlatform } from '../services/platformDetector';
import { getExtractor } from '../services/extractorFactory';
import { injectContext } from '../services/injectorFactory';

console.log('Content script loading...');

const platform = detectPlatform(window.location.href);
if (!platform) {
  console.log('Content script: Not a supported platform, skipping');
} else {
  console.log(`Content script: Loaded for platform: ${platform}`);

  const extractor = getExtractor(platform);
  if (!extractor) {
    console.log(`Content script: Extractor not available for ${platform}`);
  } else {
    console.log(`Content script: Extractor initialized for ${platform}`);

    try {
      chrome.runtime.sendMessage({
        action: 'contentScriptReady',
        platform,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.debug('Ready notification failed:', e);
    }

    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      console.log(`Content script received action: ${request.action}`);

      if (request.action === 'ping') {
        sendResponse({ status: 'ready', platform });
        return true;
      }

      if (request.action === 'extractConversation') {
        console.log(`Extracting conversation for ${platform}`);

        setTimeout(() => {
          extractor
            .extractConversation()
            .then((conversation: any) => {
              if (!conversation || !conversation.messages) {
                console.error('Extraction returned no conversation');
                sendResponse({ error: 'No conversation data' });
                return;
              }
              console.log(`Extracted ${conversation.messages?.length || 0} messages`);
              console.log(
                `Roles: User=${conversation.messages?.filter((m: any) => m.role === 'user').length || 0}, Assistant=${conversation.messages?.filter((m: any) => m.role === 'assistant').length || 0}`
              );
              sendResponse(conversation);
            })
            .catch((error: Error) => {
              console.error('Extraction error:', error);
              sendResponse({ error: 'Extraction failed: ' + error.message });
            });
        }, 500);

        return true;
      }

      if (request.action === 'injectContext') {
        console.log(`Injecting context for ${platform}`);
        try {
          const success = injectContext(platform, request.text);
          sendResponse({ success });
        } catch (error: any) {
          console.error('Injection error:', error);
          sendResponse({ success: false, error: error.message });
        }
        return true;
      }

      if (request.action === 'submitMessage') {
        const sendButton = document.querySelector(
          'button[type="submit"], button[aria-label*="Send"], [data-testid="send-button"]'
        );
        if (sendButton && sendButton instanceof HTMLElement) {
          sendButton.click();
          sendResponse({ success: true });
        } else {
          const input = document.querySelector('textarea, [contenteditable="true"]');
          if (input) {
            const enterEvent = new KeyboardEvent('keydown', {
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              which: 13,
              bubbles: true,
              ctrlKey: false,
            });
            input.dispatchEvent(enterEvent);
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
