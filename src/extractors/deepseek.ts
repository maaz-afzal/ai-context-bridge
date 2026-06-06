import { Conversation, Message, ChatExtractor } from '../types';
import { cleanContent, deduplicateMessages, generateMessageId, waitForElements } from '../utils/extractorUtils';

const ROLE_SELECTORS = [
  '[class*="chat-message"]',
  '[class*="message-item"]',
  '[class*="bubble"]',
  '[data-role="user"]',
  '[data-role="assistant"]',
];

const CONTENT_SELECTORS = ['.markdown', '.prose', '.message-content', '.content', '[class*="content"]'];

export class DeepSeekExtractor implements ChatExtractor {
  detect(): boolean {
    return window.location.hostname.includes('deepseek.com');
  }

  async extractConversation(): Promise<Conversation> {
    await waitForElements(ROLE_SELECTORS.join(', '));

    const messages: Message[] = [];
    const found = new Set<Element>();

    for (const selector of ROLE_SELECTORS) {
      document.querySelectorAll(selector).forEach((el) => {
        if (!found.has(el)) {
          found.add(el);
          const msg = this.extractFromContainer(el);
          if (msg) messages.push(msg);
        }
      });
    }

    const unique = deduplicateMessages(messages);

    return {
      platform: 'deepseek',
      exportedAt: new Date().toISOString(),
      messages: unique,
      title: document.title.replace(' - DeepSeek', '').trim() || 'DeepSeek Conversation',
    };
  }

  private extractFromContainer(el: Element): Message | null {
    let content = '';

    for (const sel of CONTENT_SELECTORS) {
      const inner = el.querySelector(sel);
      if (inner?.textContent) { content = inner.textContent.trim(); break; }
    }

    if (!content) content = el.textContent?.trim() ?? '';
    content = cleanContent(content);
    if (content.length < 10) return null;

    const role = this.detectRole(el);

    return {
      id: generateMessageId(role, content),
      role,
      content,
      timestamp: new Date().toISOString(),
    };
  }

  private detectRole(el: Element): 'user' | 'assistant' {
    const roleAttr = el.getAttribute('data-role');
    if (roleAttr === 'user') return 'user';
    if (roleAttr === 'assistant') return 'assistant';

    const cls = typeof el.className === 'string' ? el.className.toLowerCase() : '';
    if (cls.includes('user') || cls.includes('human')) return 'user';
    if (cls.includes('assistant') || cls.includes('bot') || cls.includes('ai')) return 'assistant';

    return 'user';
  }
}