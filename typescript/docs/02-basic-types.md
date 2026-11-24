# 第2章: 基本の型・型推論・ユニオン型

> **この章のゴール**
> - TypeScript の基本型（プリミティブ、配列、タプル）を正確に使えるようになる
> - 型推論（`const` vs `let`）の仕組みを理解し、冗長な型注釈を避けられるようになる
> - リテラル型、`as const`、ユニオン型（`|`）、交差型（`&`）を使いこなせるようになる
>
> **対応ファイル**: [examples/02-basic-types.ts](../examples/02-basic-types.ts) / [exercises/ch02-basic-types.ts](../exercises/ch02-basic-types.ts)

---

## プリミティブ型

JavaScript のプリミティブ値に対応する基本型です。すべて**小文字**で書きます（`String` や `Number` のようなラッパーオブジェクト型は使いません）。

```ts
const userName: string = "Alice";
const age: number = 30;
const isActive: boolean = true;
const hugeNumber: bigint = 9007199254740993n;
const uniqueKey: symbol = Symbol("id");

// null と undefined は strictNullChecks（strict: true に含まれる）下では明確に区別される
const empty: null = null;
const notAssigned: undefined = undefined;
```

### ⚠️ よくある落とし穴：`String` と `string`

```ts
// ❌ Bad: ラッパーオブジェクト型（プリミティブの文字列だけでなく new String() も許容してしまい、他ライブラリと噛み合わない）
const bad: String = "hello";

// ✅ Good: 常に小文字のプリミティブ型を使う
const good: string = "hello";
```

---

## 型推論（Type Inference）を味方にする

TypeScript の型推論は非常に優秀です。**「すべてに型注釈を書く」のではなく、推論に任せられるところは任せる**のがモダンな書き方です。

```ts
// ❌ 冗長な型注釈
const count: number = 0;
const greeting: string = "Hello";

// ✅ 推論に任せる（エディタ上でホバーすると型が確認できる）
let count = 0;           // number と推論される
const greeting = "Hello"; // "Hello"（文字列リテラル型）と推論される！
```

### `let` と `const` で推論が変わる（Widening）

- `let` は後から再代入できるため、広い型（`string`, `number`）に推論されます（**Type Widening**）。
- `const` は再代入できないため、その値そのもの（`"Hello"`, `42`）という**リテラル型**に推論されます。

### どこに型注釈を書くべきか？

1. **関数の引数**（必須。推論できないため）
2. **関数の戻り値**（公開 API や複雑な関数では明示すると意図が伝わり、実装ミスを関数内で検知できる）
3. **空配列・初期値が `null` の変数**（`const items: string[] = []` のように初期値から推論できない場合）

---

## 配列とタプル（Array & Tuple）

### 配列

書き方は `T[]` と `Array<T>` の2種類があります。基本はシンプルに `T[]` を使い、複雑なジェネリクスの中や `readonly` と組み合わせるときに読みやすい方を選びます。

```ts
const scores: number[] = [80, 95, 70];
const tags: readonly string[] = ["typescript", "nodejs"];
// tags.push("error"); // ❌ コンパイルエラー: readonly 配列は変更不可
```

### ⚠️ `noUncheckedIndexedAccess` による安全な配列アクセス

本リポジトリの `tsconfig.json` では `"noUncheckedIndexedAccess": true` を有効にしています。これにより、配列の添字アクセスは `T | undefined` になります。

```ts
const names = ["Alice", "Bob"];
const first = names[0]; // 型は string | undefined

// 存在チェックを強制されるため、実行時の TypeError を未然に防げる！
if (first !== undefined) {
  console.log(first.toUpperCase()); // ここでは string に絞り込まれる
}
```

### タプル（Tuple）

**「要素数」と「各位置の型」が固定された配列**です。React の `useState` の戻り値や、座標・キーと値のペアなどで活躍します。

```ts
// 名前付きタプル（ラベルを付けるとエディタ補完が非常に読みやすい）
type Coordinate = readonly [x: number, y: number];
const origin: Coordinate = [0, 0];

type HttpHeader = readonly [name: string, value: string];
const contentType: HttpHeader = ["Content-Type", "application/json"];
```

---

## リテラル型と `as const`

### リテラル型（Literal Types）

特定の値のみを許可する型です。ユニオン型と組み合わせることで、マジックナンバーやタイポを完全に根絶できます。

```ts
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6;

function sendRequest(method: HttpMethod, url: string) {
  console.log(`${method} ${url}`);
}

sendRequest("GET", "/api/users");   // ✅ OK
// sendRequest("PATCH", "/api/users"); // ❌ 型エラー！
```

### `as const`（Const Assertions）

オブジェクトや配列の末尾に `as const` を付けると、**すべてのプロパティが再帰的に `readonly` かつリテラル型**になります。

```ts
// as const なし → { readonly なし, host: string, port: number }
const mutableConfig = {
  host: "localhost",
  port: 3000,
};

// as const あり → { readonly host: "localhost"; readonly port: 3000 }
const config = {
  host: "localhost",
  port: 3000,
} as const;
```

### モダン TypeScript では `enum` より `as const` オブジェクトを推奨

TypeScript の `enum` は実行時の JavaScript コードを生成するため、Node.js のネイティブ TypeScript 実行（Type Stripping）と相性が悪く、数値 enum には型安全性の罠もあります。代わりに **`as const` オブジェクト + 型抽出** を使うのが現在のベストプラクティスです。

```ts
export const TaskStatus = {
  Todo: "todo",
  InProgress: "in_progress",
  Done: "done",
} as const;

// オブジェクトの値からユニオン型 "todo" | "in_progress" | "done" を自動生成！
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

const current: TaskStatus = TaskStatus.InProgress; // ✅ "in_progress"
const fromJson: TaskStatus = "done";               // ✅ 文字列リテラルもそのまま使える
```

---

## ユニオン型（`|`）と交差型（`&`）

TypeScript の型システムは「集合論（値の集合）」として理解するとスッキリします。

### ユニオン型（Union Types: `A | B`）—「A または B」

```ts
type UserId = string | number;

function formatUserId(id: UserId): string {
  // 両方に共通する操作以外は、型を絞り込んでから使う（第4章で詳述）
  if (typeof id === "number") {
    return `USER-${id.toString().padStart(4, "0")}`;
  }
  return `USER-${id.toUpperCase()}`;
}
```

### 交差型（Intersection Types: `A & B`）—「A かつ B」

主に複数のオブジェクト型を合成して「両方のプロパティを持つ型」を作るときに使います。

```ts
type Timestamped = {
  createdAt: Date;
  updatedAt: Date;
};

type ArticleBody = {
  title: string;
  content: string;
};

// 両方のプロパティをすべて持つ型
type Article = ArticleBody & Timestamped;
```

> **注意**: `string & number` のように共通要素が存在しないプリミティブ同士の交差型は、値が存在しない型 **`never`** になります。

---

## `any` を避けるべき理由

`any` は「型チェックを完全に無効化する脱出ハッチ」です。

```ts
let anything: any = "hello";
anything.notExistingMethod(); // コンパイルは通るが、実行時にクラッシュする！
```

`any` が1箇所に入ると、そこから返される値や代入先の変数にも `any` が伝染し、TypeScript を使う意味が失われます。

- **型が本当に分からない外部データ**には `any` ではなく **`unknown`** を使います（第4章で詳しく学びます）。

---

## 実践してみよう

1. サンプルを実行して動作を確認しましょう：
   ```bash
   node examples/02-basic-types.ts
   ```
2. 演習問題 [exercises/ch02-basic-types.ts](../exercises/ch02-basic-types.ts) の `TODO` を実装し、`npm run typecheck` と `npm run test:exercises` を実行してみましょう。

---

次の章: [第3章: 関数・オブジェクト・型定義の設計](./03-functions-and-objects.md)
