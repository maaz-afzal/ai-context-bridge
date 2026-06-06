export const injectChatGPT = (text: string): boolean => {
  try {
    console.log('Injecting into ChatGPT...');

    const selectors = [
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="Send a message"]',
      'div[contenteditable="true"]',
      '#prompt-textarea',
      'textarea',
    ];

    let inputBox: HTMLTextAreaElement | HTMLElement | null = null;

    for (const selector of selectors) {
      inputBox = document.querySelector(selector);
      if (inputBox) {
        console.log(`Found input with selector: ${selector}`);
        break;
      }
    }

    if (!inputBox) {
      console.error('No input box found for ChatGPT');
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

    const submitBtn = document.querySelector('button[data-testid="send-button"], button:has(svg)');
    if (submitBtn && submitBtn instanceof HTMLElement) {
      setTimeout(() => submitBtn.click(), 500);
    }

    return true;
  } catch (error) {
    console.error('ChatGPT injection error:', error);
    return false;
  }
};
