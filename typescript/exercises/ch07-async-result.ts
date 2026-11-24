/**
 * 第7章 演習: Result<T, E> パターンと非同期処理
 */

export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/**
 * 問題 7-1:
 * Result<T, E> が ok の場合のみ fn を適用して新しい Result<U, E> を返す mapResult を実装してください。
 * err の場合はそのまま元の err を返します。
 */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  void result;
  void fn;
  throw new Error("TODO: mapResult を実装してください");
}

/**
 * 問題 7-2:
 * JSON 文字列を安全にパースし、Result<unknown, string> を返す関数を実装してください。
 * - パース成功時: ok(parsedValue)
 * - パース失敗時: err(errorMessage)（Error なら error.message、それ以外は String(error)）
 */
export function safeJsonParse(raw: string): Result<unknown, string> {
  void raw;
  throw new Error("TODO: safeJsonParse を実装してください");
}

/**
 * 問題 7-3:
 * 非同期関数 operation を最大 maxAttempts 回まで試行し、成功したら ok(value) を返す retry を実装してください。
 * - maxAttempts が 1 未満の場合は 1 回として扱うか、エラーを返すのではなく最低 1 回は実行すること
 * - 全試行が失敗した場合は、最後のエラーを err(lastError) として返す（throw しないこと）
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxAttempts: number,
): Promise<Result<T, Error>> {
  void operation;
  void maxAttempts;
  throw new Error("TODO: retry を実装してください");
}
