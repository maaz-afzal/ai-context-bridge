export const injectPerplexity = (text: string): boolean => {
  try {
    console.log('Injecting into Perplexity...');

    const selectors = [
      'textarea[placeholder*="Ask anything"]',
      'textarea[placeholder*="Ask Perplexity"]',
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
      console.error('No input box found for Perplexity');
      return false;
    }

    inputBox.focus();

    if (inputBox instanceof HTMLTextAreaElement || inputBox instanceof HTMLInputElement) {
      inputBox.value = text;
      inputBox.dispatchEvent(new Event('input', { bubbles: true }));
      inputBox.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (inputBox.hasAttribute('contenteditable')) {
      inputBox.textContent = text;
      inputBox.dispatchEvent(new Event('input', { bubbles: true }));
      inputBox.dispatchEvent(new Event('change', { bubbles: true }));

      inputBox.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      inputBox.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    }

    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
    });
    inputBox.dispatchEvent(enterEvent);

    return true;
  } catch (error) {
    console.error('Perplexity injection error:', error);
    return false;
  }
};
