import { Platform } from '../types';

export const detectPlatform = (url: string | undefined): Platform | null => {
  if (!url || typeof url !== 'string' || url.length === 0) return null;

  try {
    const host = new URL(url).hostname.toLowerCase();

    if (host.includes('chatgpt.com')) return 'chatgpt';
    if (host.includes('claude.ai')) return 'claude';
    if (host.includes('gemini.google.com')) return 'gemini';
    if (host.includes('grok.com') || host.includes('x.com')) return 'grok';
    if (host.includes('perplexity.ai')) return 'perplexity';
    if (host.includes('deepseek.com')) return 'deepseek';

    return null;
  } catch {
    return null;
  }
};
