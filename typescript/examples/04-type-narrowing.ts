/**
 * 第4章サンプル: 型ガード・判別可能ユニオン・網羅性チェック・satisfies
 * 実行: node examples/04-type-narrowing.ts
 */

// 1. 判別可能ユニオン + never による網羅性チェック
type Shape =
  | { readonly kind: "circle"; readonly radius: number }
  | { readonly kind: "rectangle"; readonly width: number; readonly height: number }
  | { readonly kind: "triangle"; readonly base: number; readonly height: number };

function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}

function calcArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default:
      return assertNever(shape);
  }
}

console.log("[1] 面積計算:", {
  circle: calcArea({ kind: "circle", radius: 10 }).toFixed(2),
  rectangle: calcArea({ kind: "rectangle", width: 4, height: 5 }),
  triangle: calcArea({ kind: "triangle", base: 6, height: 3 }),
});

// 2. unknown とユーザー定義型ガード（Type Predicate）
type UserPayload = {
  readonly id: number;
  readonly name: string;
  readonly roles: readonly string[];
};

function isUserPayload(value: unknown): value is UserPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    typeof obj["id"] === "number" &&
    typeof obj["name"] === "string" &&
    Array.isArray(obj["roles"]) &&
    obj["roles"].every((role) => typeof role === "string")
  );
}

const rawJsonList = [
  '{"id": 1, "name": "Alice", "roles": ["admin"]}',
  '{"id": "bad", "name": "Bob"}',
];

for (const raw of rawJsonList) {
  const parsed: unknown = JSON.parse(raw);
  if (isUserPayload(parsed)) {
    console.log("[2] 有効なユーザー:", parsed.name, parsed.roles);
  } else {
    console.log("[2] 不正なペイロードを安全に検出:", raw);
  }
}

// 3. satisfies 演算子（構造検証しつつリテラル型・キー補完を維持）
type RouteDef = {
  readonly method: "GET" | "POST";
  readonly path: string;
  readonly requiresAuth: boolean;
};

const routes = {
  health: { method: "GET", path: "/health", requiresAuth: false },
  createTodo: { method: "POST", path: "/todos", requiresAuth: true },
} as const satisfies Record<string, RouteDef>;

// routes.createTodo.path は "/todos" リテラル型として補完される！
console.log("[3] satisfies ルート定義:", routes.health.path, routes.createTodo.method);
