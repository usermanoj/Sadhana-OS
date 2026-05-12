import { describe, expect, it, beforeEach } from 'vitest';
import { getItem, setItem } from './storage';

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

  it('returns fallback when key is missing', () => {
    expect(getItem('missing_key', 'fallback')).toBe('fallback');
  });

  it('handles invalid JSON gracefully', () => {
    localStorage.setItem('sadhana:invalid_json', '{ bad json');
    expect(getItem('invalid_json', 'fallback')).toBe('fallback');
  });
});
