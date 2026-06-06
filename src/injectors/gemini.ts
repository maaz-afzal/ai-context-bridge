import { findInput, injectText } from '../utils/injectorUtils';

const SELECTORS = [
  'textarea[aria-label*="Enter your prompt"]',
  'textarea[aria-label*="Ask Gemini"]',
  'div[contenteditable="true"]',
  'textarea',
];

export const injectGemini = (text: string): boolean => {
  const input = findInput(SELECTORS);
  if (!input) return false;

  injectText(input, text);
  return true;
};
