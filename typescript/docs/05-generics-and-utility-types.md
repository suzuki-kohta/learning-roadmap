# 第5章: ジェネリクスと型レベルプログラミング入門

> **この章のゴール**
> - ジェネリクス（`<T>`）と型制約（`extends`）を使って、再利用可能かつ型安全な関数・データ構造を書けるようになる
> - `keyof`、`typeof`、Indexed Access Types（`T[K]`）を組み合わせて型を動的に導出できる
> - 標準の Utility Types（`Partial`, `Pick`, `Omit`, `Record`, `ReturnType`, `Awaited` 等）を自在に使いこなせる
> - Mapped Types と Conditional Types の基礎を読み書きできるようになる
>
> **対応ファイル**: [examples/05-generics-and-utilities.ts](../examples/05-generics-and-utilities.ts) / [exercises/ch05-generics.ts](../exercises/ch05-generics.ts)

---

## ジェネリクス（Generics）の本質

ジェネリクスとは **「型を引数として受け取る仕組み（型の変数）」** です。
`any` を使えばどんな型でも受け取れますが、戻り値の型情報が失われてしまいます。ジェネリクスなら **「入力された型と出力の型の関係」** を保てます。

```ts
// ❌ any を使うと戻り値の型情報が消える
function firstAny(items: any[]): any {
  return items[0];
}

// ✅ ジェネリクスなら、string[] を渡せば string | undefined が返る
function first<T>(items: readonly T[]): T | undefined {
  return items[0];
}

const a = first([10, 20, 30]);       // number | undefined（T は number と自動推論）
const b = first(["ts", "node"]);     // string | undefined（T は string と自動推論）
```

### 型引数を持つデータ構造（API レスポンスやページネーション）

```ts
type PaginatedResult<T> = {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly perPage: number;
};

type User = { id: string; name: string };
type UserPage = PaginatedResult<User>;
```

---

## 型制約（`extends`）と `keyof`

型引数 `T` に「最低限この構造を持っていること」という条件を付けたいときは `extends` を使います。

```ts
// T は少なくとも { id: string } を持つオブジェクトでなければならない
function indexById<T extends { readonly id: string }>(
  items: readonly T[],
): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    map.set(item.id, item);
  }
  return map;
}
```

### `keyof` と Indexed Access Type (`T[K]`) の黄金コンビ

`keyof T` は、オブジェクト型 `T` のすべてのキーのユニオン型を取得します。

```ts
type User = {
  id: number;
  name: string;
  isAdmin: boolean;
};

type UserKey = keyof User; // "id" | "name" | "isAdmin"

// K は T のキーのいずれかに制約され、戻り値は「そのキーに対応するプロパティの型 T[K]」になる！
function pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}

const users: User[] = [
  { id: 1, name: "Alice", isAdmin: true },
  { id: 2, name: "Bob", isAdmin: false },
];

const names = pluck(users, "name");   // string[] と推論される！
const ids = pluck(users, "id");       // number[] と推論される！
// pluck(users, "unknownKey");        // ❌ コンパイルエラー！
```

### デフォルト型引数

関数のデフォルト引数と同じように、型引数にもデフォルト値を指定できます。

```ts
type ApiResponse<TData, TError = string> =
  | { ok: true; data: TData }
  | { ok: false; error: TError };
```

---

## 実務で毎日使う標準 Utility Types

TypeScript に最初から組み込まれている便利な型変換ツール群です。重複した型定義を書かず、**「唯一の信頼できる情報源（Single Source of Truth）」から派生型を作る**のがコツです。

| Utility Type | 説明 | よく使う場面 |
| --- | --- | --- |
| `Partial<T>` | 全プロパティをオプショナル化 | 更新用 DTO（PATCH リクエスト） |
| `Required<T>` | 全プロパティを必須化 | デフォルト値適用後の設定型 |
| `Readonly<T>` | 全プロパティを `readonly` 化 | イミュータブルな状態・引数 |
| `Pick<T, K>` | 指定したキー `K` だけを抽出 | 一覧表示用の軽量オブジェクト |
| `Omit<T, K>` | 指定したキー `K` を除外 | 新規作成用 DTO（`id`, `createdAt` を除く） |
| `Record<K, V>` | キーが `K`、値が `V` の辞書型 | マッピングテーブル・設定辞書 |
| `Exclude<U, E>` | ユニオン `U` から `E` を除外 | 特定のステータスを除いた型 |
| `Extract<U, E>` | ユニオン `U` から `E` のみ抽出 | 特定のイベント型だけ取り出す |
| `NonNullable<T>` | `null` と `undefined` を除外 | null チェック後の型表現 |
| `ReturnType<F>` | 関数型 `F` の戻り値型を取得 | 既存関数の戻り値型を再利用 |
| `Parameters<F>` | 関数型 `F` の引数タプル型を取得 | ラッパー関数の型付け |
| `Awaited<T>` | `Promise<T>` の中身を再帰的に取り出す | `async` 関数の戻り値の中身を取得 |

### 実務での組み合わせ例（CRUD の型設計）

```ts
type Todo = {
  readonly id: string;
  readonly title: string;
  readonly completed: boolean;
  readonly createdAt: string;
};

// 新規作成時は id と createdAt はサーバーが採番するので不要
type CreateTodoInput = Omit<Todo, "id" | "createdAt">;

// 更新時は id 以外の好きな項目だけ送れる
type UpdateTodoInput = Partial<Pick<Todo, "title" | "completed">>;

// 関数から戻り値型を導出（型と実装のズレを防ぐ）
async function loadConfig() {
  return { port: 3000, env: "development" as const };
}
type AppConfig = Awaited<ReturnType<typeof loadConfig>>;
```

---

## 型レベルプログラミング入門（Mapped / Conditional / Template Literal）

Utility Types が裏側でどう実装されているかを知ると、複雑なライブラリの型定義も読めるようになります。

### Mapped Types（オブジェクトのキーをループ変換する）

```ts
// Partial<T> の正体
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};

// すべてのプロパティをバリデーション結果（string | null）に変換する型
type ValidationErrors<T> = {
  [K in keyof T]?: string;
};
```

### Conditional Types（型の三項演算子 `T extends U ? X : Y`）

```ts
type IsString<T> = T extends string ? true : false;
type A = IsString<"hello">; // true
type B = IsString<number>;  // false

// infer キーワード：条件にマッチした部分の型を「変数として取り出す」
type UnwrapArray<T> = T extends readonly (infer Item)[] ? Item : T;
type C = UnwrapArray<string[]>; // string
type D = UnwrapArray<number>;   // number
```

### Template Literal Types（文字列型の結合）

```ts
type HttpMethod = "GET" | "POST";
type Endpoint = "/users" | "/todos";
type RouteKey = `${HttpMethod} ${Endpoint}`;
// "GET /users" | "GET /todos" | "POST /users" | "POST /todos"
```

> **実務のバランス感覚**
> 型パズルは楽しいですが、複雑すぎる型はコンパイル速度の低下とエラーメッセージの難読化を招きます。**「使う側がシンプルに書けるか？」「チームメンバーが30秒で理解できるか？」**を常に基準にしましょう。

---

## 実践してみよう

1. サンプルを実行しましょう：
   ```bash
   node examples/05-generics-and-utilities.ts
   ```
2. 演習問題 [exercises/ch05-generics.ts](../exercises/ch05-generics.ts) に挑戦し、テストを実行しましょう。

---

次の章: [第6章: モジュールシステムと tsconfig.json 完全理解](./06-modules-and-tsconfig.md)
