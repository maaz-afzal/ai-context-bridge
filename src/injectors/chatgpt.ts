import { findInput, injectText } from '../utils/injectorUtils';

const SELECTORS = [
  '#prompt-textarea',
  'textarea[placeholder*="Message"]',
  'textarea[placeholder*="Send a message"]',
  'div[contenteditable="true"]',
  'textarea',
];

export const injectChatGPT = (text: string): boolean => {
  const input = findInput(SELECTORS);
  if (!input) return false;

  injectText(input, text);
  return true;
};
