export const AUTH_BOOTSTRAP_TIMEOUT_MS = 8_000;

export class AuthBootstrapTimeoutError extends Error {
  constructor() {
    super('Cloud account verification timed out.');
    this.name = 'AuthBootstrapTimeoutError';
  }
}

export function withAuthBootstrapTimeout<T>(
  operation: PromiseLike<T>,
  timeoutMs = AUTH_BOOTSTRAP_TIMEOUT_MS,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = globalThis.setTimeout(() => {
      reject(new AuthBootstrapTimeoutError());
    }, timeoutMs);

    Promise.resolve(operation).then(
      (value) => {
        globalThis.clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        globalThis.clearTimeout(timer);
        reject(error);
      },
    );
  });
}
