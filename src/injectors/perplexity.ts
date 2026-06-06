import { findInput, injectText } from '../utils/injectorUtils';

const SELECTORS = [
  'textarea[placeholder*="Ask anything"]',
  'textarea[placeholder*="Ask Perplexity"]',
  'div[contenteditable="true"]',
  'textarea',
];

export const injectPerplexity = (text: string): boolean => {
  const input = findInput(SELECTORS);
  if (!input) return false;

  injectText(input, text);
  return true;
};
