import { vi } from 'vitest';
import {
  AuthBootstrapTimeoutError,
  withAuthBootstrapTimeout,
} from './authBootstrap';

describe('auth bootstrap timeout', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns an operation result when it completes in time', async () => {
    await expect(withAuthBootstrapTimeout(Promise.resolve('ready'), 100)).resolves.toBe('ready');
  });

  it('rejects a stalled operation after the configured timeout', async () => {
    vi.useFakeTimers();
    const stalledOperation = new Promise<string>(() => undefined);
    const result = withAuthBootstrapTimeout(stalledOperation, 100);
    const expectation = expect(result).rejects.toBeInstanceOf(AuthBootstrapTimeoutError);

    await vi.advanceTimersByTimeAsync(100);

    await expectation;
  });

  it('clears its timer after the operation settles', async () => {
    vi.useFakeTimers();

    await expect(withAuthBootstrapTimeout(Promise.resolve('ready'), 100)).resolves.toBe('ready');

    expect(vi.getTimerCount()).toBe(0);
  });
});
