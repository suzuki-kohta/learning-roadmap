/**
 * 第3章サンプル: 関数・オブジェクト設計・構造的部分型・Branded Types
 * 実行: node examples/03-functions-and-objects.ts
 */

// 1. オプションオブジェクト引数パターン
type SearchOptions = {
  readonly query: string;
  readonly limit?: number;
  readonly caseSensitive?: boolean;
};

function filterWords(
  words: readonly string[],
  { query, limit = 10, caseSensitive = false }: SearchOptions,
): string[] {
  const normalizedQuery = caseSensitive ? query : query.toLowerCase();
  return words
    .filter((word) => {
      const target = caseSensitive ? word : word.toLowerCase();
      return target.includes(normalizedQuery);
    })
    .slice(0, limit);
}

console.log(
  "[1] 検索結果:",
  filterWords(["TypeScript", "JavaScript", "Node.js", "Rust"], {
    query: "script",
    limit: 5,
  }),
);

// 2. 構造的部分型（Structural Subtyping）
type Point2D = { readonly x: number; readonly y: number };
type Point3D = { readonly x: number; readonly y: number; readonly z: number };

function distanceFromOrigin(p: Point2D): number {
  return Math.hypot(p.x, p.y);
}

const p3: Point3D = { x: 3, y: 4, z: 12 };
// Point3D は Point2D の全プロパティを満たすため渡せる
console.log("[2] 原点からの2D距離:", distanceFromOrigin(p3));

// 3. Branded Types（同じ string でも ID の取り違えをコンパイル時に防ぐ）
type Brand<T, Name extends string> = T & { readonly __brand: Name };
type UserId = Brand<string, "UserId">;
type OrderId = Brand<string, "OrderId">;

const createUserId = (raw: string): UserId => raw as UserId;
const createOrderId = (raw: string): OrderId => raw as OrderId;

function getOrderSummary(userId: UserId, orderId: OrderId): string {
  return `User(${userId}) -> Order(${orderId})`;
}

const uid = createUserId("u_100");
const oid = createOrderId("o_999");
console.log("[3] Branded Types:", getOrderSummary(uid, oid));
// getOrderSummary(oid, uid); // ← コメントを外すとコンパイルエラーになる！

// 4. インターフェース実装と JS ネイティブのプライベートフィールド（#）
interface Clock {
  nowIso(): string;
}

class FixedClock implements Clock {
  readonly #iso: string;

  constructor(iso: string) {
    this.#iso = iso;
  }

  nowIso(): string {
    return this.#iso;
  }
}

const clock: Clock = new FixedClock("2026-11-24T00:00:00.000Z");
console.log("[4] Clock:", clock.nowIso());
