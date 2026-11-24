# 第10章: 実践ハンズオン：CLI ツール & REST API サーバー

> **この章のゴール**
> - 第1〜9章で学んだ知識を総動員して、**2つの実用的なアプリケーション**の構造を読み解き、動かして拡張できるようになる
>   1. **ハンズオン 1**: 型安全な CLI タスク管理ツール（`projects/cli-todo/`）
>   2. **ハンズオン 2**: 依存ゼロの型安全 REST API サーバー（`projects/rest-api/`）

---

## ハンズオン 1：CLI タスク管理ツール（`projects/cli-todo`）

外部ライブラリを一切使わず、Node.js 標準機能と TypeScript だけで作る永続化付き CLI ツールです。

### ファイル構成と責務分離

```text
projects/cli-todo/
├── README.md        # 使い方・コマンド一覧
├── store.ts         # データモデル・JSONファイル永続化・型ガード・Result型
├── cli.ts           # node:util parseArgs による CLI インターフェース層
└── store.test.ts    # 一時ディレクトリを使った自動テスト（node:test）
```

### このコードで注目してほしい TypeScript / Node.js 設計ポイント

1. **ビジネスロジック（`store.ts`）と I/O インターフェース（`cli.ts`）の分離**
   - `store.ts` は `console.log` や `process.exit` を一切呼ばず、純粋に `Result<T, StoreError>` を返します。これにより、`store.test.ts` で簡単に自動テストが書けます。
2. **境界での型ガード（`isTodoArray`）**
   - ディスク上の `todos.json` が手作業で壊された場合でも、`JSON.parse` の結果を `unknown` として検証し、型安全に `CORRUPTED_DATA` エラーを返します。
3. **`node:util` の `parseArgs`**
   - `--file`, `--help`, `--all` などのフラグ解析を標準機能だけで実装しています。

### 動かしてみよう

```bash
# テストを実行
node --test projects/cli-todo/store.test.ts

# CLI を実際に使ってみる
node projects/cli-todo/cli.ts add "TypeScriptのジェネリクスを復習する"
node projects/cli-todo/cli.ts add "Node.jsのStreamを試す"
node projects/cli-todo/cli.ts list
node projects/cli-todo/cli.ts done 1
node projects/cli-todo/cli.ts list
```

### 発展課題（自力で機能追加してみよう！）

1. `remove <id>` サブコマンドを追加して、指定したタスクを削除できるようにしてみよう。
2. タスクに `priority: "low" | "medium" | "high"` フィールドを追加し、`add "買い物" --priority high` で登録、`list --priority high` で絞り込めるようにしてみよう（既存の古い JSON データを読み込んだときの後方互換性も考えてみよう！）。

---

## ハンズオン 2：型安全 REST API サーバー（`projects/rest-api`）

Node.js の `node:http` だけを使って、フレームワークの裏側で何が起きているかを体験しながら作る REST API サーバーです。

### ファイル構成と責務分離

```text
projects/rest-api/
├── README.md        # エンドポイント仕様・curl コマンド例
├── types.ts         # ドメインモデル・DTO・境界バリデーション（型ガード）
├── repository.ts    # データ永続化層のインターフェース（TodoRepository）とインメモリ実装
├── server.ts        # node:http ルーター・JSON ボディ読み取り・統一エラーレスポンス
└── server.test.ts   # 実サーバーを起動して fetch() で検証する統合テスト
```

### このコードで注目してほしい設計ポイント

1. **リポジトリの抽象化（`TodoRepository` インターフェース）**
   - `server.ts` は具体的な保存先（インメモリか PostgreSQL か SQLite か）を知らず、`TodoRepository` インターフェースにのみ依存します。
2. **安全な JSON ボディ読み込み（サイズ制限付き）**
   - `IncomingMessage`（Readable Stream）を `for await` で読み込みつつ、最大サイズ（64KB）を超えたら即座に `413 Payload Too Large` を返す防御的実装になっています。
3. **実ポート `0` を使った並列安全な統合テスト（`server.test.ts`）**
   - `server.listen(0)` とすると OS が空いているポートを自動割り当てしてくれるため、ポート競合なしで本物の HTTP 通信（`fetch`）をテストできます。

### 動かしてみよう

```bash
# API の統合テストを実行
node --test projects/rest-api/server.test.ts

# サーバーを起動（別ターミナルから curl で叩いてみましょう）
node projects/rest-api/server.ts
```

別ターミナルでの動作確認例：

```bash
# ヘルスチェック
curl -s http://localhost:3000/health

# Todo 作成
curl -s -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Node.js HTTPサーバーを理解する"}'

# 一覧取得
curl -s http://localhost:3000/todos
```

### 発展課題（自力で機能追加してみよう！）

1. `GET /todos?completed=true` のようにクエリパラメータで完了／未完了をフィルタリングできるようにしてみよう（ヒント：`url.searchParams.get("completed")`）。
2. `projects/cli-todo/store.ts` の知識を応用して、インメモリではなく JSON ファイルに保存する `FileTodoRepository implements TodoRepository` を実装し、`server.ts` のリポジトリを差し替えてみよう！
3. 本格的なバックエンド開発へステップアップするなら、同じ設計思想のまま **Hono** や **Fastify** + **Zod** + **Drizzle ORM / Prisma** に置き換えてみましょう。土台の仕組みが分かっているため、フレームワークのドキュメントが驚くほどスッと頭に入るはずです。

---

次のドキュメント: [付録: TypeScript & Node.js 逆引きチートシート](./appendix-cheatsheet.md)
