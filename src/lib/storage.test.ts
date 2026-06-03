import { describe, expect, it, beforeEach, vi } from 'vitest';
import { getItem, removeItem, setItem } from './storage';

describe('Storage Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('reads and writes correctly', () => {
    const data = { test: 'value' };
    setItem('test_key', data);
    expect(getItem('test_key', null)).toEqual(data);
    expect(localStorage.getItem('sadhana:test_key')).toBe(JSON.stringify(data));
  });

  it('removes stored values', () => {
    setItem('test_key', { test: 'value' });

    removeItem('test_key');

    expect(getItem('test_key', null)).toBeNull();
    expect(localStorage.getItem('sadhana:test_key')).toBeNull();
  });

  it('returns fallback when key is missing', () => {
    expect(getItem('missing_key', 'fallback')).toBe('fallback');
  });

  it('handles invalid JSON gracefully', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      localStorage.setItem('sadhana:invalid_json', '{ bad json');
      expect(getItem('invalid_json', 'fallback')).toBe('fallback');
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
