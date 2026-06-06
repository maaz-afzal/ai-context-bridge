export class MessageObserver {
  private observer: MutationObserver | null = null;

  startObserving(callback: (mutations: MutationRecord[]) => void): void {
    this.observer = new MutationObserver(callback);
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  stopObserving(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
