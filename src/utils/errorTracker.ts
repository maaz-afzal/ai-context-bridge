export class ErrorTracker {
  private errors: Array<{ timestamp: Date; error: string; context: any }> = [];

  log(error: Error, context?: any) {
    this.errors.push({
      timestamp: new Date(),
      error: error.message,
      context: context,
    });

    // Send to background for storage
    chrome.runtime.sendMessage({
      action: 'logError',
      error: error.message,
      context,
    });
  }

  getErrors() {
    return this.errors;
  }
}
