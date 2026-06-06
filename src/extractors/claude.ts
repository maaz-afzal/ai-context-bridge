import { Conversation, Message, ChatExtractor } from '../types';

export class ClaudeExtractor implements ChatExtractor {
  detect(): boolean {
    return window.location.hostname.includes('claude.ai');
  }

  async extractConversation(): Promise<Conversation> {
    console.log('=== Claude Ultra-Powerful Extraction Started ===');

    // Multiple extraction strategies in parallel
    const extractionStrategies = [
      this.extractBySelectors.bind(this),
      this.extractByDOMTraversal.bind(this),
      this.extractByTextPatterns.bind(this),
      this.extractByReactFiber.bind(this),
      this.extractByMutationObserver.bind(this),
      this.extractByShadowDOM.bind(this),
      this.extractByIframe.bind(this),
    ];

    let allMessages: Message[] = [];

    // Try all strategies
    for (const strategy of extractionStrategies) {
      try {
        console.log(`Trying strategy: ${strategy.name}...`);
        const messages = await strategy();
        if (messages.length > 0) {
          console.log(`✅ ${strategy.name} found ${messages.length} messages`);
          allMessages = [...allMessages, ...messages];
        }
      } catch (error) {
        console.warn(`${strategy.name} failed:`, error);
      }
    }

    // Deduplicate and process
    const uniqueMessages = this.smartDeduplication(allMessages);
    const sortedMessages = this.sortByTimestamp(uniqueMessages);
    const mergedMessages = this.mergeAdjacentMessages(sortedMessages);
    const correctedMessages = this.ensureAlternatingRoles(mergedMessages);

    // Extract metadata
    const stats = this.calculateDetailedStats(correctedMessages);

    console.log(`🎉 FINAL: ${correctedMessages.length} messages extracted!`);
    console.log(
      `📊 Stats: ${stats.userCount} user, ${stats.assistantCount} assistant, ${stats.totalTokens} tokens`
    );

    return {
      platform: 'claude',
      exportedAt: new Date().toISOString(),
      messages: correctedMessages,
      title: await this.extractSmartTitle(),
      metadata: {
        totalTokens: stats.totalTokens,
        messageCount: correctedMessages.length,
        characterCount: stats.totalCharacters,
        codeBlockCount: stats.totalCodeBlocks,
      },
    };
  }

  // Strategy 1: Direct selectors (most common)
  private async extractBySelectors(): Promise<Message[]> {
    const messages: Message[] = [];
    const selectors = [
      '[data-testid="user-message"]',
      '[data-testid="assistant-message"]',
      '[data-testid="message"]',
      '.font-claude-message',
      '.grid-cols-1.gap-2',
      '[class*="message"]',
      '[class*="Message"]',
      '[data-role="user"]',
      '[data-role="assistant"]',
      'article',
      '.prose',
      '.markdown',
    ];

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`  Selector "${selector}" found ${elements.length} elements`);

        for (const element of elements) {
          const message = this.intelligentMessageExtraction(element);
          if (message && !this.isDuplicateMessage(messages, message)) {
            messages.push(message);
          }
        }
      }
    }

    return messages;
  }

  // Strategy 2: DOM traversal
  private async extractByDOMTraversal(): Promise<Message[]> {
    const messages: Message[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (node) => {
        const element = node as Element;
        const text = element.textContent || '';
        if (text.length > 100 && text.length < 10000) {
          if (this.isUIBubble(element)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      },
    });

    const messageElements: Element[] = [];
    let node;
    while ((node = walker.nextNode())) {
      messageElements.push(node as Element);
    }

    console.log(`  DOM traversal found ${messageElements.length} potential message elements`);

    // Group by parent to avoid duplicates
    const parentGroups = new Map<Element, Element[]>();
    for (const element of messageElements) {
      const parent = element.parentElement;
      if (parent) {
        if (!parentGroups.has(parent)) parentGroups.set(parent, []);
        parentGroups.get(parent)!.push(element);
      }
    }

    // Take the deepest elements
    for (const [, children] of parentGroups) {
      if (children.length === 1) {
        const message = this.intelligentMessageExtraction(children[0]);
        if (message) messages.push(message);
      }
    }

    return messages;
  }

  // Strategy 3: Text pattern recognition
  private async extractByTextPatterns(): Promise<Message[]> {
    const messages: Message[] = [];

    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const text = node.textContent?.trim() || '';
        if (text.length > 50 && !this.isUIText(text)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      },
    });

    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
    }

    console.log(`  Text pattern analysis found ${textNodes.length} text nodes`);

    // Group by paragraph/sentence
    let currentMessage = '';
    let currentRole: 'user' | 'assistant' = 'user';
    let messageIndex = 0;

    for (const textNode of textNodes) {
      const text = textNode.textContent?.trim() || '';
      const parent = textNode.parentElement;
      const role = this.detectRoleFromParent(parent);

      if (role !== currentRole && currentMessage.length > 50) {
        messages.push({
          id: `pattern-${messageIndex++}`,
          role: currentRole,
          content: this.cleanContent(currentMessage),
          timestamp: new Date().toISOString(),
        });
        currentMessage = '';
        currentRole = role;
      }

      currentMessage += ' ' + text;
    }

    if (currentMessage.length > 50) {
      messages.push({
        id: `pattern-${messageIndex}`,
        role: currentRole,
        content: this.cleanContent(currentMessage),
        timestamp: new Date().toISOString(),
      });
    }

    return messages;
  }

  // Strategy 4: React Fiber extraction
  private async extractByReactFiber(): Promise<Message[]> {
    const messages: Message[] = [];

    try {
      const roots = document.querySelectorAll('#root, [data-react-root]');

      for (const root of roots) {
        const reactInternal = (root as any)._reactRootContainer || (root as any).__reactContainer$;

        if (reactInternal) {
          let fiber = reactInternal._internalRoot?.current || reactInternal;

          const traverseFiber = (node: any, depth = 0) => {
            if (depth > 30 || !node) return;

            if (node.memoizedProps) {
              const props = node.memoizedProps;

              const possibleContent =
                props.message || props.content || props.text || props.children;

              if (possibleContent && typeof possibleContent === 'string') {
                if (possibleContent.length > 50) {
                  const role =
                    props.role === 'user'
                      ? 'user'
                      : props.role === 'assistant'
                        ? 'assistant'
                        : this.detectRoleFromContent(possibleContent);

                  messages.push({
                    id: `react-${Date.now()}-${messages.length}`,
                    role,
                    content: this.cleanContent(possibleContent),
                    timestamp: new Date().toISOString(),
                  });
                }
              }

              if (props.messages && Array.isArray(props.messages)) {
                for (const msg of props.messages) {
                  if (msg.content && msg.content.length > 50) {
                    messages.push({
                      id: `react-msg-${Date.now()}-${messages.length}`,
                      role: msg.role === 'user' ? 'user' : 'assistant',
                      content: this.cleanContent(msg.content),
                      timestamp: msg.timestamp || new Date().toISOString(),
                    });
                  }
                }
              }
            }

            if (node.child) traverseFiber(node.child, depth + 1);
            if (node.sibling) traverseFiber(node.sibling, depth + 1);
          };

          traverseFiber(fiber);
        }
      }
    } catch (error) {
      console.debug('React fiber extraction error:', error);
    }

    console.log(`  React fiber extraction found ${messages.length} messages`);
    return messages;
  }

  // Strategy 5: Mutation observer
  private async extractByMutationObserver(): Promise<Message[]> {
    return new Promise((resolve) => {
      const messages: Message[] = [];
      let timeout: ReturnType<typeof setTimeout>;

      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                const message = this.intelligentMessageExtraction(element);
                if (message && !this.isDuplicateMessage(messages, message)) {
                  messages.push(message);
                }
              }
            }
          }
        }

        clearTimeout(timeout);
        timeout = setTimeout(() => {
          observer.disconnect();
          resolve(messages);
        }, 1000);
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      setTimeout(() => {
        observer.disconnect();
        resolve(messages);
      }, 5000);
    });
  }

  // Strategy 6: Shadow DOM extraction
  private async extractByShadowDOM(): Promise<Message[]> {
    const messages: Message[] = [];

    const findAllShadowRoots = (element: Element): ShadowRoot[] => {
      const roots: ShadowRoot[] = [];
      if (element.shadowRoot) {
        roots.push(element.shadowRoot);
      }
      for (const child of element.children) {
        roots.push(...findAllShadowRoots(child));
      }
      return roots;
    };

    const shadowRoots = findAllShadowRoots(document.body);
    console.log(`  Found ${shadowRoots.length} shadow roots`);

    for (const shadowRoot of shadowRoots) {
      const messageElements = shadowRoot.querySelectorAll('[class*="message"], [class*="Message"]');
      for (const element of messageElements) {
        const message = this.intelligentMessageExtraction(element);
        if (message) messages.push(message);
      }
    }

    return messages;
  }

  // Strategy 7: Iframe extraction
  private async extractByIframe(): Promise<Message[]> {
    const messages: Message[] = [];
    const iframes = document.querySelectorAll('iframe');

    for (const iframe of iframes) {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          const messageElements = iframeDoc.querySelectorAll(
            '[class*="message"], [class*="Message"]'
          );
          for (const element of messageElements) {
            const message = this.intelligentMessageExtraction(element);
            if (message) messages.push(message);
          }
        }
      } catch (error) {
        // Cross-origin iframe - can't access
      }
    }

    return messages;
  }

  // Core extraction logic
  private intelligentMessageExtraction(element: Element): Message | null {
    try {
      if (!element || !element.textContent) return null;

      const text = element.textContent?.trim() || '';
      if (text.length < 20 || text.length > 50000) return null;
      if (this.isUIBubble(element)) return null;

      let role: 'user' | 'assistant' = 'user';

      const testId = element.getAttribute('data-testid');
      const roleAttr = element.getAttribute('data-role');

      if (testId?.includes('assistant') || roleAttr === 'assistant') {
        role = 'assistant';
      }
      if (testId?.includes('user') || roleAttr === 'user') {
        role = 'user';
      }

      const className = element.className;
      if (typeof className === 'string') {
        if (className.includes('assistant') || className.includes('bot')) {
          role = 'assistant';
        }
        if (className.includes('user') || className.includes('human')) {
          role = 'user';
        }
      }

      const hasAssistantAvatar = element.querySelector('[data-testid="claude-avatar"]');
      const hasUserAvatar = element.querySelector('[data-testid="user-avatar"]');
      if (hasAssistantAvatar) role = 'assistant';
      if (hasUserAvatar) role = 'user';

      let content = this.extractStructuredContent(element);
      if (!content || content.length < 20) return null;

      const codeBlocks = this.extractAllCodeBlocks(element);
      const links = this.extractAllLinks(element);

      return {
        id: this.generateUniqueId(role, content),
        role,
        content,
        timestamp: new Date().toISOString(),
        metadata: {
          codeBlocks: codeBlocks.length > 0 ? (codeBlocks as any) : undefined,
          links: links.length > 0 ? links : undefined,
        },
      };
    } catch (error) {
      console.warn('Message extraction failed:', error);
      return null;
    }
  }

  private extractStructuredContent(element: Element): string {
    const clone = element.cloneNode(true) as Element;

    const removeSelectors = [
      'button',
      '[role="button"]',
      '.copy-button',
      '.edit-button',
      '.regenerate-button',
      '.delete-button',
      '.sr-only',
      '[class*="icon"]',
      '.emoji',
      '.avatar',
    ];

    for (const selector of removeSelectors) {
      clone.querySelectorAll(selector).forEach((el) => el.remove());
    }

    const codeBlocks = clone.querySelectorAll('pre');
    codeBlocks.forEach((block) => {
      const code = block.querySelector('code');
      const codeText = code?.textContent || block.textContent || '';
      const formattedBlock = `\n\`\`\`\n${codeText.trim()}\n\`\`\`\n`;
      block.textContent = formattedBlock;
    });

    const lists = clone.querySelectorAll('ul, ol');
    lists.forEach((list) => {
      const items = Array.from(list.querySelectorAll('li'));
      const formattedItems = items
        .map((li, i) => {
          const prefix = list.tagName === 'OL' ? `${i + 1}.` : '•';
          return `${prefix} ${li.textContent?.trim()}`;
        })
        .join('\n');
      list.textContent = formattedItems;
    });

    let content = clone.textContent || '';
    content = content
      .replace(/\n{4,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    return content;
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

  private extractAllCodeBlocks(element: Element): string[] {
    const blocks: string[] = [];
    const codeElements = element.querySelectorAll('pre code, pre');

    codeElements.forEach((el) => {
      const code = el.textContent?.trim();
      if (code && code.length > 10) {
        blocks.push(code);
      }
    });

    return [...new Set(blocks)];
  }

  private extractAllLinks(element: Element): string[] {
    const links: string[] = [];
    const linkElements = element.querySelectorAll('a[href]');

    linkElements.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('http') && !links.includes(href)) {
        links.push(href);
      }
    });

    return links;
  }

  private detectRoleFromParent(parent: Element | null): 'user' | 'assistant' {
    if (!parent) return 'user';

    const testId = parent.getAttribute('data-testid');
    if (testId?.includes('assistant')) return 'assistant';
    if (testId?.includes('user')) return 'user';

    return 'user';
  }

  private detectRoleFromContent(content: string): 'user' | 'assistant' {
    const assistantPatterns = [
      /I understand/,
      /Let me/,
      /Based on/,
      /According to/,
      /In summary/,
      /To conclude/,
      /As an AI/,
    ];

    let assistantScore = 0;

    for (const pattern of assistantPatterns) {
      if (pattern.test(content)) assistantScore++;
    }

    if (assistantScore > 0) return 'assistant';
    return 'user';
  }

  private isUIBubble(element: Element): boolean {
    const uiPatterns = ['button', 'nav', 'header', 'footer', 'sidebar', 'toolbar', 'menu'];
    const className = element.className.toLowerCase();

    for (const pattern of uiPatterns) {
      if (className.includes(pattern)) return true;
    }

    const text = element.textContent?.trim() || '';
    if (text.length < 15 && (text === 'Copy' || text === 'Edit' || text === 'Delete')) {
      return true;
    }

    return false;
  }

  private isUIText(text: string): boolean {
    const uiTexts = ['Copy', 'Edit', 'Delete', 'Regenerate', 'Continue', 'Stop'];
    return uiTexts.includes(text.trim());
  }

  private generateUniqueId(role: string, content: string): string {
    let hash = 0;
    const str = content.substring(0, 200);
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return `${role}-${Date.now()}-${Math.abs(hash).toString(36)}`;
  }

  private isDuplicateMessage(messages: Message[], newMessage: Message): boolean {
    return messages.some(
      (m) =>
        m.role === newMessage.role &&
        m.content.substring(0, 200) === newMessage.content.substring(0, 200)
    );
  }

  private smartDeduplication(messages: Message[]): Message[] {
    const unique = new Map<string, Message>();

    for (const msg of messages) {
      const key = `${msg.role}_${msg.content.substring(0, 200)}`;
      const existing = unique.get(key);

      if (!existing) {
        unique.set(key, msg);
      } else if (msg.content.length > existing.content.length) {
        unique.set(key, msg);
      }
    }

    return Array.from(unique.values());
  }

  private sortByTimestamp(messages: Message[]): Message[] {
    return messages.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeA - timeB;
    });
  }

  private mergeAdjacentMessages(messages: Message[]): Message[] {
    const merged: Message[] = [];

    for (let i = 0; i < messages.length; i++) {
      const current = messages[i];
      const next = messages[i + 1];

      if (next && current.role === next.role && next.content.length < 200) {
        const mergedContent = current.content + '\n\n' + next.content;
        merged.push({ ...current, content: mergedContent });
        i++;
      } else {
        merged.push(current);
      }
    }

    return merged;
  }

  private ensureAlternatingRoles(messages: Message[]): Message[] {
    if (messages.length === 0) return messages;

    const corrected: Message[] = [];
    let expectedRole: 'user' | 'assistant' = messages[0]?.role === 'assistant' ? 'user' : 'user';

    for (let i = 0; i < messages.length; i++) {
      let msg = messages[i];

      if (msg.role !== expectedRole) {
        msg = { ...msg, role: expectedRole };
      }

      corrected.push(msg);
      expectedRole = msg.role === 'user' ? 'assistant' : 'user';
    }

    return corrected;
  }

  private calculateDetailedStats(messages: Message[]): {
    userCount: number;
    assistantCount: number;
    totalTokens: number;
    totalCharacters: number;
    totalCodeBlocks: number;
  } {
    let userCount = 0;
    let assistantCount = 0;
    let totalTokens = 0;
    let totalCharacters = 0;
    let totalCodeBlocks = 0;

    for (const msg of messages) {
      if (msg.role === 'user') userCount++;
      if (msg.role === 'assistant') assistantCount++;
      totalCharacters += msg.content.length;
      totalTokens += this.estimateTokens(msg.content);
      totalCodeBlocks += msg.metadata?.codeBlocks?.length || 0;
    }

    return { userCount, assistantCount, totalTokens, totalCharacters, totalCodeBlocks };
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

  private async extractSmartTitle(): Promise<string> {
    const titleSelectors = ['[data-testid="conversation-title"]', 'h1', '.text-lg.font-semibold'];

    for (const selector of titleSelectors) {
      const el = document.querySelector(selector);
      if (el?.textContent) {
        const title = el.textContent.trim();
        if (title.length > 3 && title.length < 100) {
          return title;
        }
      }
    }

    const firstUser = document.querySelector('[data-testid="user-message"]');
    if (firstUser) {
      const text = firstUser.textContent?.trim() || '';
      return text.length > 60 ? text.substring(0, 57) + '...' : text;
    }

    return document.title.replace(' - Claude', '').trim() || 'Claude Conversation';
  }
}
