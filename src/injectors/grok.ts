import { findInput, injectText } from '../utils/injectorUtils';

const SELECTORS = [
  'textarea[placeholder*="Type your message"]',
  'textarea[placeholder*="Ask Grok"]',
  'div[contenteditable="true"]',
  'textarea',
];

export const injectGrok = (text: string): boolean => {
  const input = findInput(SELECTORS);
  if (!input) return false;

  injectText(input, text);
  return true;
};
