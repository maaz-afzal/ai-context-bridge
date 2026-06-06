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
  console.log(`Injecting context into ${platform}...`);
  console.log(`Text length: ${text.length} characters`);

  const injector = injectorMap[platform];
  if (!injector) {
    console.error(`No injector found for platform: ${platform}`);
    return false;
  }

  const result = injector(text);
  console.log(`Injection ${result ? 'successful' : 'failed'}`);
  return result;
};
