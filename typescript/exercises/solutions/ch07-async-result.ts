/**
 * 第7章 演習 解答例
 */

export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  if (!result.ok) {
    return result;
  }
  return ok(fn(result.value));
}

export function safeJsonParse(raw: string): Result<unknown, string> {
  try {
    const parsed: unknown = JSON.parse(raw);
    return ok(parsed);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return err(message);
  }
}

export async function retry<T>(
  operation: () => Promise<T>,
  maxAttempts: number,
): Promise<Result<T, Error>> {
  const attempts = Math.max(1, Math.floor(maxAttempts));
  let lastError: Error = new Error("Operation failed");

  for (let i = 0; i < attempts; i += 1) {
    try {
      const value = await operation();
      return ok(value);
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  return err(lastError);
}
