/**
 * 第5章 演習: ジェネリクス・keyof 制約・Utility Types
 */

/**
 * 問題 5-1:
 * オブジェクト配列から、指定したキーの値だけを抽出した配列を返してください。
 * 例: pluck([{ id: 1, name: "A" }, { id: 2, name: "B" }], "name") -> ["A", "B"]
 */
export function pluck<T, K extends keyof T>(
  items: readonly T[],
  key: K,
): T[K][] {
  void items;
  void key;
  throw new Error("TODO: pluck を実装してください");
}

/**
 * 問題 5-2:
 * オブジェクトから指定したキーだけを取り出した新しいオブジェクトを返してください（Pick のランタイム版）。
 * 元のオブジェクトを変更せず、新しいオブジェクトを返すこと。
 * 例: pick({ a: 1, b: 2, c: 3 }, ["a", "c"]) -> { a: 1, c: 3 }
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  source: T,
  keys: readonly K[],
): Pick<T, K> {
  void source;
  void keys;
  throw new Error("TODO: pick を実装してください");
}

/**
 * 問題 5-3:
 * 配列から重複を取り除いた新しい配列を返してください（元の順序を維持）。
 * keySelector で「何をもって同一とみなすか」を指定できるようにします。
 * 例: uniqueBy([{ id: 1, name: "A" }, { id: 1, name: "B" }], (x) => x.id) -> [{ id: 1, name: "A" }]
 */
export function uniqueBy<T, K>(
  items: readonly T[],
  keySelector: (item: T) => K,
): T[] {
  void items;
  void keySelector;
  throw new Error("TODO: uniqueBy を実装してください");
}
