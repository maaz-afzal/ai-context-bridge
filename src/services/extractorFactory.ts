import { ChatExtractor } from '../types';
import { ChatGPTExtractor } from '../extractors/chatgpt';
import { ClaudeExtractor } from '../extractors/claude';
import { GeminiExtractor } from '../extractors/gemini';
import { GrokExtractor } from '../extractors/grok';
import { PerplexityExtractor } from '../extractors/perplexity';
import { DeepSeekExtractor } from '../extractors/deepseek';

const extractorMap: Record<string, new () => ChatExtractor> = {
  chatgpt: ChatGPTExtractor,
  claude: ClaudeExtractor,
  gemini: GeminiExtractor,
  grok: GrokExtractor,
  perplexity: PerplexityExtractor,
  deepseek: DeepSeekExtractor,
};

export const getExtractor = (platform: string): ChatExtractor | null => {
  const Extractor = extractorMap[platform];
  if (Extractor) {
    return new Extractor();
  }
  console.warn(`No extractor found for platform: ${platform}`);
  return null;
};
