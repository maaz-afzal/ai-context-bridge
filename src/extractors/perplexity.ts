import { Conversation, Message, ChatExtractor } from '../types';

export class PerplexityExtractor implements ChatExtractor {
  detect(): boolean {
    return window.location.hostname.includes('perplexity.ai');
  }

  async extractConversation(): Promise<Conversation> {
    const messages: Message[] = [];
    const messageNodes = document.querySelectorAll('div.chat-message');

    messageNodes.forEach((node, i) => {
      const role = node.classList.contains('user') ? 'user' : 'assistant';
      const content =
        node.querySelector('div.message-content')?.textContent || node.textContent || '';

      if (content.trim() && content.length > 10) {
        messages.push({
          id: `perplexity-${i}`,
          role,
          content: this.cleanContent(content),
          timestamp: new Date().toISOString(),
        });
      }
    });

    return {
      platform: 'perplexity',
      exportedAt: new Date().toISOString(),
      messages,
      title: document.title.replace(' - Perplexity', '').trim(),
    };
  }

  private cleanContent(content: string): string {
    return content.replace(/\s+/g, ' ').trim();
  }
}
