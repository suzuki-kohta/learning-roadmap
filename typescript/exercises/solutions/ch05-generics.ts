/**
 * 第5章 演習 解答例
 */

export function pluck<T, K extends keyof T>(
  items: readonly T[],
  key: K,
): T[K][] {
  return items.map((item) => item[key]);
}

export function pick<T extends Record<string, unknown>, K extends keyof T>(
  source: T,
  keys: readonly K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = source[key];
  }
  return result;
}

export function uniqueBy<T, K>(
  items: readonly T[],
  keySelector: (item: T) => K,
): T[] {
  const seen = new Set<K>();
  const result: T[] = [];
  for (const item of items) {
    const key = keySelector(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}
