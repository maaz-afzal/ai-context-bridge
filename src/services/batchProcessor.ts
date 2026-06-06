import { Conversation } from '../types';
import JSZip from 'jszip'; // Install: npm install jszip

export class BatchProcessor {
  async exportMultiple(conversations: Conversation[]): Promise<Blob> {
    const zip = new JSZip();

    for (const conv of conversations) {
      const fileName = `${conv.platform}_${conv.exportedAt}.json`;
      zip.file(fileName, JSON.stringify(conv, null, 2));
    }

    return await zip.generateAsync({ type: 'blob' });
  }

  async importMultiple(file: File): Promise<Conversation[]> {
    const zip = await JSZip.loadAsync(file);
    const conversations: Conversation[] = [];

    for (const [name, content] of Object.entries(zip.files)) {
      if (name.endsWith('.json')) {
        const json = await content.async('string');
        conversations.push(JSON.parse(json));
      }
    }

    return conversations;
  }
}
