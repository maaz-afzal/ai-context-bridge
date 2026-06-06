import { Conversation, Message, ChatExtractor } from '../types';
import {
  cleanContent,
  deduplicateMessages,
  extractCodeBlocks,
  generateMessageId,
  waitForElements,
} from '../utils/extractorUtils';

export class ChatGPTExtractor implements ChatExtractor {
  detect(): boolean {
    return window.location.hostname.includes('chatgpt.com');
  }

  async extractConversation(): Promise<Conversation> {
    await waitForElements('article[data-testid^="conversation-turn"]');

    const turns = document.querySelectorAll('article[data-testid^="conversation-turn"]');
    const messages: Message[] = [];

    turns.forEach((turn) => {
      const msg = this.extractFromTurn(turn);
      if (msg) messages.push(msg);
    });

    const unique = deduplicateMessages(messages);

    return {
      platform: 'chatgpt',
      exportedAt: new Date().toISOString(),
      messages: unique,
      title: this.extractTitle(),
    };
  }

  private extractFromTurn(turn: Element): Message | null {
    const roleEl = turn.querySelector('[data-message-author-role]');
    const rawRole = roleEl?.getAttribute('data-message-author-role');
    const role: 'user' | 'assistant' = rawRole === 'assistant' ? 'assistant' : 'user';

    let content = '';
    const selectors = ['.whitespace-pre-wrap', '.markdown.prose', '.markdown', '.text-base'];

    for (const sel of selectors) {
      const el = turn.querySelector(sel);
      if (el?.textContent) {
        content = el.textContent.trim();
        break;
      }
    }

    if (!content) content = turn.textContent?.trim() ?? '';
    content = cleanContent(content);
    if (content.length < 10) return null;

    const codeBlocks = extractCodeBlocks(turn);

    return {
      id: generateMessageId(role, content),
      role,
      content,
      timestamp: turn.querySelector('time')?.getAttribute('datetime') ?? new Date().toISOString(),
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

  private extractTitle(): string {
    const el = document.querySelector('[data-testid="conversation-title"]');
    if (el?.textContent) return el.textContent.trim();
    return document.title.replace(' - ChatGPT', '').trim() || 'ChatGPT Conversation';
  }
}
