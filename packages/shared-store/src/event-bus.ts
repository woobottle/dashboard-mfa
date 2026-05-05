import { useSyncExternalStore } from 'react';

declare global {
  interface Window {
    __shared_store__: Record<string, unknown>;
  }
}

export const createSharedValue = <T>(key: string, initialValue: T) => {
  const eventName = `shared:${key}`;
  const store = window.__shared_store__ ?? (window.__shared_store__ = {});
  if (!(key in store)) {
    store[key] = initialValue;
  }

  const get = () => store[key] as T;
  const set = (value: T) => {
    store[key] = value;
    window.dispatchEvent(new CustomEvent(eventName, { detail: value }));
  };
  const subscribe = (callback: () => void) => {
    window.addEventListener(eventName, callback);
    return () => {
      window.removeEventListener(eventName, callback);
    };
  };
  const useValue = () => {
    const value = useSyncExternalStore(subscribe, get, () => initialValue)
    return value;
  }

  return { get, set, subscribe, useValue };
};

export const periodEventBus = createSharedValue('period', '7');
export const regionEventBus = createSharedValue('region', 'seoul');
export const userIdEventBus = createSharedValue('userId', '');