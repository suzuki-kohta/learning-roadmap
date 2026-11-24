/**
 * 第2章サンプル: 基本の型・型推論・リテラル型・as const・ユニオン/交差型
 * 実行: node examples/02-basic-types.ts
 */

// 1. 型推論: let と const の違い
let mutableCount = 10; // number
const fixedLabel = "TypeScript"; // "TypeScript"（リテラル型）
mutableCount += 5;
console.log("[1] 型推論:", { mutableCount, fixedLabel });

// 2. 配列と noUncheckedIndexedAccess
const scores: readonly number[] = [85, 92, 78];
const topScore = scores[0]; // number | undefined
if (topScore !== undefined) {
  console.log("[2] 先頭スコア:", topScore);
}

// 3. 名前付きタプル
type Coordinate = readonly [x: number, y: number];
const point: Coordinate = [35.6812, 139.7671];
console.log("[3] 座標:", point);

// 4. enum の代替としての as const パターン
const TaskStatus = {
  Todo: "todo",
  InProgress: "in_progress",
  Done: "done",
} as const;

type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

function describeStatus(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.Todo:
      return "未着手";
    case TaskStatus.InProgress:
      return "進行中";
    case TaskStatus.Done:
      return "完了";
  }
}
console.log("[4] ステータス:", describeStatus(TaskStatus.InProgress));

// 5. ユニオン型と交差型
type UserId = string | number;

function formatUserId(id: UserId): string {
  if (typeof id === "number") {
    return `USR-${String(id).padStart(4, "0")}`;
  }
  return `USR-${id.toUpperCase()}`;
}

type Identifiable = { readonly id: string };
type Timestamped = { readonly createdAt: string };
type AuditRecord = Identifiable & Timestamped & { readonly action: string };

const record: AuditRecord = {
  id: formatUserId(42),
  createdAt: new Date().toISOString(),
  action: "LOGIN",
};
console.log("[5] 交差型レコード:", record);
