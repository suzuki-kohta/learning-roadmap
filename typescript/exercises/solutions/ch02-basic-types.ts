/**
 * 第2章 演習 解答例
 */

export const Priority = {
  Low: "low",
  Medium: "medium",
  High: "high",
} as const;

export type Priority = (typeof Priority)[keyof typeof Priority];

export function normalizeId(id: string | number): string {
  if (typeof id === "number") {
    return `ID-${String(id).padStart(4, "0")}`;
  }
  return `ID-${id.trim().toUpperCase()}`;
}

export function priorityToWeight(priority: Priority): number {
  switch (priority) {
    case Priority.Low:
      return 1;
    case Priority.Medium:
      return 2;
    case Priority.High:
      return 3;
  }
}

export function averageOrNull(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const sum = values.reduce((acc, current) => acc + current, 0);
  return sum / values.length;
}
