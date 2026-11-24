/**
 * 第2章 演習: 基本の型・リテラル型・ユニオン型・安全な配列操作
 */

export const Priority = {
  Low: "low",
  Medium: "medium",
  High: "high",
} as const;

export type Priority = (typeof Priority)[keyof typeof Priority];

/**
 * 問題 2-1:
 * ユーザーID（string または number）を受け取り、統一フォーマットの文字列に変換してください。
 * - number の場合: 4桁ゼロ埋めして "ID-0042" のように返す（負の数や小数でない前提）
 * - string の場合: 前後の空白を除去（trim）し、大文字にして "ID-ABC" のように返す
 */
export function normalizeId(id: string | number): string {
  void id;
  throw new Error("TODO: normalizeId を実装してください");
}

/**
 * 問題 2-2:
 * 優先度（Priority）を受け取り、数値スコアに変換してください。
 * - "low" -> 1
 * - "medium" -> 2
 * - "high" -> 3
 */
export function priorityToWeight(priority: Priority): number {
  void priority;
  throw new Error("TODO: priorityToWeight を実装してください");
}

/**
 * 問題 2-3:
 * 数値配列を受け取り、平均値を返してください。
 * 配列が空の場合は null を返してください（NaN を返さないこと）。
 */
export function averageOrNull(values: readonly number[]): number | null {
  void values;
  throw new Error("TODO: averageOrNull を実装してください");
}
