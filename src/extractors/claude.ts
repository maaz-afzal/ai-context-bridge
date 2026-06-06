import { Conversation, Message, ChatExtractor } from '../types';
import {
  cleanContent,
  deduplicateMessages,
  extractCodeBlocks,
  generateMessageId,
  waitForElements,
} from '../utils/extractorUtils';

// Ordered by specificity — first match wins per turn
const MESSAGE_SELECTORS = [
  '[data-testid="user-message"]',
  '[data-testid="assistant-message"]',
  '[data-testid="message"]',
];

// Selectors tried in order to find message content within a container
const CONTENT_SELECTORS = ['.font-claude-message', '.prose', '.markdown', '[class*="content"]'];

export class ClaudeExtractor implements ChatExtractor {
  detect(): boolean {
    return window.location.hostname.includes('claude.ai');
  }

  async extractConversation(): Promise<Conversation> {
    // Wait for at least one known message element
    await waitForElements('[data-testid="user-message"], [data-testid="assistant-message"]');

    const messages: Message[] = [];

    for (const selector of MESSAGE_SELECTORS) {
      document.querySelectorAll(selector).forEach((el) => {
        const msg = this.extractFromElement(el, selector);
        if (msg) messages.push(msg);
      });
    }

    // If the specific testid selectors found nothing, fall back to article tags
    if (messages.length === 0) {
      document.querySelectorAll('article').forEach((el) => {
        const msg = this.extractFromElement(el, 'article');
        if (msg) messages.push(msg);
      });
    }

    const unique = deduplicateMessages(messages);
    const stats = this.buildMetadata(unique);

    return {
      platform: 'claude',
      exportedAt: new Date().toISOString(),
      messages: unique,
      title: this.extractTitle(),
      metadata: stats,
    };
  }

  private extractFromElement(el: Element, selector: string): Message | null {
    let content = '';

    for (const contentSel of CONTENT_SELECTORS) {
      const inner = el.querySelector(contentSel);
      if (inner?.textContent) {
        content = inner.textContent.trim();
        break;
      }
    }

    if (!content) content = el.textContent?.trim() ?? '';
    content = cleanContent(content);
    if (content.length < 20) return null;

    const role = this.detectRole(el, selector);
    const codeBlocks = extractCodeBlocks(el);

    return {
      id: generateMessageId(role, content),
      role,
      content,
      timestamp: new Date().toISOString(),
      metadata:
        codeBlocks.length > 0
          ? {
              codeBlocks: codeBlocks.map((c) => ({
                language: '',
                code: c,
                lineCount: c.split('\n').length,
              })),
            }
          : undefined,
    };
  }

  private detectRole(el: Element, selector: string): 'user' | 'assistant' {
    if (selector.includes('user') || el.getAttribute('data-testid')?.includes('user'))
      return 'user';
    if (selector.includes('assistant') || el.getAttribute('data-testid')?.includes('assistant'))
      return 'assistant';

    const className = typeof el.className === 'string' ? el.className.toLowerCase() : '';
    if (className.includes('user') || className.includes('human')) return 'user';
    if (className.includes('assistant') || className.includes('bot')) return 'assistant';

    return 'user';
  }

  private buildMetadata(messages: Message[]) {
    const totalTokens = messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0);
    const totalCharacters = messages.reduce((sum, m) => sum + m.content.length, 0);
    const codeBlockCount = messages.reduce(
      (sum, m) => sum + (m.metadata?.codeBlocks?.length ?? 0),
      0
    );

    return {
      totalTokens,
      messageCount: messages.length,
      characterCount: totalCharacters,
      codeBlockCount,
    };
  }

  private extractTitle(): string {
    const selectors = ['[data-testid="conversation-title"]', 'h1', '.text-lg.font-semibold'];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el?.textContent) {
        const t = el.textContent.trim();
        if (t.length > 3 && t.length < 100) return t;
      }
    }
    return document.title.replace(' - Claude', '').trim() || 'Claude Conversation';
  }
}
