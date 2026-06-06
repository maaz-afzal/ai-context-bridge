import { Message } from '../types';

/**
 * Removes duplicate messages based on role + first 200 chars of content.
 * When duplicates exist, keeps the longer version.
 */
export const deduplicateMessages = (messages: Message[]): Message[] => {
  const seen = new Map<string, Message>();

  for (const msg of messages) {
    const key = `${msg.role}_${msg.content.substring(0, 200)}`;
    const existing = seen.get(key);
    if (!existing || msg.content.length > existing.content.length) {
      seen.set(key, msg);
    }
  }

  return Array.from(seen.values());
};

/**
 * Strips common UI noise from extracted text.
 */
export const cleanContent = (text: string): string => {
  return text
    .replace(/\bCopy code\b/gi, '')
    .replace(/\bRegenerate\b/gi, '')
    .replace(/[👍👎📋🔄]/g, '')
    .replace(/\s{3,}/g, '\n\n')
    .trim();
};

/**
 * Extracts text content from code blocks within an element.
 */
export const extractCodeBlocks = (element: Element): string[] => {
  const blocks: string[] = [];
  element.querySelectorAll('pre code, pre').forEach((el) => {
    const code = el.textContent?.trim();
    if (code && code.length > 10) blocks.push(code);
  });
  return [...new Set(blocks)];
};

/**
 * Generates a stable ID for a message based on role + content hash.
 */
export const generateMessageId = (role: string, content: string): string => {
  let hash = 0;
  const str = `${role}_${content.substring(0, 200)}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `${role}-${Math.abs(hash).toString(36)}`;
};

/**
 * Waits for elements matching a selector to appear in the DOM.
 * Resolves after maxWait ms regardless.
 */
export const waitForElements = (selector: string, maxWait = 5000): Promise<void> => {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      resolve();
      return;
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      resolve();
    }, maxWait);
  });
};
