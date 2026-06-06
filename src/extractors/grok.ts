import { Conversation, Message, ChatExtractor } from '../types';
import { cleanContent, generateMessageId } from '../utils/extractorUtils';

export class GrokExtractor implements ChatExtractor {
  detect(): boolean {
    return window.location.hostname.includes('grok.com') || window.location.hostname.includes('x.com');
  }

  async extractConversation(): Promise<Conversation> {
    const messages: Message[] = [];

    document.querySelectorAll('[data-message-author-role], [class*="UserMessage"], [class*="AssistantMessage"]').forEach((node, i) => {
      const roleAttr = node.getAttribute('data-message-author-role');
      const isUser = roleAttr === 'user' || node.className.toLowerCase().includes('user');
      const content = cleanContent(node.textContent ?? '');

      if (content.length > 10) {
        const role: 'user' | 'assistant' = isUser ? 'user' : 'assistant';
        messages.push({ id: generateMessageId(role, content) || `grok-${i}`, role, content, timestamp: new Date().toISOString() });
      }
    });

    return {
      platform: 'grok',
      exportedAt: new Date().toISOString(),
      messages,
      title: document.title.replace(' | Grok', '').trim() || 'Grok Conversation',
    };
  }
}