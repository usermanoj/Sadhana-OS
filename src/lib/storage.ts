/**
 * LocalStorage utilities for Sadhana OS
 */

const PREFIX = 'sadhana:';

export function getItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(`${PREFIX}${key}`);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return fallback;
  }
}

export function setItem(key: string, value: unknown): void {
  try {
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
}
