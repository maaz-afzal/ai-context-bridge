import { Conversation, Message, ChatExtractor } from '../types';

export class ChatGPTExtractor implements ChatExtractor {
  detect(): boolean {
    return window.location.hostname.includes('chatgpt.com');
  }

  async extractConversation(): Promise<Conversation> {
    console.log('=== ChatGPT Smart Extraction Started ===');

    await this.waitForMessages();

    const messages: Message[] = [];

    // ChatGPT uses article[data-testid^="conversation-turn"] for each turn
    const turns = document.querySelectorAll('article[data-testid^="conversation-turn"]');
    console.log(`Found ${turns.length} conversation turns`);

    for (let i = 0; i < turns.length; i++) {
      const turn = turns[i];
      const message = this.extractMessageFromTurn(turn);

      if (message && message.content.length > 10) {
        messages.push(message);
        console.log(`Extracted ${message.role} message: ${message.content.substring(0, 50)}...`);
      }
    }

    // Fallback if no messages found
    if (messages.length === 0) {
      console.log('No messages found with primary selector, trying fallback...');
      const fallbackMessages = this.extractFallback();
      messages.push(...fallbackMessages);
    }

    // Remove duplicates and fix order
    const uniqueMessages = this.removeDuplicates(messages);
    const sortedMessages = this.sortByOrder(uniqueMessages);
    const correctedMessages = this.ensureAlternatingRoles(sortedMessages);

    const userCount = correctedMessages.filter((m) => m.role === 'user').length;
    const assistantCount = correctedMessages.filter((m) => m.role === 'assistant').length;

    console.log(
      `✅ Extracted ${correctedMessages.length} messages (${userCount} user, ${assistantCount} assistant)`
    );

    return {
      platform: 'chatgpt',
      exportedAt: new Date().toISOString(),
      messages: correctedMessages,
      title: this.extractTitle(),
    };
  }

  private async waitForMessages(): Promise<void> {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 20;

      const checkInterval = setInterval(() => {
        attempts++;
        const hasMessages =
          document.querySelectorAll('article[data-testid^="conversation-turn"]').length > 0;

        if (hasMessages || attempts >= maxAttempts) {
          clearInterval(checkInterval);
          setTimeout(resolve, 500);
        }
      }, 500);
    });
  }

  private extractMessageFromTurn(turn: Element): Message | null {
    try {
      // Extract role
      const roleEl = turn.querySelector('[data-message-author-role]');
      const rawRole = roleEl?.getAttribute('data-message-author-role');

      let role: 'user' | 'assistant' = 'user';
      if (rawRole === 'assistant') {
        role = 'assistant';
      } else if (rawRole === 'user') {
        role = 'user';
      } else {
        // Fallback role detection
        const hasUserIcon = turn.querySelector('[data-testid="user-avatar"]');
        const hasAssistantIcon = turn.querySelector('[data-testid="assistant-avatar"]');
        if (hasAssistantIcon) role = 'assistant';
        if (hasUserIcon) role = 'user';
      }

      // Extract content - try multiple selectors
      let content = '';
      const contentSelectors = [
        '.whitespace-pre-wrap',
        '.markdown.prose',
        '.markdown',
        '[data-message-author-role] > div > div',
        '.text-base',
      ];

      for (const selector of contentSelectors) {
        const contentEl = turn.querySelector(selector);
        if (contentEl?.textContent) {
          content = contentEl.textContent.trim();
          break;
        }
      }

      // If still no content, get all text
      if (!content) {
        content = turn.textContent?.trim() || '';
      }

      // Clean content
      content = this.cleanContent(content);

      if (!content || content.length < 10) return null;

      // Extract metadata
      const codeBlocks = this.extractCodeBlocks(turn);
      const timestamp = this.extractTimestamp(turn);

      return {
        id: `chatgpt-${Date.now()}-${Math.random()}`,
        role,
        content,
        timestamp: timestamp || new Date().toISOString(),
        metadata: {
          codeBlocks: codeBlocks.length > 0 ? (codeBlocks as any) : undefined,
        },
      };
    } catch (error) {
      console.warn('Failed to extract ChatGPT message:', error);
      return null;
    }
  }

  private extractFallback(): Message[] {
    const messages: Message[] = [];

    // Look for message groups by data-message-id
    const groups = document.querySelectorAll('[data-message-id]');
    console.log(`Found ${groups.length} message groups in fallback`);

    groups.forEach((group, index) => {
      const roleAttr = group.getAttribute('data-message-author-role');
      let role: 'user' | 'assistant' = roleAttr === 'user' ? 'user' : 'assistant';

      let content = '';
      const contentEl = group.querySelector('[data-message-content]');
      if (contentEl?.textContent) {
        content = contentEl.textContent.trim();
      } else {
        content = group.textContent?.trim() || '';
      }

      content = this.cleanContent(content);

      if (content && content.length > 10) {
        messages.push({
          id: `chatgpt-fb-${index}`,
          role,
          content,
          timestamp: new Date().toISOString(),
        });
      }
    });

    return messages;
  }

  private extractCodeBlocks(element: Element): string[] {
    const blocks: string[] = [];
    const codeElements = element.querySelectorAll('pre code, pre');

    codeElements.forEach((el) => {
      const code = el.textContent?.trim();
      if (code && code.length > 10) {
        blocks.push(code);
      }
    });

    return blocks;
  }

  private extractTimestamp(element: Element): string | undefined {
    const timeElement = element.querySelector('time, [data-timestamp]');
    if (timeElement) {
      return timeElement.getAttribute('datetime') || undefined;
    }
    return undefined;
  }

  private cleanContent(content: string): string {
    if (!content) return '';

    let cleaned = content
      .replace(/\s+/g, ' ')
      .replace(/Copy code/gi, '')
      .replace(/Edit/gi, '')
      .replace(/Delete/gi, '')
      .replace(/Regenerate/gi, '')
      .replace(/Copy/gi, '')
      .replace(/👍/g, '')
      .replace(/👎/g, '')
      .trim();

    return cleaned;
  }

  private removeDuplicates(messages: Message[]): Message[] {
    const seen = new Map<string, boolean>();
    const unique: Message[] = [];

    for (const msg of messages) {
      const key = `${msg.role}_${msg.content.substring(0, 150)}`;
      if (!seen.has(key)) {
        seen.set(key, true);
        unique.push(msg);
      }
    }

    return unique;
  }

  private sortByOrder(messages: Message[]): Message[] {
    return messages;
  }

  private ensureAlternatingRoles(messages: Message[]): Message[] {
    if (messages.length === 0) return messages;

    const corrected: Message[] = [];
    let expectedRole: 'user' | 'assistant' = 'user';

    for (let i = 0; i < messages.length; i++) {
      let msg = messages[i];

      if (msg.role !== expectedRole) {
        console.log(`Fixing role at index ${i}: expected ${expectedRole}, got ${msg.role}`);
        msg = { ...msg, role: expectedRole };
      }

      corrected.push(msg);
      expectedRole = msg.role === 'user' ? 'assistant' : 'user';
    }

    return corrected;
  }

  private extractTitle(): string {
    const titleEl = document.querySelector('nav h1, [data-testid="conversation-title"]');
    if (titleEl?.textContent) {
      return titleEl.textContent.trim();
    }
    return document.title.replace(' - ChatGPT', '').trim() || 'ChatGPT Conversation';
  }
}
