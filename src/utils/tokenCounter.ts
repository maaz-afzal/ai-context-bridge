// Improved token estimation based on character count
// Most tokens are 4-5 characters on average, with special handling for:
// - Punctuation (counts as tokens)
// - Whitespace (multiple spaces = fewer tokens)
// - Code blocks (generally more tokens per character)
export const estimateTokens = (text: string): number => {
  if (!text || text.length === 0) return 0;

  // Count special tokens
  let tokenCount = 0;
  const words = text.split(/\s+/);

  for (const word of words) {
    if (!word) continue;

    // Each word is at least 1 token
    tokenCount += 1;

    // Add extra tokens for special characters and punctuation
    const specialChars = (word.match(/[^\w\s]/g) || []).length;
    tokenCount += Math.ceil(specialChars / 2);

    // Add tokens for word length
    if (word.length > 10) {
      tokenCount += Math.ceil((word.length - 10) / 4);
    }
  }

  return Math.max(1, tokenCount);
};

export const estimateConversationTokens = (conversation: {
  messages: { content: string }[];
}): number => conversation.messages.reduce((total, m) => total + estimateTokens(m.content), 0);
