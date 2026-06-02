import '@testing-library/jest-dom';
import { vi } from 'vitest';

globalThis.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
} as unknown as typeof ResizeObserver;

Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  get() {
    return 800;
  },
});

Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
  configurable: true,
  get() {
    return 400;
  },
});

Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  get() {
    return 800;
  },
});

Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  get() {
    return 400;
  },
});

HTMLElement.prototype.getBoundingClientRect = vi.fn(() => ({
  x: 0,
  y: 0,
  width: 800,
  height: 400,
  top: 0,
  right: 800,
  bottom: 400,
  left: 0,
  toJSON: () => ({}),
}));
