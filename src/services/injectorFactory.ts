import { Platform } from '../types';
import { injectChatGPT } from '../injectors/chatgpt';
import { injectClaude } from '../injectors/claude';
import { injectGemini } from '../injectors/gemini';
import { injectGrok } from '../injectors/grok';
import { injectPerplexity } from '../injectors/perplexity';
import { injectDeepSeek } from '../injectors/deepseek';

const injectorMap: Record<Platform, (text: string) => boolean> = {
  chatgpt: injectChatGPT,
  claude: injectClaude,
  gemini: injectGemini,
  grok: injectGrok,
  perplexity: injectPerplexity,
  deepseek: injectDeepSeek,
};

export const injectContext = (platform: Platform, text: string): boolean => {
  const injector = injectorMap[platform];
  if (!injector) return false;
  return injector(text);
};
