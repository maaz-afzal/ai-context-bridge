export class FormatPreserver {
  preserveMarkdown(content: string): string {
    // Keep markdown formatting intact
    return content;
  }

  preserveCodeBlocks(content: string): string {
    // Extract and preserve code blocks
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    return codeBlocks.join('\n\n');
  }

  preserveImages(content: string): string {
    // Preserve image references
    const images = content.match(/!\[.*?\]\(.*?\)/g) || [];
    return images.join('\n');
  }
}
