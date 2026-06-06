import { findInput, injectText } from '../utils/injectorUtils';

const SELECTORS = [
  'textarea[placeholder*="Type a message"]',
  'textarea[placeholder*="Ask DeepSeek"]',
  'div[contenteditable="true"]',
  'textarea',
];

export const injectDeepSeek = (text: string): boolean => {
  const input = findInput(SELECTORS);
  if (!input) return false;

  injectText(input, text);
  return true;
};
