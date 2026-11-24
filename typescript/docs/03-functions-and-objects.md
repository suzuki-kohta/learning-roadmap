# 第3章: 関数・オブジェクト・型定義の設計

> **この章のゴール**
> - 関数宣言・アロー関数・コールバック・オプショナル引数・デフォルト引数の型を自在に書けるようになる
> - `interface` と `type` の違いを正確に理解し、一貫した基準で使い分けられるようになる
> - TypeScript の「構造的部分型（Structural Subtyping）」と余剰プロパティチェックの仕組みを理解する
>
> **対応ファイル**: [examples/03-functions-and-objects.ts](../examples/03-functions-and-objects.ts)

---

## 関数の型定義

### 基本の書き方

```ts
// 関数宣言
function add(a: number, b: number): number {
  return a + b;
}

// アロー関数
const multiply = (a: number, b: number): number => a * b;

// 関数型エイリアス（コールバックの型定義に非常に便利）
type Comparator<T> = (a: T, b: T) => number;
```

### オプショナル引数（`?`）とデフォルト引数

```ts
// greeting は省略可能（string | undefined）
function greet(name: string, greeting?: string): string {
  return `${greeting ?? "Hello"}, ${name}!`;
}

// デフォルト引数を使うと型は自動推論され、関数内では undefined を気にせず使える
function createPagination(page = 1, perPage = 20) {
  return { offset: (page - 1) * perPage, limit: perPage };
}
```

### オブジェクト引数パターン（実務でおすすめ）

引数が3つ以上になると順番を間違えやすくなります。オプションオブジェクトとして受け取る設計が安全です。

```ts
type FetchUsersOptions = {
  readonly role?: "admin" | "member";
  readonly limit?: number;
  readonly includeInactive?: boolean;
};

function fetchUsers({
  role,
  limit = 20,
  includeInactive = false,
}: FetchUsersOptions = {}) {
  return { role, limit, includeInactive };
}

fetchUsers();                            // ✅ すべてデフォルト値
fetchUsers({ role: "admin", limit: 5 }); // ✅ 名前付きなので読み間違えない
```

---

### `void` と `undefined` の違い

- `void`: 「戻り値を使わない（無視する）」という意味。コールバック関数の戻り値に `void` を指定すると、実際には値を返す関数（例：`() => items.push(x)` は `number` を返す）も安全に渡せます。
- `undefined`: 「明示的に `return undefined`（または空の `return`）をする必要がある」という意味。

```ts
type Callback = () => void;

const list: number[] = [];
// Array.prototype.push は number を返すが、戻り値 void のコールバックとして渡せる
const cb: Callback = () => list.push(1); // ✅ OK
```

### 関数オーバーロード（Function Overloads）

引数の型によって戻り値の型が変わる関数に使います（ただし、単純なケースではまずユニオン型やジェネリクスで書けないか検討しましょう）。

```ts
// オーバーロードシグネチャ（外部から見える型）
function parseDate(input: string): Date;
function parseDate(input: number): Date;
function parseDate(input: string | number): Date {
  // 実装シグネチャ（外部からは直接呼ばれない）
  return new Date(input);
}
```

---

## オブジェクト型・オプショナルプロパティ・`readonly`

```ts
type User = {
  readonly id: string;       // 再代入不可（不変性を表現）
  name: string;
  email: string;
  bio?: string;              // 省略可能（存在しない、または string | undefined）
};

const user: User = {
  id: "u_001",
  name: "Ken",
  email: "ken@example.com",
};

// user.id = "u_002"; // ❌ コンパイルエラー: readonly プロパティは変更できない
```

### インデックスシグネチャ vs `Record<K, V>`

動的なキーを持つ辞書オブジェクトを表現したい場合は、`Record<string, V>` やインデックスシグネチャを使います。

```ts
// Record<KeyType, ValueType> の方が簡潔で読みやすい
type ErrorCounts = Record<string, number>;

const counts: ErrorCounts = {
  notFound: 3,
  timeout: 1,
};

// noUncheckedIndexedAccess: true のおかげで、存在しないキーへのアクセスは number | undefined になる
const timeoutCount = counts["timeout"] ?? 0;
```

> **Tip**: 動的にキーの追加・削除を頻繁に行う場合は、プロトタイプ汚染の心配がなく性能も良い JavaScript 標準の **`Map<K, V>`** の使用も検討しましょう。

---

## `interface` vs `type` の違いと使い分け

TypeScript 学習者が最もよく迷うポイントですが、違いは明確です。

| 機能 | `type`（型エイリアス） | `interface` |
| --- | --- | --- |
| オブジェクト型の定義 | ✅ | ✅ |
| プリミティブ・ユニオン・タプル・関数型 | ✅ | ❌（オブジェクト・関数構造のみ） |
| 継承・合成 | 交差型 `&` | `extends` |
| 宣言マージ（同名の再宣言で結合） | ❌（重複エラー） | ✅（自動マージされる） |
| Mapped / Conditional Types | ✅ | ❌ |

### 実務でのシンプルな使い分け指針

- **基本は `type` を使う**（データ構造・ユニオン型・ユーティリティ型の合成などすべて統一でき、意図しない宣言マージも起きない）
- **クラスが `implements` する契約**や、**外部ライブラリの型拡張（Declaration Merging）が必要な場合**に `interface` を使う
- チームに既存ルール（「オブジェクトは `interface`、それ以外は `type`」など）がある場合はそれに合わせる

---

## 構造的部分型（Structural Subtyping）の理解

Java や C# のような「名前的型付け（Nominal Typing）」とは異なり、TypeScript は **「形（プロパティの構造）が一致していれば互換性がある」** とみなす **構造的部分型**（ダックタイピングの静的版）を採用しています。

```ts
type Point2D = { x: number; y: number };
type Point3D = { x: number; y: number; z: number };

function printPoint(p: Point2D) {
  console.log(`(${p.x}, ${p.y})`);
}

const p3: Point3D = { x: 1, y: 2, z: 3 };
printPoint(p3); // ✅ OK! Point3D は Point2D の必要なプロパティをすべて満たしている
```

### ⚠️ 余剰プロパティチェック（Excess Property Checks）

一方で、**オブジェクトリテラルを直接渡したときだけ**、TypeScript はタイポ防止のために余分なプロパティをエラーにします。

```ts
// ❌ コンパイルエラー: 'z' は Point2D に存在しない（リテラル直接渡し時のみチェック発動）
// printPoint({ x: 1, y: 2, z: 3 });

// ✅ 変数に一度入れると構造的部分型として通る
const extra = { x: 1, y: 2, z: 3 };
printPoint(extra);
```

### 応用テクニック：Branded Types（公称型を擬似的に作る）

構造的部分型では `type UserId = string` と `type OrderId = string` がどちらも `string` なので取り違えを防げません。重要な ID を絶対に取り違えたくない場合は **Branded Type** を使います。

```ts
type Brand<T, Name extends string> = T & { readonly __brand: Name };
type UserId = Brand<string, "UserId">;
type OrderId = Brand<string, "OrderId">;

const toUserId = (id: string): UserId => id as UserId;
const toOrderId = (id: string): OrderId => id as OrderId;

function findUser(id: UserId) { /* ... */ }

const orderId = toOrderId("ord_123");
// findUser(orderId); // ❌ コンパイルエラー! OrderId は UserId に渡せない
findUser(toUserId("usr_123")); // ✅ OK!
```

---

## クラスと TypeScript（モダンな付き合い方）

TypeScript は ES クラスに `private` / `protected` / `readonly` や `implements` を追加できます。

ただし、モダン TypeScript（特に Node.js ネイティブ実行 / Type Stripping 環境）では以下の2点を意識するとトラブルがありません。

1. **データ表現（DTO / モデル）はプレーンオブジェクト + `type`、状態と振る舞いをカプセル化したいサービス／リポジトリ層でクラスまたはクロージャを使う**
2. **コンストラクタのパラメータプロパティ**（`constructor(private name: string) {}`）は Type Stripping でエラーになるため、標準のフィールド宣言を使う（JS ネイティブの `#privateField` も強力です）

```ts
interface Clock {
  now(): Date;
}

class SystemClock implements Clock {
  readonly #timezone: string;

  constructor(timezone: string) {
    this.#timezone = timezone;
  }

  now(): Date {
    return new Date();
  }

  get timezone(): string {
    return this.#timezone;
  }
}
```

---

## 実践してみよう

サンプルを実行して、構造的部分型・Branded Types・関数設計の動作を確認しましょう。

```bash
node examples/03-functions-and-objects.ts
```

---

次の章: [第4章: 型の絞り込みと安全性（Type Narrowing）](./04-type-narrowing-and-safety.md)
