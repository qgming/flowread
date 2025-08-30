type EventCallback = (...args: any[]) => void;

class EventBus {
  private events: { [key: string]: EventCallback[] } = {};

  on(event: string, callback: EventCallback): () => void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);

    // 返回取消订阅的函数
    return () => {
      this.off(event, callback);
    };
  }

  off(event: string, callback: EventCallback): void {
    if (!this.events[event]) return;
    
    const index = this.events[event].indexOf(callback);
    if (index > -1) {
      this.events[event].splice(index, 1);
    }
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return;
    
    this.events[event].forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  removeAllListeners(event?: string): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

export const eventBus = new EventBus();

// 定义常用事件名称
export const EVENTS = {
  FAVORITES_CHANGED: 'favorites_changed',
  WORD_ADDED_TO_FAVORITES: 'word_added_to_favorites',
  WORD_REMOVED_FROM_FAVORITES: 'word_removed_from_favorites',
} as const;
