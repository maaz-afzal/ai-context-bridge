import { findInput, injectText } from '../utils/injectorUtils';

const SELECTORS = [
  'div[contenteditable="true"][role="textbox"]',
  'div.ProseMirror',
  '[contenteditable="true"]',
  'textarea[placeholder*="Message"]',
  'textarea[placeholder*="Ask"]',
  '[data-testid="compose-input"]',
  'textarea',
];

export const injectClaude = (text: string): boolean => {
  const input = findInput(SELECTORS);
  if (!input) return false;

  injectText(input, text);
  return true;
};
