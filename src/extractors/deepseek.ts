import { Conversation, Message, ChatExtractor } from '../types';

export class DeepSeekExtractor implements ChatExtractor {
  detect(): boolean {
    return window.location.hostname.includes('deepseek.com');
  }

  async extractConversation(): Promise<Conversation> {
    console.log('=== DeepSeek Smart Extraction Started ===');

    // Wait for messages to load
    await this.waitForMessages();

    const messages: Message[] = [];

    // Method 1: Try to find messages by common selectors
    const selectors = [
      '[class*="chat-message"]',
      '[class*="message-item"]',
      '[class*="conversation-item"]',
      '[class*="bubble"]',
      '[data-role="user"]',
      '[data-role="assistant"]',
      '.chat-turn',
      '.message',
      '.assistant-message',
      '.user-message',
      '.bot-message',
      '.human-message',
    ];

    let allMessages: Element[] = [];
    for (const selector of selectors) {
      const elements = Array.from(document.querySelectorAll(selector));
      if (elements.length > 0) {
        console.log(`Found ${elements.length} messages with selector: ${selector}`);
        allMessages = [...allMessages, ...elements];
      }
    }

    // Remove duplicates
    allMessages = [...new Set(allMessages)];
    console.log(`Total unique message containers: ${allMessages.length}`);

    // Extract messages from found containers
    for (let i = 0; i < allMessages.length; i++) {
      const container = allMessages[i];
      const message = this.extractMessageFromContainer(container);

      if (message && message.content.length > 10) {
        messages.push(message);
      }
    }

    // Method 2: If no messages found, scan all divs with substantial text
    if (messages.length === 0) {
      console.log('No messages found with selectors, trying fallback method...');
      const allDivs = document.querySelectorAll('div');
      let lastRole: 'user' | 'assistant' = 'user';
      let fallbackIndex = 0; // Fixed: Added counter variable

      for (const div of allDivs) {
        const text = div.textContent?.trim() || '';
        // Check if this looks like a message (substantial text, not UI)
        if (text.length > 50 && text.length < 5000 && !this.isUIElement(div)) {
          // Detect role by content patterns
          let role: 'user' | 'assistant' = 'user';

          // Assistant messages often have certain patterns
          if (
            text.includes('I understand') ||
            text.includes('Let me') ||
            text.includes('Based on') ||
            text.includes('According to') ||
            /I['']?m|I am/.test(text) ||
            lastRole === 'user'
          ) {
            role = 'assistant';
          }

          // Also check for user indicators
          if (text.includes('?') && text.length < 200) {
            role = 'user';
          }

          messages.push({
            id: `deepseek-fallback-${fallbackIndex}`, // Fixed: using fallbackIndex instead of i
            role,
            content: this.cleanContent(text),
            timestamp: new Date().toISOString(),
          });
          lastRole = role;
          fallbackIndex++; // Increment counter
        }
      }
    }

    // Method 3: Try React fiber extraction
    if (messages.length === 0) {
      console.log('Trying React fiber extraction...');
      const reactMessages = this.extractFromReact();
      messages.push(...reactMessages);
    }

    // Sort messages by appearance order
    const sortedMessages = this.sortByOrder(messages);

    // Remove duplicates
    const uniqueMessages = this.removeDuplicates(sortedMessages);

    // Ensure alternating roles (user -> assistant -> user -> assistant)
    const correctedMessages = this.correctAlternatingRoles(uniqueMessages);

    // Calculate stats
    const stats = this.calculateStats(correctedMessages);

    console.log(
      `✅ Extracted ${correctedMessages.length} messages (${stats.userCount} user, ${stats.assistantCount} assistant)`
    );

    return {
      platform: 'deepseek',
      exportedAt: new Date().toISOString(),
      messages: correctedMessages,
      title: this.extractTitle(),
      metadata: stats,
    };
  }

  private async waitForMessages(): Promise<void> {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 20;

      const checkInterval = setInterval(() => {
        attempts++;
        const hasMessages =
          document.querySelectorAll('[class*="message"], [class*="chat"], [class*="conversation"]')
            .length > 0;

        if (hasMessages || attempts >= maxAttempts) {
          clearInterval(checkInterval);
          setTimeout(resolve, 500);
        }
      }, 500);
    });
  }

  private extractMessageFromContainer(container: Element): Message | null {
    try {
      // Detect role
      let role: 'user' | 'assistant' = 'user';
      const className = container.className;
      const testId = container.getAttribute('data-testid');
      const roleAttr = container.getAttribute('data-role');

      // Check various role indicators
      if (
        roleAttr === 'assistant' ||
        testId?.includes('assistant') ||
        (typeof className === 'string' && className.includes('assistant')) ||
        (typeof className === 'string' && className.includes('bot')) ||
        (typeof className === 'string' && className.includes('ai'))
      ) {
        role = 'assistant';
      }

      if (
        roleAttr === 'user' ||
        testId?.includes('user') ||
        (typeof className === 'string' && className.includes('user')) ||
        (typeof className === 'string' && className.includes('human'))
      ) {
        role = 'user';
      }

      // Extract content
      let content = '';

      // Try different content selectors
      const contentSelectors = [
        '.markdown',
        '.prose',
        '.message-content',
        '.content',
        '.text',
        '[class*="content"]',
        '[class*="text"]',
      ];

      for (const selector of contentSelectors) {
        const contentEl = container.querySelector(selector);
        if (contentEl?.textContent) {
          content = contentEl.textContent.trim();
          break;
        }
      }

      // If no content found, get all text from container
      if (!content) {
        content = container.textContent?.trim() || '';
      }

      // Clean content
      content = this.cleanContent(content);

      if (!content || content.length < 10) return null;

      // Extract code blocks
      const codeBlocks = this.extractCodeBlocks(container);

      // Extract links
      const links = this.extractLinks(container);

      return {
        id: `deepseek-${Date.now()}-${Math.random()}`,
        role,
        content,
        timestamp: new Date().toISOString(),
        metadata: {
          codeBlocks: codeBlocks.length > 0 ? (codeBlocks as any) : undefined,
          links: links.length > 0 ? links : undefined,
        },
      };
    } catch (error) {
      console.warn('Failed to extract message:', error);
      return null;
    }
  }

  private extractFromReact(): Message[] {
    const messages: Message[] = [];

    try {
      const root = document.querySelector('#root');
      if (root && (root as any)._reactRootContainer) {
        let fiber = (root as any)._reactRootContainer._internalRoot.current;

        const traverse = (node: any) => {
          if (!node || !node.memoizedProps) return;

          const props = node.memoizedProps;

          if (props.message || props.content || props.text) {
            const messageData = props.message || props;
            const role = messageData.role === 'user' ? 'user' : 'assistant';
            const content = messageData.content || messageData.text || '';

            if (content && content.length > 10) {
              messages.push({
                id: `react-${Date.now()}-${messages.length}`,
                role,
                content: this.cleanContent(content),
                timestamp: new Date().toISOString(),
              });
            }
          }

          if (node.child) traverse(node.child);
          if (node.sibling) traverse(node.sibling);
        };

        traverse(fiber);
      }
    } catch (e) {
      console.debug('React extraction failed:', e);
    }

    return messages;
  }

  private extractCodeBlocks(element: Element): string[] {
    const blocks: string[] = [];
    const codeElements = element.querySelectorAll('pre code, pre, .code-block');

    codeElements.forEach((el) => {
      const code = el.textContent?.trim();
      if (code && code.length > 10) {
        blocks.push(code);
      }
    });

    return blocks;
  }

  private extractLinks(element: Element): string[] {
    const links: string[] = [];
    const linkElements = element.querySelectorAll('a[href]');

    linkElements.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('http')) {
        links.push(href);
      }
    });

    return links;
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
      .replace(/📋/g, '')
      .replace(/🔄/g, '')
      .trim();

    return cleaned;
  }

  private isUIElement(element: Element): boolean {
    const uiSelectors = [
      'button',
      'nav',
      'header',
      'footer',
      'aside',
      '[role="button"]',
      '[role="navigation"]',
      '.sidebar',
      '.menu',
      '.toolbar',
      '.settings',
    ];

    for (const selector of uiSelectors) {
      if (element.matches(selector) || element.closest(selector)) {
        return true;
      }
    }

    return false;
  }

  private sortByOrder(messages: Message[]): Message[] {
    return messages;
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

  private correctAlternatingRoles(messages: Message[]): Message[] {
    if (messages.length === 0) return messages;

    const corrected: Message[] = [];
    let expectedRole: 'user' | 'assistant' = 'user';

    for (let i = 0; i < messages.length; i++) {
      let msg = messages[i];

      if (msg.role !== expectedRole) {
        if (i > 0 && i < messages.length - 1) {
          const nextMsg = messages[i + 1];
          if (nextMsg && nextMsg.role === expectedRole) {
            corrected.push(nextMsg);
            corrected.push(msg);
            i++;
            expectedRole = msg.role === 'user' ? 'assistant' : 'user';
            continue;
          }
        }
        msg = { ...msg, role: expectedRole };
      }

      corrected.push(msg);
      expectedRole = msg.role === 'user' ? 'assistant' : 'user';
    }

    return corrected;
  }

  private extractTitle(): string {
    const titleSelectors = ['h1', '.title', '[data-title]', '[class*="title"]'];

    for (const selector of titleSelectors) {
      const el = document.querySelector(selector);
      if (el?.textContent) {
        const title = el.textContent.trim();
        if (title && title.length < 100 && !title.includes('DeepSeek')) {
          return title;
        }
      }
    }

    return document.title.replace(' - DeepSeek', '').trim() || 'DeepSeek Conversation';
  }

  private calculateStats(messages: Message[]): {
    userCount: number;
    assistantCount: number;
    totalTokens: number;
  } {
    let userCount = 0;
    let assistantCount = 0;
    let totalTokens = 0;

    for (const msg of messages) {
      if (msg.role === 'user') userCount++;
      if (msg.role === 'assistant') assistantCount++;
      totalTokens += this.estimateTokens(msg.content);
    }

    return { userCount, assistantCount, totalTokens };
  }

  private estimateTokens(text: string): number {
    if (!text || text.length === 0) return 0;
    let tokenCount = 0;
    const words = text.split(/\s+/);

    for (const word of words) {
      if (!word) continue;
      tokenCount += 1;
      const specialChars = (word.match(/[^\w\s]/g) || []).length;
      tokenCount += Math.ceil(specialChars / 2);
      if (word.length > 10) {
        tokenCount += Math.ceil((word.length - 10) / 4);
      }
    }

    return Math.max(1, tokenCount);
  }
}
