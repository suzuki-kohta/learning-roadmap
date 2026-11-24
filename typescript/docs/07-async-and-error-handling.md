# 第7章: 非同期処理と型安全なエラーハンドリング

> **この章のゴール**
> - Node.js のイベントループと `Promise` / `async` / `await` の仕組みを正しく理解する
> - 並列実行（`Promise.all` / `Promise.allSettled` / `Promise.race`）と `AbortController` によるタイムアウト・キャンセルを使いこなす
> - TypeScript における `throw` の限界を理解し、**`Result<T, E>` 型パターン**で型安全なエラーハンドリングを実装できるようになる
>
> **対応ファイル**: [examples/07-async-and-result.ts](../examples/07-async-and-result.ts) / [exercises/ch07-async-result.ts](../exercises/ch07-async-result.ts)

---

## Node.js のイベントループとノンブロッキング I/O

Node.js の JavaScript 実行スレッドは1本（シングルスレッド）です。それなのに数千の同時リクエストを処理できる理由は、**ファイル I/O やネットワーク通信を OS（libuv）に委譲し、完了通知だけをイベントループで受け取る（ノンブロッキング I/O）**からです。

### ⚠️ 絶対に避けるべきアンチパターン

- **サーバー処理の中で同期 I/O（`readFileSync` など）や重い同期計算を回すこと**:
  メインスレッドが完全にブロックされ、他の全ユーザーのリクエストが止まります。
  ※ CLI ツールの起動時設定読み込みなど単発用途を除き、基本は常に非同期 API（`fs/promises` 等）を使います。

---

## `Promise<T>` と `async` / `await` の型

`async` 関数は、戻り値が常に `Promise<T>` でラップされます。

```ts
// 戻り値の型は Promise<string>
async function fetchGreeting(name: string): Promise<string> {
  return `Hello, ${name}!`;
}

// Promise を明示的に作る例（タイマー）
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
```

### 並列処理の使い分け（直列 `await` の罠に注意！）

お互いに依存しない非同期処理を `await` で順番に待つと、処理時間が足し算になって遅くなります。

```ts
// ❌ 遅い（直列実行：合計 200ms + 300ms = 500ms）
const user = await fetchUser(id);
const posts = await fetchPosts(id);

// ✅ 速い（並列実行：合計 max(200ms, 300ms) = 300ms）
const [user, posts] = await Promise.all([
  fetchUser(id),
  fetchPosts(id),
]);
```

| メソッド | 動作 | 使いどころ |
| --- | --- | --- |
| `Promise.all(promises)` | すべて成功したら結果配列を返す。1つでも失敗したら即 reject | 全部揃わないと次に進めない場合（最もよく使う） |
| `Promise.allSettled(promises)` | 成否にかかわらず全件の完了を待ち、`{ status: "fulfilled" \| "rejected", ... }` の配列を返す | 一部が失敗しても残りの結果を使いたいバッチ処理・通知送信 |
| `Promise.race(promises)` | 最初に完了（成功 or 失敗）した1件の結果を返す | タイムアウト制御など |
| `Promise.any(promises)` | 最初に**成功**した1件を返す（全件失敗時のみ `AggregateError`） | 複数ミラーサーバーへのフォールバック取得 |

---

## `AbortController` によるキャンセルとタイムアウト

モダン Node.js では、`fetch`、`fs/promises`、`timers/promises`、`http` などあらゆる非同期 API が Web 標準の **`AbortSignal`** に対応しています。

```ts
// AbortSignal.timeout(ms) は Node 18+ で標準搭載！
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  return fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
  });
}
```

---

## TypeScript におけるエラーハンドリングの落とし穴

### 落とし穴 1：`catch (err)` の型は `unknown`

JavaScript では `Error` インスタンス以外の値（文字列や `null`）も `throw` できます。そのため、`strict: true` 下では `catch` の引数は `unknown` になります。

```ts
try {
  JSON.parse("{invalid json");
} catch (err: unknown) {
  // ❌ err.message には直接アクセスできない
  // ✅ instanceof で絞り込んでから扱う
  if (err instanceof Error) {
    console.error(err.message);
  } else {
    console.error("Unknown error:", err);
  }
}
```

### 落とし穴 2：`throw` されるエラーは関数の型シグネチャに現れない

```ts
// この関数がどんなエラーを投げるか（あるいは投げるかどうか）型からは一切分からない！
function parseAge(raw: string): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error("Invalid age");
  }
  return n;
}
```

呼び出し側が `try / catch` を書き忘れても、TypeScript コンパイラは教えてくれません。

---

## 型安全なエラーハンドリング：`Result<T, E>` パターン

Rust や Go に着想を得た、**「起き得る業務エラーを `throw` せず、判別可能ユニオンの戻り値として返す」**設計パターンです。

```ts
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
```

### 使ってみよう

```ts
type ParseAgeError =
  | { readonly code: "NOT_A_NUMBER"; readonly input: string }
  | { readonly code: "OUT_OF_RANGE"; readonly value: number };

function parseAgeSafe(raw: string): Result<number, ParseAgeError> {
  const n = Number(raw);
  if (raw.trim() === "" || !Number.isInteger(n)) {
    return err({ code: "NOT_A_NUMBER", input: raw });
  }
  if (n < 0 || n > 150) {
    return err({ code: "OUT_OF_RANGE", value: n });
  }
  return ok(n);
}

const result = parseAgeSafe("200");
if (!result.ok) {
  // result.error は ParseAgeError 型！switch で網羅的に処理できる
  switch (result.error.code) {
    case "NOT_A_NUMBER":
      console.error(`数値ではありません: ${result.error.input}`);
      break;
    case "OUT_OF_RANGE":
      console.error(`範囲外です: ${result.error.value}`);
      break;
  }
} else {
  // ここでは result.value が確実に number 型！
  console.log(`年齢: ${result.value}`);
}
```

### 例外（`throw`）と `Result` 型の使い分け基準

すべてを `Result` 型にする必要はありません。以下のように役割を分けると非常にスッキリします。

| エラーの種類 | 推奨アプローチ | 具体例 |
| --- | --- | --- |
| **想定内のドメイン／業務エラー** | **`Result<T, E>` 型** | バリデーション失敗、ユーザーが見つからない（404）、在庫不足、重複登録（409） |
| **想定外のシステム障害・バグ** | **`throw Error`**（上位の境界で一括キャッチ） | メモリ不足、DB 接続断、アサーション違反、設定ファイル破損 |

また、エラーを再ラップするときは ES2022 標準の **`{ cause: err }`** を必ず渡して原因チェーンを保ちましょう：

```ts
throw new Error("設定ファイルの読み込みに失敗しました", { cause: originalError });
```

---

## 実践してみよう

1. サンプルを実行しましょう：
   ```bash
   node examples/07-async-and-result.ts
   ```
2. 演習問題 [exercises/ch07-async-result.ts](../exercises/ch07-async-result.ts) を実装し、テストをパスさせましょう。

---

次の章: [第8章: モダン Node.js 実践](./08-nodejs-essentials.md)
