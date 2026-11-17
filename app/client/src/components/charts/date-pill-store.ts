'use client';

import { useCallback, useSyncExternalStore } from 'react';

interface DatePillStore {
  count: number;
  listeners: Set<() => void>;
}

const stores = new WeakMap<HTMLElement, DatePillStore>();

function getStore(container: HTMLElement): DatePillStore {
  let store = stores.get(container);
  if (!store) {
    store = { count: 0, listeners: new Set() };
    stores.set(container, store);
  }
  return store;
}

export function registerDatePill(container: HTMLElement): () => void {
  const store = getStore(container);
  store.count += 1;
  for (const listener of store.listeners) {
    listener();
  }
  return () => {
    store.count -= 1;
    for (const listener of store.listeners) {
      listener();
    }
  };
}

const noopUnsubscribe = () => undefined;
const serverSnapshot = () => false;

export function useDatePillPresent(container: HTMLElement | null): boolean {
  const subscribe = useCallback(
    (listener: () => void) => {
      if (!container) {
        return noopUnsubscribe;
      }
      const store = getStore(container);
      store.listeners.add(listener);
      return () => {
        store.listeners.delete(listener);
      };
    },
    [container]
  );
  const getSnapshot = useCallback(() => (container ? getStore(container).count > 0 : false), [container]);
  return useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);
}
