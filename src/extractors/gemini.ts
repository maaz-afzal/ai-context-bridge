import { Conversation, Message, ChatExtractor } from '../types';

export class GeminiExtractor implements ChatExtractor {
  detect(): boolean {
    return window.location.hostname.includes('gemini.google.com');
  }

  async extractConversation(): Promise<Conversation> {
    const messages: Message[] = [];
    const turns = document.querySelectorAll('.conversation-turn, .turn');

    turns.forEach((turn, i) => {
      const userEl = turn.querySelector('.user-query-text');
      const aiEl = turn.querySelector('.model-response-text, message-content');

      if (userEl?.textContent) {
        messages.push({
          id: `gemini-user-${i}`,
          role: 'user',
          content: this.cleanContent(userEl.textContent),
          timestamp: new Date().toISOString(),
        });
      }
      if (aiEl?.textContent) {
        messages.push({
          id: `gemini-ai-${i}`,
          role: 'assistant',
          content: this.cleanContent(aiEl.textContent),
          timestamp: new Date().toISOString(),
        });
      }
    });

    return {
      platform: 'gemini',
      exportedAt: new Date().toISOString(),
      messages,
      title: document.title.replace(' - Gemini', '').trim(),
    };
  }

  private cleanContent(content: string): string {
    return content.replace(/\s+/g, ' ').trim();
  }
}
