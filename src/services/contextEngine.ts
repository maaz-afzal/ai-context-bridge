import { Conversation, CompressedConversation, ExportFormat } from '../types';

export const compressConversation = (
  conversation: Conversation | null | undefined,
  mode: 'exact' | 'balanced' | 'aggressive'
): CompressedConversation => {
  if (!conversation || !conversation.messages || conversation.messages.length === 0) {
    console.warn('Invalid conversation for compression');
    return {
      full: { platform: conversation?.platform || 'chatgpt', exportedAt: new Date().toISOString(), messages: [] },
      balanced: { platform: conversation?.platform || 'chatgpt', exportedAt: new Date().toISOString(), messages: [] },
      aggressive: 'No conversation data available.',
    };
  }

  const full = conversation;

  // Balanced mode: smart compression - remove repetitive/similar messages
  const balanced = smartCompressConversation(conversation);

  // Aggressive mode: generate smart summary string
  const aggressive = generateSmartSummary(conversation);

  console.log(`📊 Compression Stats for ${mode} mode:`);
  console.log(`   Exact:      ${full.messages.length} messages`);
  console.log(`   Balanced:   ${balanced.messages.length} messages (saved ${full.messages.length - balanced.messages.length} msgs)`);
  console.log(`   Aggressive: summary (1 summary)`);

  return { full, balanced, aggressive };
};

// Smart compression - removes similar/repetitive messages, keeps unique content
const smartCompressConversation = (conversation: Conversation): Conversation => {
  const messages = [...conversation.messages];
  const compressedMessages: any[] = [];

  for (let i = 0; i < messages.length; i++) {
    const currentMsg = messages[i];
    const currentContent = currentMsg.content.trim().toLowerCase();

    // Skip very short acknowledgment messages (user saying "ok", "thanks", etc.)
    const shortAcks = [
      'ok',
      'thanks',
      'got it',
      'okay',
      'sure',
      'great',
      'nice',
      'cool',
      'yeah',
      'yes',
      'no',
      'thanks!',
      'thank you',
      '👍',
      '👎',
      'ok thanks',
    ];
    if (
      currentContent.length < 25 &&
      shortAcks.some((ack) => currentContent === ack || currentContent.includes(ack))
    ) {
      if (!currentContent.includes('?')) {
        console.log(`  📝 Removing short ack: "${currentContent.substring(0, 30)}"`);
        continue;
      }
    }

    // Check if this message is similar to previous messages
    let isSimilar = false;
    let similarityScore = 0;

    for (let j = 0; j < compressedMessages.length; j++) {
      const prevMsg = compressedMessages[j];
      const prevContent = prevMsg.content.trim().toLowerCase();

      // Same role check
      if (prevMsg.role === currentMsg.role) {
        // Calculate similarity
        const similarity = calculateTextSimilarity(currentContent, prevContent);

        if (similarity > 0.7) {
          isSimilar = true;
          similarityScore = similarity;
          break;
        }
      }
    }

    if (isSimilar) {
      console.log(
        `  🔄 Skipping similar message (${Math.round(similarityScore * 100)}% similar): "${currentContent.substring(0, 50)}..."`
      );
      continue;
    }

    compressedMessages.push(currentMsg);
  }

  console.log(`  ✨ Compressed from ${messages.length} to ${compressedMessages.length} messages`);

  return {
    ...conversation,
    messages: compressedMessages,
  };
};

// Calculate similarity between two strings (0-1)
const calculateTextSimilarity = (str1: string, str2: string): number => {
  // If both are very short, check exact match
  if (str1.length < 30 && str2.length < 30) {
    return str1 === str2 ? 1 : 0;
  }

  // Get first 100 chars for comparison
  const s1 = str1.substring(0, 100);
  const s2 = str2.substring(0, 100);

  // Check word overlap
  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));

  let commonWords = 0;
  for (const word of words1) {
    if (word.length > 3 && words2.has(word)) {
      commonWords++;
    }
  }

  const totalUniqueWords = words1.size + words2.size;
  const wordSimilarity = totalUniqueWords > 0 ? (commonWords * 2) / totalUniqueWords : 0;

  // Check if one is a subset of the other
  const isSubset = s1.includes(s2) || s2.includes(s1);

  return isSubset ? Math.max(wordSimilarity, 0.8) : wordSimilarity;
};

// Generate comprehensive summary for aggressive mode
const generateSmartSummary = (conversation: Conversation): string => {
  const messages = conversation.messages;
  const userMessages = messages.filter((m: any) => m.role === 'user');
  const assistantMessages = messages.filter((m: any) => m.role === 'assistant');

  // Extract all unique questions
  const questions: string[] = [];
  for (const msg of userMessages) {
    const qMatches = msg.content.match(/[^.!?]*\?/g);
    if (qMatches) {
      for (const q of qMatches) {
        const cleanQ = q.trim();
        if (!questions.includes(cleanQ) && cleanQ.length > 10) {
          questions.push(cleanQ);
        }
      }
    }
  }

  // Extract key answers (first sentence of long responses)
  const keyAnswers: string[] = [];
  for (const msg of assistantMessages) {
    if (msg.content.length > 100) {
      const sentences = msg.content.split(/[.!?]+/);
      const firstSentence = sentences[0]?.trim();
      if (firstSentence && firstSentence.length > 40 && firstSentence.length < 300) {
        if (!keyAnswers.includes(firstSentence)) {
          keyAnswers.push(firstSentence);
        }
      }
    }
  }

  // Extract main topics from conversation
  const allText = messages
    .map((m: any) => m.content)
    .join(' ')
    .toLowerCase();
  const topics: string[] = [];
  const topicKeywords = [
    'javascript',
    'python',
    'react',
    'api',
    'database',
    'function',
    'code',
    'programming',
    'business',
    'marketing',
    'design',
    'research',
    'education',
    'health',
    'technology',
  ];
  for (const keyword of topicKeywords) {
    if (allText.includes(keyword) && !topics.includes(keyword)) {
      topics.push(keyword);
    }
  }

  // Build formatted summary
  let summary = '';

  summary += `╔══════════════════════════════════════════════════════════════╗\n`;
  summary += `║                    CONVERSATION SUMMARY                      ║\n`;
  summary += `╚══════════════════════════════════════════════════════════════╝\n\n`;

  summary += `📊 STATISTICS\n`;
  summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  summary += `  Platform:      ${conversation.platform}\n`;
  summary += `  Total msgs:    ${messages.length}\n`;
  summary += `  User:          ${userMessages.length}\n`;
  summary += `  Assistant:     ${assistantMessages.length}\n`;
  if (topics.length > 0) {
    summary += `  Main Topics:   ${topics.slice(0, 5).join(', ')}\n`;
  }
  summary += `\n`;

  if (questions.length > 0) {
    summary += `❓ KEY QUESTIONS ASKED\n`;
    summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    questions.slice(0, 6).forEach((q, i) => {
      const shortQ = q.length > 80 ? q.substring(0, 77) + '...' : q;
      summary += `  ${i + 1}. ${shortQ}\n`;
    });
    summary += `\n`;
  }

  if (keyAnswers.length > 0) {
    summary += `💡 KEY INFORMATION PROVIDED\n`;
    summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    keyAnswers.slice(0, 5).forEach((answer, i) => {
      const shortAnswer = answer.length > 90 ? answer.substring(0, 87) + '...' : answer;
      summary += `  ${i + 1}. ${shortAnswer}\n`;
    });
    summary += `\n`;
  }

  // Conversation flow
  summary += `🔄 CONVERSATION FLOW\n`;
  summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  let currentTopic = '';
  let topicCount = 0;
  for (let i = 0; i < Math.min(messages.length, 15); i++) {
    if (messages[i].role === 'user') {
      const topic = messages[i].content.substring(0, 40);
      if (topic !== currentTopic) {
        if (currentTopic) {
          summary += `  • ${currentTopic}${topicCount > 1 ? ` (${topicCount})` : ''}\n`;
        }
        currentTopic = topic + (messages[i].content.length > 40 ? '...' : '');
        topicCount = 1;
      } else {
        topicCount++;
      }
    } else {
      topicCount++;
    }
  }
  if (currentTopic) {
    summary += `  • ${currentTopic}${topicCount > 1 ? ` (${topicCount})` : ''}\n`;
  }
  summary += `\n`;

  // Current status
  const lastUserMsg = userMessages[userMessages.length - 1];
  const lastAssistantMsg = assistantMessages[assistantMessages.length - 1];
  summary += `📌 CURRENT STATUS\n`;
  summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  if (lastUserMsg?.content.includes('?')) {
    const lastQ = lastUserMsg.content.match(/[^.!?]*\?/);
    if (lastQ) {
      const shortQ = lastQ[0].length > 70 ? lastQ[0].substring(0, 67) + '...' : lastQ[0];
      summary += `  ⚠️ Pending: "${shortQ}"\n`;
    }
  } else if (lastAssistantMsg) {
    summary += `  ✓ Last response from assistant\n`;
  } else {
    summary += `  ✓ Ready to continue\n`;
  }

  summary += `\n`;
  summary += `╔══════════════════════════════════════════════════════════════╗\n`;
  summary += `║  Continue as assistant, maintaining context and answering   ║\n`;
  summary += `║  any pending questions from the conversation.               ║\n`;
  summary += `╚══════════════════════════════════════════════════════════════╝\n`;

  return summary;
};

export const formatConversation = (
  conversation: Conversation | string | null | undefined,
  format: ExportFormat
): string => {
  if (!conversation) {
    return 'No conversation data available. Please extract a conversation first.';
  }

  if (typeof conversation === 'string') return conversation;

  if (!conversation.messages || conversation.messages.length === 0) {
    return 'No messages in this conversation.';
  }

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
    .map((m: any) => {
      const ts = m.timestamp ? ` *(${new Date(m.timestamp).toLocaleString()})*` : '';
      return `### ${m.role === 'user' ? '👤 User' : '🤖 Assistant'}${ts}\n\n${m.content}`;
    })
    .join('\n\n---\n\n');

const toPlaintext = (c: Conversation): string =>
  c.messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

const toContinuationPrompt = (conversation: Conversation): string => {
  const messages = conversation.messages;
  const userMessages = messages.filter((m: any) => m.role === 'user');
  const assistantMessages = messages.filter((m: any) => m.role === 'assistant');

  let prompt = '';

  prompt += `# CONTINUATION PROMPT\n\n`;
  prompt += `## Context\n`;
  prompt += `- Platform: ${conversation.platform}\n`;
  prompt += `- Total messages: ${messages.length}\n`;
  prompt += `- User: ${userMessages.length} | Assistant: ${assistantMessages.length}\n\n`;

  prompt += `## Summary\n`;
  prompt += generateSmartSummary(conversation);
  prompt += `\n`;

  // Last 4 messages
  const lastMsgs = messages.slice(-4);
  prompt += `## Recent Messages\n\n`;
  for (const msg of lastMsgs) {
    const role = msg.role === 'user' ? 'USER' : 'ASSISTANT';
    const content = msg.content.length > 600 ? msg.content.substring(0, 600) + '...' : msg.content;
    prompt += `**${role}:**\n${content}\n\n`;
  }

  prompt += `## Instructions\n`;
  prompt += `Continue as the ASSISTANT. Maintain context and answer any pending questions.\n`;

  return prompt;
};
