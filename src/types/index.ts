export type Platform = 'chatgpt' | 'claude' | 'gemini' | 'grok' | 'perplexity' | 'deepseek';

export interface CodeBlock {
  language: string;
  code: string;
  lineCount: number;
}

export interface Attachment {
  type: 'image' | 'file' | 'link';
  url?: string;
  name?: string;
  mimeType?: string;
  size?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  metadata?: {
    attachments?: Attachment[];
    codeBlocks?: CodeBlock[];
    mentions?: string[];
    links?: string[];
    model?: string;
    tokens?: number;
    parentId?: string;
    isStreaming?: boolean;
    edited?: boolean;
  };
}

export interface Conversation {
  platform: Platform;
  title?: string;
  exportedAt: string;
  messages: Message[];
  metadata?: {
    totalTokens?: number;
    messageCount?: number;
    characterCount?: number;
    codeBlockCount?: number;
  };
}

export interface ChatExtractor {
  detect(): boolean;
  extractConversation(): Promise<Conversation>;
}

export interface CompressedConversation {
  full: Conversation;
  balanced: Conversation;
  aggressive: string;
}

export type ExportFormat = 'json' | 'markdown' | 'plaintext' | 'continuationPrompt';

export interface Settings {
  compressionMode: 'exact' | 'balanced' | 'aggressive';
  defaultExportFormat: ExportFormat;
  autoInject: boolean;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}