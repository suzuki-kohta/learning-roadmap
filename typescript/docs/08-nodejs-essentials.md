# 第8章: モダン Node.js 実践

> **この章のゴール**
> - `node:` プレフィックス付きの標準モジュール体系を理解し、外部ライブラリに頼らず基本処理を実装できる
> - `node:fs/promises`, `node:path`, `node:stream`, `node:events`, `fetch`, `node:http`, `node:util`（`parseArgs`）を実践的に使いこなせるようになる
> - 環境変数やグレースフルシャットダウンなど、本番運用を意識した Node.js の基本作法を身につける
>
> **対応ファイル**: [examples/08-nodejs-essentials.ts](../examples/08-nodejs-essentials.ts)

---

## `node:` プレフィックスを常に付ける

Node.js の組み込みモジュールは、npm パッケージと区別し名前衝突（タイポスクワッティング等）を防ぐため、**`node:` プレフィックス**を付けるのが現代のベストプラクティスです。

```ts
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { parseArgs } from "node:util";
```

---

## ファイルシステム（`node:fs/promises`）とパス操作（`node:path`）

### パス結合は文字列連結ではなく `path.join` / `path.resolve`

OS ごとにパス区切り文字（`/` vs `\`）が異なるため、必ず `node:path` を使います。

```ts
import path from "node:path";

// import.meta.dirname は現在のファイルのディレクトリ（Node 20.11+）
const dataDir = path.join(import.meta.dirname, "data");
const filePath = path.join(dataDir, "users.json");
```

### ファイル読み書き（`node:fs/promises`）

```ts
import fs from "node:fs/promises";

// ディレクトリ作成（recursive: true なら既に存在してもエラーにならない）
await fs.mkdir(dataDir, { recursive: true });

// UTF-8 テキストの書き込み・読み込み
await fs.writeFile(filePath, JSON.stringify({ ok: true }, null, 2), "utf8");
const content = await fs.readFile(filePath, "utf8");

// ファイルが存在しない（ENOENT）エラーを型安全に判定する
function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && "code" in err;
}

try {
  await fs.readFile("./not-found.txt", "utf8");
} catch (err: unknown) {
  if (isNodeError(err) && err.code === "ENOENT") {
    console.log("ファイルが存在しません");
  } else {
    throw err;
  }
}
```

---

## ストリーム（`node:stream`）— 大容量データを省メモリで処理する

数 GB のログファイルや CSV を `fs.readFile` で丸ごと読み込むとメモリ不足（OOM）で落ちます。**Stream** を使うとデータを小さな塊（チャンク）単位で処理できます。

### モダンなストリームの2大イディオム

1. **`for await (const chunk of readable)`** で非同期イテレータとして読む
2. **`stream/promises` の `pipeline()`** で複数のストリームを安全に繋ぐ（エラー伝播と後始末を自動で行ってくれるため、古い `.pipe()` より圧倒的に安全！）

```ts
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";

// 巨大ファイルを省メモリで gzip 圧縮して出力
await pipeline(
  createReadStream("large.log"),
  createGzip(),
  createWriteStream("large.log.gz"),
);
```

---

## イベント駆動（`EventEmitter` の型安全化）

Node.js の多くの API は `EventEmitter` をベースにしています。TypeScript ではイベント名とペイロードを型マップで定義すると、タイポや引数の型ズレを防げます。

```ts
import { EventEmitter } from "node:events";

type AppEvents = {
  userCreated: [user: { id: string; name: string }];
  errorOccurred: [error: Error];
};

// Node.js 22+ の @types/node では EventEmitter<EventMap> がジェネリクス対応！
const bus = new EventEmitter<AppEvents>();

bus.on("userCreated", (user) => {
  console.log(`New user: ${user.name}`); // user の型が自動推論される！
});

bus.emit("userCreated", { id: "u_1", name: "Alice" });
```

---

## 標準 `fetch` API と Web 標準ユーティリティ

Node.js 18+（LTS 20/22/24）では、ブラウザと同じ Web 標準 API が組み込まれています。

- **`fetch` / `Request` / `Response` / `Headers`**: HTTP クライアント（簡単な通信に `axios` は不要になりました）
- **`URL` / `URLSearchParams`**: URL の組み立てとクエリパラメータ解析
- **`crypto.randomUUID()`**: UUID v4 の生成（`uuid` パッケージ不要）
- **`structuredClone(obj)`**: オブジェクトのディープコピー

### ⚠️ `fetch` で絶対に忘れてはいけない注意点

`fetch` は **HTTP 404 や 500 でも `reject` されません**（ネットワーク障害やタイムアウト時のみ reject）。必ず `response.ok` を確認しましょう。

```ts
async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5_000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as unknown;
}
```

---

## `node:http` で HTTP サーバーを理解する

実務では Hono / Fastify / Express などのフレームワークを使うことが多いですが、その土台となる **`node:http`** の仕組みを知っておくと、リクエストストリーム・ヘッダー・ステータスコード・エラー処理への理解が段違いに深まります。

```ts
import http from "node:http";

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ error: "Not Found" }));
});
```

第10章のハンズオン（`projects/rest-api`）では、この `node:http` を使って JSON ボディの読み込み・ルーティング・テストまで含めた完全な REST API サーバーを構築します。

---

## CLI 引数解析（`node:util` の `parseArgs`）と環境変数

### `parseArgs`（外部パッケージ不要の引数パーサー）

Node.js 18.3+ から標準搭載された `parseArgs` を使うと、`--port 3000 --verbose` のような CLI オプションを安全に解析できます。

```ts
import { parseArgs } from "node:util";

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    port: { type: "string", short: "p", default: "3000" },
    verbose: { type: "boolean", short: "v", default: false },
  },
  allowPositionals: true,
});
```

### 環境変数（`process.env`）の安全な読み込み

`process.env.PORT` の型は `string | undefined` です。アプリの起動直後に一箇所でバリデーションして型付きの `Config` オブジェクトにまとめるのが鉄則です。

```ts
function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
```

> **Tip**: Node.js 20.6+ では `node --env-file=.env app.ts` で `.env` ファイルを標準読み込みできます（`dotenv` パッケージも不要になりつつあります）。

### グレースフルシャットダウン（SIGINT / SIGTERM）

サーバープロセスが停止シグナルを受けた際、処理中のリクエストを完了させ、DB 接続などを閉じてから終了するのが本番運用の基本です。

```ts
function setupGracefulShutdown(server: http.Server) {
  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}
```

---

## 実践してみよう

一時ディレクトリ作成・ファイル I/O・ストリーム処理・EventEmitter・URL 解析を一気に試すサンプルを実行してみましょう。

```bash
node examples/08-nodejs-essentials.ts
```

---

次の章: [第9章: 実務の開発環境・テスト・コード品質](./09-testing-and-tooling.md)
