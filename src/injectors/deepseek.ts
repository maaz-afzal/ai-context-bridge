export const injectDeepSeek = (text: string): boolean => {
  try {
    console.log('Injecting into DeepSeek...');

    const selectors = [
      'textarea[placeholder*="Type a message"]',
      'textarea[placeholder*="Ask DeepSeek"]',
      'div[contenteditable="true"]',
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
      console.error('No input box found for DeepSeek');
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

    const sendButton = document.querySelector('button[type="submit"], button:has(svg), .send-btn');
    if (sendButton && sendButton instanceof HTMLElement) {
      setTimeout(() => sendButton.click(), 500);
    }

    return true;
  } catch (error) {
    console.error('DeepSeek injection error:', error);
    return false;
  }
};
