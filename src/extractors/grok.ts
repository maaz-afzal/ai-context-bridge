import { Conversation, Message, ChatExtractor } from '../types';

export class GrokExtractor implements ChatExtractor {
  detect(): boolean {
    return (
      window.location.hostname.includes('grok.com') || window.location.hostname.includes('x.com')
    );
  }

  async extractConversation(): Promise<Conversation> {
    const messages: Message[] = [];
    const messageEls = document.querySelectorAll(
      '[data-message-author-role], [class*="UserMessage"], [class*="AssistantMessage"]'
    );

    messageEls.forEach((node, i) => {
      const roleAttr = node.getAttribute('data-message-author-role');
      const isUser = roleAttr === 'user' || node.className.toLowerCase().includes('user');
      const content = node.textContent?.trim() ?? '';

      if (content && content.length > 10) {
        messages.push({
          id: `grok-${i}`,
          role: isUser ? 'user' : 'assistant',
          content: this.cleanContent(content),
          timestamp: new Date().toISOString(),
        });
      }
    });

    return {
      platform: 'grok',
      exportedAt: new Date().toISOString(),
      messages,
      title: document.title.replace(' | Grok', '').trim(),
    };
  }

  private cleanContent(content: string): string {
    return content.replace(/\s+/g, ' ').trim();
  }
}
