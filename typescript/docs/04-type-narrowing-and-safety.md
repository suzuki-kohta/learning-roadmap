# 第4章: 型の絞り込みと安全性（Type Narrowing）

> **この章のゴール**
> - TypeScript の制御フロー解析（Control Flow Analysis）による型の絞り込みを使いこなせるようになる
> - **判別可能ユニオン（Discriminated Unions）** と **`never` を使った網羅性チェック** を設計の武器にできる
> - `unknown`、ユーザー定義型ガード（`is`）、`satisfies` 演算子を正しく使い分けられるようになる
>
> **対応ファイル**: [examples/04-type-narrowing.ts](../examples/04-type-narrowing.ts) / [exercises/ch04-type-narrowing.ts](../exercises/ch04-type-narrowing.ts)

---

## Type Narrowing（型の絞り込み）とは？

広い型（例：`string | number | null`）を、条件分岐によってより具体的な型（例：`string`）へと狭めていく仕組みを **Narrowing（絞り込み）** と呼びます。

TypeScript は `if` / `switch` / `return` / `throw` の流れを解析し、ブロック内の型を自動で絞り込みます。

### 標準で使える主な型ガード

| 構文 | 用途 | 例 |
| --- | --- | --- |
| `typeof x === "..."` | プリミティブ型の判定 | `typeof v === "string"` |
| `x instanceof Class` | クラスインスタンス判定 | `err instanceof Error` |
| `"prop" in x` | オブジェクトのプロパティ有無 | `"email" in user` |
| `Array.isArray(x)` | 配列かどうかの判定 | `Array.isArray(data)` |
| `x !== null && x !== undefined` | null / undefined の除外 | `if (user != null)` |

```ts
function formatInput(value: string | number | Date | null): string {
  if (value === null) {
    return "(empty)";
  }
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number") {
    return value.toFixed(2);
  }
  // ここでは自動的に Date に絞り込まれている！
  return value.toISOString();
}
```

---

## 判別可能ユニオン（Discriminated Unions）— TypeScript 最強の設計パターン

TypeScript の実務設計で最も重要なパターンの1つです。ユニオンに含まれる各オブジェクト型に**共通のリテラル型プロパティ（タグ / 判別子）**を持たせます。

### ❌ 悪い設計（曖昧なオプショナルプロパティの山）

```ts
// どの状態のときにどのプロパティが存在するのか型から分からない！
type BadApiState = {
  isLoading: boolean;
  data?: string;
  error?: string;
};
// isLoading: true なのに error もある、といった「あり得ない状態」が作れてしまう
```

### ✅ 良い設計（判別可能ユニオンで「あり得ない状態」を型で禁止する）

```ts
type ApiState<T> =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "success"; readonly data: T }
  | { readonly status: "error"; readonly message: string };

function renderState(state: ApiState<string>): string {
  switch (state.status) {
    case "idle":
      return "待機中";
    case "loading":
      return "読み込み中...";
    case "success":
      // ここでは state.data が確実に string として存在する！
      return `結果: ${state.data}`;
    case "error":
      // ここでは state.message が確実に string として存在する！
      return `エラー: ${state.message}`;
  }
}
```

---

## `never` 型と網羅性チェック（Exhaustiveness Checking）

`never` は「決して到達しない・値が存在し得ない」を表す型です。判別可能ユニオンの `switch` 文の `default` 節に `never` を使うと、**将来ユニオンに新しいケースを追加したときに、処理漏れをコンパイルエラーで検知**できます。

```ts
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}

type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rectangle"; width: number; height: number }
  | { kind: "triangle"; base: number; height: number };

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default:
      // もし Shape に "square" を追加してここを書き忘れると、
      // 「'square' を 'never' に割り当てられない」とコンパイルエラーになる！
      return assertNever(shape);
  }
}
```

---

## `unknown` とユーザー定義型ガード（`value is T`）

### `unknown` とは？

`any` と同じく「どんな値でも代入できる」型ですが、**型を絞り込むまで一切の操作（プロパティアクセスや関数呼び出し）を禁止する**安全な型です。

- `JSON.parse()` の結果
- `try { ... } catch (err)` の `err`（`strict: true` 下では `unknown` になる）
- 外部 API のレスポンス

これらはいったん `unknown` として受け取り、**ユーザー定義型ガード（Type Predicate）**で検証してから使います。

```ts
type User = {
  id: number;
  name: string;
};

// 戻り値に `value is User` と書くと、true を返した分岐内で value の型が User に絞り込まれる
function isUser(value: unknown): value is User {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record["id"] === "number" && typeof record["name"] === "string";
}

function parseUserJson(raw: string): User | null {
  const parsed: unknown = JSON.parse(raw);
  if (isUser(parsed)) {
    return parsed; // 型は確実に User！
  }
  return null;
}
```

### ⚠️ `as`（型アサーション）の乱用は危険

`const user = JSON.parse(raw) as User;` と書くとコンパイラは黙りますが、実行時に `name` が欠けていても一切エラーにならず、後続処理で突然クラッシュします。`as` は「コンパイラより人間の方が確実に型を知っている例外的な場面」に限定し、外部データには必ず型ガードやバリデーションライブラリ（Zod / Valibot 等）を使いましょう。

### アサーション関数（`asserts value is T`）

不正な値なら即座に例外を投げ、正常なら以降の行すべてで型を絞り込みたいときに使います。

```ts
function assertNonEmptyString(
  value: unknown,
  fieldName: string,
): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }
}

function handleUsername(raw: unknown) {
  assertNonEmptyString(raw, "username");
  // ここ以降、raw の型は string になっている！
  return raw.trim().toLowerCase();
}
```

---

## `satisfies` 演算子（TypeScript 4.9+）

「型チェックはしてほしいけれど、推論された具体的なリテラル型・キー情報も失いたくない」というジレンマを解決する演算子です。

```ts
type RouteConfig = Record<string, { path: string; auth: boolean }>;

// ❌ 型注釈を付けると、routes.home のような具体的なキー補完が消えてしまう
const routesWithAnnotation: RouteConfig = {
  home: { path: "/", auth: false },
  dashboard: { path: "/dashboard", auth: true },
};
// routesWithAnnotation.home → noUncheckedIndexedAccess 下では undefined の可能性が出てしまう

// ✅ satisfies を使うと、RouteConfig を満たしているか検証しつつ、具体的な型を保持！
const routes = {
  home: { path: "/", auth: false },
  dashboard: { path: "/dashboard", auth: true },
} as const satisfies RouteConfig;

// routes.dashboard.path は "/dashboard" 型として補完され、typo もコンパイルエラーになる！
```

---

## 実践してみよう

1. サンプルを実行しましょう：
   ```bash
   node examples/04-type-narrowing.ts
   ```
2. 演習問題 [exercises/ch04-type-narrowing.ts](../exercises/ch04-type-narrowing.ts) を解いて、テストをパスさせましょう。

---

次の章: [第5章: ジェネリクスと型レベルプログラミング入門](./05-generics-and-utility-types.md)
