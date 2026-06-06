export const estimateTokens = (text: string): number => {
  if (!text) return 0;
  const words = text.split(/\s+/);
  let count = 0;
  for (const word of words) {
    if (!word) continue;
    count += 1;
    const special = (word.match(/[^\w\s]/g) ?? []).length;
    count += Math.ceil(special / 2);
    if (word.length > 10) count += Math.ceil((word.length - 10) / 4);
  }
  return Math.max(1, count);
};

export const estimateConversationTokens = (conversation: {
  messages: { content: string }[];
}): number => conversation.messages.reduce((total, m) => total + estimateTokens(m.content), 0);
