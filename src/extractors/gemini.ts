import { Conversation, Message, ChatExtractor } from '../types';
import { cleanContent, generateMessageId } from '../utils/extractorUtils';

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
        const content = cleanContent(userEl.textContent);
        if (content.length > 10) {
          messages.push({ id: generateMessageId('user', content) || `gemini-user-${i}`, role: 'user', content, timestamp: new Date().toISOString() });
        }
      }

      if (aiEl?.textContent) {
        const content = cleanContent(aiEl.textContent);
        if (content.length > 10) {
          messages.push({ id: generateMessageId('assistant', content) || `gemini-ai-${i}`, role: 'assistant', content, timestamp: new Date().toISOString() });
        }
      }
    });

    return {
      platform: 'gemini',
      exportedAt: new Date().toISOString(),
      messages,
      title: document.title.replace(' - Gemini', '').trim() || 'Gemini Conversation',
    };
  }
}