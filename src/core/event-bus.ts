import { EventEmitter } from 'events';
import type { AppEvent } from '@/types/events';

export class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  publish<T extends AppEvent>(event: T) {
    this.emit(event.type, event);
  }

  subscribe<T extends AppEvent>(eventType: T['type'], handler: (event: T) => void) {
    this.on(eventType, handler);
  }

  unsubscribe<T extends AppEvent>(eventType: T['type'], handler: (event: T) => void) {
    this.off(eventType, handler);
  }
} 