import { Conversation, Message, ChatExtractor } from '../types';
import { cleanContent, generateMessageId } from '../utils/extractorUtils';

export class PerplexityExtractor implements ChatExtractor {
  detect(): boolean {
    return window.location.hostname.includes('perplexity.ai');
  }

  async extractConversation(): Promise<Conversation> {
    const messages: Message[] = [];

    document.querySelectorAll('div.chat-message').forEach((node, i) => {
      const role: 'user' | 'assistant' = node.classList.contains('user') ? 'user' : 'assistant';
      const content = cleanContent(node.querySelector('div.message-content')?.textContent ?? node.textContent ?? '');

      if (content.length > 10) {
        messages.push({ id: generateMessageId(role, content) || `perplexity-${i}`, role, content, timestamp: new Date().toISOString() });
      }
    });

    return {
      platform: 'perplexity',
      exportedAt: new Date().toISOString(),
      messages,
      title: document.title.replace(' - Perplexity', '').trim() || 'Perplexity Conversation',
    };
  }
}