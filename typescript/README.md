# TypeScript & Node.js 実践教科書

JavaScript の基礎から TypeScript の型システム、モダン Node.js、テスト・開発環境、実践的な CLI / REST API 開発までを一気通貫で学び直すためのハンズオン付き Markdown 教科書です。

---

## この教科書の対象とゴール

- **対象**: TypeScript を一から体系的に学び直したい方、JS の知識はあるが型設計やモダン Node.js のベストプラクティスを整理したい方
- **ゴール**:
  1. `any` に頼らず、安全で保守しやすい TypeScript の型設計ができるようになる
  2. ESM・`tsconfig.json`・非同期処理・型安全なエラーハンドリングを根拠を持って扱えるようになる
  3. Node.js の標準 API（`fs/promises`, `path`, `stream`, `fetch`, `node:http`, `node:test`, `node:util`）を使いこなせるようになる
  4. テスト付きの CLI ツールと REST API サーバーを自力で設計・実装できるようになる

---

## カリキュラム（目次）

### Part 1: TypeScript 型システムの基礎と応用

| 章 | タイトル | 主なトピック | 対応サンプル / 演習 |
| --- | --- | --- | --- |
| 第1章 | [TypeScript と Node.js の全体像・環境構築](./docs/01-introduction-and-setup.md) | 静的型付けの意義、実行モデル（tsc / tsx / Node ネイティブ実行）、環境構築 | — |
| 第2章 | [基本の型・型推論・ユニオン型](./docs/02-basic-types.md) | プリミティブ型、配列・タプル、型推論、リテラル型、`as const`、ユニオン/交差型 | [サンプル](./examples/02-basic-types.ts) / [演習](./exercises/ch02-basic-types.ts) |
| 第3章 | [関数・オブジェクト・型定義の設計](./docs/03-functions-and-objects.md) | 関数の型、オーバーロード、`interface` vs `type`、`readonly`、構造的部分型 | [サンプル](./examples/03-functions-and-objects.ts) |
| 第4章 | [型の絞り込みと安全性（Type Narrowing）](./docs/04-type-narrowing-and-safety.md) | 型ガード、判別可能ユニオン、網羅性チェック、`unknown` / `never`、`satisfies` | [サンプル](./examples/04-type-narrowing.ts) / [演習](./exercises/ch04-type-narrowing.ts) |
| 第5章 | [ジェネリクスと型レベルプログラミング入門](./docs/05-generics-and-utility-types.md) | Generics、`extends` 制約、`keyof` / `typeof`、Utility Types、Mapped / Conditional Types | [サンプル](./examples/05-generics-and-utilities.ts) / [演習](./exercises/ch05-generics.ts) |

### Part 2: モジュール・非同期処理・モダン Node.js

| 章 | タイトル | 主なトピック | 対応サンプル / 演習 |
| --- | --- | --- | --- |
| 第6章 | [モジュールシステムと tsconfig.json 完全理解](./docs/06-modules-and-tsconfig.md) | ESM vs CommonJS、モジュール解決、`tsconfig.json` の重要オプション完全解説 | — |
| 第7章 | [非同期処理と型安全なエラーハンドリング](./docs/07-async-and-error-handling.md) | イベントループ、`Promise` / `async-await`、並列制御、`Result` 型パターン、キャンセル処理 | [サンプル](./examples/07-async-and-result.ts) / [演習](./exercises/ch07-async-result.ts) |
| 第8章 | [モダン Node.js 実践](./docs/08-nodejs-essentials.md) | `node:` プレフィックス、`fs/promises`, `path`, `Stream`, `EventEmitter`, `fetch`, `node:http` | [サンプル](./examples/08-nodejs-essentials.ts) |

### Part 3: 実務開発環境と実践ハンズオン

| 章 | タイトル | 主なトピック | 対応プロジェクト |
| --- | --- | --- | --- |
| 第9章 | [実務の開発環境・テスト・コード品質](./docs/09-testing-and-tooling.md) | `node:test` / Vitest、Biome / ESLint、ランタイム検証、境界の型設計 | — |
| 第10章 | [実践ハンズオン：CLI ツール & REST API サーバー](./docs/10-hands-on-projects.md) | 依存ゼロで作る CLI Todo アプリ & REST API サーバーのアーキテクチャと実装 | [cli-todo](./projects/cli-todo/README.md) / [rest-api](./projects/rest-api/README.md) |
| 付録 | [TypeScript & Node.js 逆引きチートシート](./docs/appendix-cheatsheet.md) | 型演算・Utility Types・よく出る TS エラー対処法・Node.js API 早見表 | — |

---

## コンテンツ一覧（ファイル目次）

### 教科書本編（`docs/`）

- 第1章: [01-introduction-and-setup.md](./docs/01-introduction-and-setup.md) — 静的型付けの本質、Type Stripping / `tsx` / `tsc`、環境構築
- 第2章: [02-basic-types.md](./docs/02-basic-types.md) — 基本型、型推論、`as const`、ユニオン/交差型
- 第3章: [03-functions-and-objects.md](./docs/03-functions-and-objects.md) — 関数・オブジェクト、`interface` vs `type`、構造的部分型、Branded Types
- 第4章: [04-type-narrowing-and-safety.md](./docs/04-type-narrowing-and-safety.md) — 型ガード、判別可能ユニオン、`never` 網羅性チェック、`unknown`、`satisfies`
- 第5章: [05-generics-and-utility-types.md](./docs/05-generics-and-utility-types.md) — Generics、`extends` / `keyof`、Utility Types、Mapped / Conditional Types 入門
- 第6章: [06-modules-and-tsconfig.md](./docs/06-modules-and-tsconfig.md) — ESM vs CJS、`import type`、拡張子ルール、`tsconfig.json` 完全解説
- 第7章: [07-async-and-error-handling.md](./docs/07-async-and-error-handling.md) — イベントループ、`Promise` 並列制御、`AbortController`、`Result<T, E>` パターン
- 第8章: [08-nodejs-essentials.md](./docs/08-nodejs-essentials.md) — `node:` モジュール、`fs/promises`, `path`, `Stream`, `EventEmitter`, `fetch`, `node:http`, `parseArgs`
- 第9章: [09-testing-and-tooling.md](./docs/09-testing-and-tooling.md) — `node:test` / Vitest、Biome / ESLint、境界バリデーション、DI 設計
- 第10章: [10-hands-on-projects.md](./docs/10-hands-on-projects.md) — 実践アプリのアーキテクチャ解説と発展課題
- 付録: [appendix-cheatsheet.md](./docs/appendix-cheatsheet.md) — 型演算・よくある TS エラー対処法・Node.js API 早見表

### プロジェクト基盤

- [package.json](./package.json) — 実行・型チェック・テスト用スクリプトと開発依存パッケージ
- [tsconfig.json](./tsconfig.json) — 実務推奨の厳格な TypeScript 設定

### 章ごとのサンプルコード（`examples/`）

- [02-basic-types.ts](./examples/02-basic-types.ts) — 型推論・`as const`・ユニオン/交差型
- [03-functions-and-objects.ts](./examples/03-functions-and-objects.ts) — オプション引数・構造的部分型・Branded Types・クラス
- [04-type-narrowing.ts](./examples/04-type-narrowing.ts) — 判別可能ユニオン・網羅性チェック・型ガード・`satisfies`
- [05-generics-and-utilities.ts](./examples/05-generics-and-utilities.ts) — ジェネリクス・`keyof`・Utility Types・Mapped Types
- [07-async-and-result.ts](./examples/07-async-and-result.ts) — `Result<T, E>`・`Promise.allSettled`・`AbortController`
- [08-nodejs-essentials.ts](./examples/08-nodejs-essentials.ts) — `fs/promises`・`Stream`・`EventEmitter`・`URL`

---

### 自動テスト付き演習問題（`exercises/`）

- 進め方: [exercises/README.md](./exercises/README.md)
- 自動テスト: [exercises/exercises.test.ts](./exercises/exercises.test.ts)
- 問題ファイル:
  - [ch02-basic-types.ts](./exercises/ch02-basic-types.ts)（解答例: [solutions/ch02-basic-types.ts](./exercises/solutions/ch02-basic-types.ts)）
  - [ch04-type-narrowing.ts](./exercises/ch04-type-narrowing.ts)（解答例: [solutions/ch04-type-narrowing.ts](./exercises/solutions/ch04-type-narrowing.ts)）
  - [ch05-generics.ts](./exercises/ch05-generics.ts)（解答例: [solutions/ch05-generics.ts](./exercises/solutions/ch05-generics.ts)）
  - [ch07-async-result.ts](./exercises/ch07-async-result.ts)（解答例: [solutions/ch07-async-result.ts](./exercises/solutions/ch07-async-result.ts)）

### 実践ハンズオンプロジェクト（`projects/`）

- **CLI タスク管理ツール（`projects/cli-todo/`）**
  - [README.md](./projects/cli-todo/README.md) — 使い方・コマンド一覧
  - [store.ts](./projects/cli-todo/store.ts) — JSON 永続化・型ガード・`Result` 型
  - [cli.ts](./projects/cli-todo/cli.ts) — `parseArgs` による CLI インターフェース
  - [store.test.ts](./projects/cli-todo/store.test.ts) — 自動テスト
- **REST API サーバー（`projects/rest-api/`）**
  - [README.md](./projects/rest-api/README.md) — エンドポイント仕様・`curl` 例
  - [types.ts](./projects/rest-api/types.ts) — ドメインモデル・DTO・境界バリデーション
  - [repository.ts](./projects/rest-api/repository.ts) — リポジトリインターフェースとインメモリ実装
  - [server.ts](./projects/rest-api/server.ts) — `node:http` ルーター・JSON ボディ読み取り・エラー処理
  - [server.test.ts](./projects/rest-api/server.test.ts) — `fetch` による統合テスト

---

## クイックスタート

### 必要環境

- **Node.js 22.18 以上**（または **Node.js 24 LTS** 推奨）
  - Node.js 22.18+ / 24+ では TypeScript のネイティブ実行（Type Stripping）がデフォルト有効なため、ビルド不要で `.ts` を直接実行できます。
  - Node.js 20 系や 22.0〜22.17 を使う場合は `npm install` 後に `npx tsx <file.ts>` を使用してください。

### セットアップ

```bash
# 1. Node.js のバージョン確認
node -v

# 2. 開発依存パッケージ（TypeScript, @types/node, tsx）のインストール
npm install

# 3. プロジェクト全体の型チェックを実行
npm run typecheck
```

### サンプルコードの実行

```bash
# Node.js 22.18+ / 24+ の場合（ネイティブ実行）
node examples/02-basic-types.ts

# tsx を使う場合（Node 20+ 全般で動作）
npx tsx examples/02-basic-types.ts
```

### 演習問題とハンズオンのテスト実行

```bash
# 演習問題のテスト（最初は TODO 未実装のため失敗します）
npm run test:exercises

# 解答例のテスト（全テストパスを確認）
npm run test:solutions

# ハンズオンプロジェクトのテスト
npm run test:projects
```

---

## 効果的な進め方

1. **章を読む**: `docs/01-...` から順番に読み進めます。各章の「よくある落とし穴」は特に重要です。
2. **サンプルを動かして改造する**: `examples/` のコードを実行し、わざと型を壊して TypeScript コンパイラがどんなエラーを出すか体験しましょう。
3. **演習を解く**: [exercises/README.md](./exercises/README.md) に従って `TODO` を実装し、型チェックと自動テストをパスさせます。
4. **ハンズオンを拡張する**: 第10章の `projects/cli-todo` と `projects/rest-api` を読み込み、巻末の「発展課題」に挑戦してみましょう。
