export const injectClaude = (text: string): boolean => {
  try {
    console.log('Injecting into Claude...');

    const selectors = [
      'div[contenteditable="true"][role="textbox"]',
      '[contenteditable="true"]',
      'div.ProseMirror',
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="Ask"]',
      '.message-input',
      '[data-testid="compose-input"]',
      'textarea',
    ];

    let inputBox: HTMLElement | null = null;

    for (const selector of selectors) {
      inputBox = document.querySelector(selector);
      if (inputBox) {
        console.log(`Found input with selector: ${selector}`);
        break;
      }
    }

    if (!inputBox) {
      console.error('No input box found for Claude');
      return false;
    }

    inputBox.focus();

    if (inputBox instanceof HTMLTextAreaElement || inputBox instanceof HTMLInputElement) {
      inputBox.value = text;
      inputBox.dispatchEvent(new Event('input', { bubbles: true }));
      inputBox.dispatchEvent(new Event('change', { bubbles: true }));

      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set;
      if (nativeSetter) {
        nativeSetter.call(inputBox, text);
        inputBox.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } else if (inputBox.hasAttribute('contenteditable')) {
      inputBox.textContent = text;
      inputBox.dispatchEvent(new Event('input', { bubbles: true }));
      inputBox.dispatchEvent(new Event('change', { bubbles: true }));

      inputBox.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      inputBox.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    }

    const submitSelectors = [
      'button[type="submit"]',
      'button[aria-label*="Send"]',
      'button[aria-label*="Submit"]',
      '[data-testid="send-button"]',
      'button:has(svg)',
      'button:last-child',
    ];

    for (const selector of submitSelectors) {
      const submitBtn = document.querySelector(selector);
      if (submitBtn && submitBtn instanceof HTMLElement) {
        console.log(`Found submit button: ${selector}`);
        setTimeout(() => submitBtn.click(), 300);
        return true;
      }
    }

    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      ctrlKey: false,
      metaKey: false,
    });
    inputBox.dispatchEvent(enterEvent);

    return true;
  } catch (error) {
    console.error('Claude injection error:', error);
    return false;
  }
};
