import { Conversation, CompressedConversation, ExportFormat } from '../types';

// ─── Compression ──────────────────────────────────────────────────────────────

export const compressConversation = (
  conversation: Conversation | null | undefined,
  _mode: 'exact' | 'balanced' | 'aggressive'
): CompressedConversation => {
  const empty: Conversation = {
    platform: conversation?.platform ?? 'chatgpt',
    exportedAt: new Date().toISOString(),
    messages: [],
  };

  if (!conversation?.messages?.length) {
    return { full: empty, balanced: empty, aggressive: 'No conversation data available.' };
  }

  return {
    full: conversation,
    balanced: balanceCompress(conversation),
    aggressive: aggressiveSummary(conversation),
  };
};

const SHORT_ACKS = new Set([
  'ok',
  'okay',
  'thanks',
  'thank you',
  'got it',
  'sure',
  'great',
  'cool',
  'yeah',
  'yes',
  'no',
  'nice',
  'thanks!',
  '👍',
  '👎',
]);

const balanceCompress = (conversation: Conversation): Conversation => {
  const kept = conversation.messages.filter((msg) => {
    const lower = msg.content.toLowerCase().trim();
    // Keep anything with a question or substantial length
    if (lower.includes('?') || lower.length > 40) return true;
    // Drop short ack-only messages
    return !SHORT_ACKS.has(lower);
  });

  // Remove near-duplicates (same role, >70% word overlap with a previous message)
  const result: typeof kept = [];
  for (const msg of kept) {
    const isDuplicate = result.some(
      (prev) => prev.role === msg.role && wordOverlap(prev.content, msg.content) > 0.7
    );
    if (!isDuplicate) result.push(msg);
  }

  return { ...conversation, messages: result };
};

const wordOverlap = (a: string, b: string): number => {
  const words = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );
  const wa = words(a.substring(0, 300));
  const wb = words(b.substring(0, 300));
  let common = 0;
  wa.forEach((w) => {
    if (wb.has(w)) common++;
  });
  const total = wa.size + wb.size;
  return total > 0 ? (common * 2) / total : 0;
};

const aggressiveSummary = (conversation: Conversation): string => {
  const { messages, platform } = conversation;
  const user = messages.filter((m) => m.role === 'user');
  const asst = messages.filter((m) => m.role === 'assistant');

  const questions = user
    .flatMap((m) => m.content.match(/[^.!?]*\?/g) ?? [])
    .filter((q) => q.trim().length > 10)
    .slice(0, 6);

  const keyPoints = asst
    .filter((m) => m.content.length > 100)
    .map((m) => m.content.split(/[.!?]/)[0]?.trim() ?? '')
    .filter((s) => s.length > 40)
    .slice(0, 5);

  const lastUser = user[user.length - 1];
  const pendingQ = lastUser?.content.match(/[^.!?]*\?/)?.[0]?.trim();

  let out = `CONVERSATION SUMMARY\n`;
  out += `${'─'.repeat(60)}\n`;
  out += `Platform: ${platform} | Messages: ${messages.length} (${user.length} user / ${asst.length} assistant)\n\n`;

  if (questions.length) {
    out += `KEY QUESTIONS\n`;
    questions.forEach((q, i) => {
      out += `  ${i + 1}. ${q.trim()}\n`;
    });
    out += '\n';
  }

  if (keyPoints.length) {
    out += `KEY POINTS\n`;
    keyPoints.forEach((p, i) => {
      out += `  ${i + 1}. ${p}\n`;
    });
    out += '\n';
  }

  out += `STATUS\n`;
  out += pendingQ ? `  Pending: "${pendingQ}"\n` : `  Ready to continue.\n`;

  out += `\n${'─'.repeat(60)}\n`;
  out += `Continue as assistant, maintaining context from above.\n`;

  return out;
};

// ─── Formatting ───────────────────────────────────────────────────────────────

export const formatConversation = (
  conversation: Conversation | string | null | undefined,
  format: ExportFormat
): string => {
  if (!conversation) return 'No conversation data available.';
  if (typeof conversation === 'string') return conversation;
  if (!conversation.messages?.length) return 'No messages in this conversation.';

  switch (format) {
    case 'json':
      return JSON.stringify(conversation, null, 2);
    case 'markdown':
      return toMarkdown(conversation);
    case 'plaintext':
      return toPlaintext(conversation);
    case 'continuationPrompt':
      return toContinuationPrompt(conversation);
    default:
      return JSON.stringify(conversation, null, 2);
  }
};

const toMarkdown = (c: Conversation): string =>
  c.messages
    .map((m) => {
      const heading = m.role === 'user' ? '### 👤 User' : '### 🤖 Assistant';
      return `${heading}\n\n${m.content}`;
    })
    .join('\n\n---\n\n');

const toPlaintext = (c: Conversation): string =>
  c.messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

const toContinuationPrompt = (conversation: Conversation): string => {
  const { messages } = conversation;
  const recent = messages.slice(-4);

  let out = `# CONTINUATION PROMPT\n\n`;
  out += `Platform: ${conversation.platform} | Messages: ${messages.length}\n\n`;
  out += aggressiveSummary(conversation);
  out += `\n## Recent Messages\n\n`;

  recent.forEach((m) => {
    const role = m.role === 'user' ? 'USER' : 'ASSISTANT';
    const content = m.content.length > 600 ? m.content.substring(0, 600) + '...' : m.content;
    out += `**${role}:**\n${content}\n\n`;
  });

  out += `## Instructions\nContinue as ASSISTANT. Maintain context and answer any pending questions.\n`;
  return out;
};
