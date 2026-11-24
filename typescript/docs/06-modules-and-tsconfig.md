# 第6章: モジュールシステムと `tsconfig.json` 完全理解

> **この章のゴール**
> - CommonJS（CJS）と ES Modules（ESM）の違い、および Node.js での ESM のルールを理解する
> - `import type`（`verbatimModuleSyntax`）と拡張子解決の仕組みを腹落ちさせる
> - `tsconfig.json` の重要オプションを「なぜその設定にするのか」まで説明できるようになる

---

## ESM vs CommonJS（CJS）

Node.js の歴史上、モジュールシステムは大きく2つ存在します。新規プロジェクトでは **ESM（ES Modules）** を選ぶのが現在の標準です。

| 項目 | CommonJS (CJS) | ES Modules (ESM) |
| --- | --- | --- |
| 構文 | `const x = require("./x")` / `module.exports = ...` | `import { x } from "./x.ts"` / `export ...` |
| 有効化条件 | デフォルト（または `.cjs`） | `package.json` に `"type": "module"`（または `.mjs`） |
| 読み込み方式 | 同期読み込み | 非同期・静的解析可能（Tree Shaking に有利） |
| Top-level `await` | ❌ 不可 | ✅ 可能 |
| `__dirname` / `__filename` | グローバルに存在 | `import.meta.dirname` / `import.meta.filename`（Node 20.11+） |

### Node.js ESM で覚えておくべき2大ルール

1. **相対パスのインポートには拡張子が必要**
   - Node.js の ESM ローダーは拡張子を自動補完しません（`import "./foo"` は実行時エラー）。
2. **`import.meta.dirname` を使う**
   - 従来の `fileURLToPath(new URL(".", import.meta.url))` は不要になり、Node.js 20.11+ では `import.meta.dirname` と `import.meta.filename` がそのまま使えます。

---

## `import type` と拡張子の書き方（実務で一番つまずく場所）

### `import type` を使う理由（`verbatimModuleSyntax: true`）

型だけをインポートするときは、必ず **`import type`** を使います。

```ts
// ✅ Good: 型インポートと値インポートを明確に分離
import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer } from "node:http";

// 同じファイルから値と型を一緒に読み込む場合
import { createStore, type TodoStore } from "./store.ts";
```

**なぜ重要か？**
Node.js のネイティブ TypeScript 実行（Type Stripping）や esbuild / SWC のような単一ファイル変換器は、他のファイルの中身を見ずに型を消去します。`import type` がないと「実行時の値として import したのに、存在しない！」とランタイムエラーになるからです。`tsconfig.json` に `"verbatimModuleSyntax": true` を入れておけば、書き忘れをコンパイラが教えてくれます。

### 相対インポートの拡張子：`.ts` vs `.js` の使い分け

プロジェクトのビルド方式によって拡張子の流儀が2つに分かれます。ここを理解しておけばもう迷いません。

| 実行・ビルド方式 | 相対インポートの書き方 | `tsconfig.json` の設定 |
| --- | --- | --- |
| **A. ビルドせず直接実行**<br>（Node 22.18+/24 ネイティブ実行、`tsx`） | `import { x } from "./foo.ts"` | `"noEmit": true`<br>`"allowImportingTsExtensions": true` |
| **B. `tsc` で JS にコンパイルして配布**<br>（TS 5.7+ の新方式） | `import { x } from "./foo.ts"` | `"rewriteRelativeImportExtensions": true`<br>（出力時に `.js` へ自動変換！） |
| **C. `tsc` で JS にコンパイル**<br>（従来の方式） | `import { x } from "./foo.js"` | `"module": "NodeNext"`<br>`"moduleResolution": "NodeNext"` |
| **D. バンドラを使用**<br>（Vite / esbuild / Next.js 等） | `import { x } from "./foo"`（拡張子省略可） | `"module": "ESNext"`<br>`"moduleResolution": "Bundler"` |

本リポジトリは **A（直接実行 + `tsc --noEmit` 型チェック）** を採用しています。

---

## `tsconfig.json` 重要オプション完全ガイド

本リポジトリの [tsconfig.json](../tsconfig.json) を題材に、必須オプションの意味を整理しましょう。

### 言語ターゲットとモジュール設定

```jsonc
{
  "compilerOptions": {
    "target": "ES2023",             // 出力 JS の構文レベル（Node 20+ なら ES2023 で十分）
    "lib": ["ES2023"],              // 使用可能な標準組み込み API の型定義（DOM を含めないことで誤って window を使うのを防ぐ）
    "types": ["node"],              // グローバルに読み込む @types パッケージを明示（不要な型汚染を防ぐ）
    "module": "NodeNext",           // Node.js の ESM/CJS 解決仕様に厳密に合わせる
    "moduleResolution": "NodeNext", // package.json の exports フィールド等を Node.js と同じく解決する
    "verbatimModuleSyntax": true    // 型専用インポートに import type を強制
  }
}
```

### 厳格な型チェック設定（ここが品質を決める）

- **`"strict": true`**: 以下の重要オプション群を一括で有効化します（新規プロジェクトでは**絶対必須**）。
  - `noImplicitAny`: 暗黙の `any` を禁止
  - `strictNullChecks`: `null` と `undefined` を厳格に区別
  - `strictFunctionTypes`: 関数引数の反変性チェック
  - `useUnknownInCatchVariables`: `catch (e)` の `e` を `any` ではなく `unknown` にする
- **`"noUncheckedIndexedAccess": true`**（超おすすめ）:
  - `arr[0]` や `obj[key]` の型に自動で `| undefined` を付与し、配列外アクセスによる実行時エラーを防ぎます。
- **`"noImplicitOverride": true`**:
  - 親クラスのメソッドを上書きするとき `override` キーワードを必須にし、意図しない上書きを防ぎます。
- **`"noFallthroughCasesInSwitch": true`**:
  - `switch` 文での `break` / `return` の書き忘れを検知します。
- **`"exactOptionalPropertyTypes": true`**（さらに厳密にしたい場合）:
  - `{ a?: string }` に `{ a: undefined }` を明示的に渡すことを禁止します（省略と `undefined` を厳密に区別したい API 設計で有効）。
- **`"erasableSyntaxOnly": true`**（TypeScript 5.8+）:
  - Node.js ネイティブ実行でエラーになる `enum` / `namespace` / コンストラクタパラメータプロパティの使用をコンパイル時に禁止します。

### パフォーマンス・運用設定

- **`"skipLibCheck": true`**: `node_modules` 内の `.d.ts` の型チェックをスキップし、コンパイルを高速化します（実務ではほぼ常に `true`）。
- **`"noEmit": true`**: JS ファイルを出力せず型チェックのみ行います。

---

## `package.json` と依存管理のキホン

- **`dependencies`**: 本番の実行時に必要なパッケージ（例：`zod`, `hono`）
- **`devDependencies`**: 開発・型チェック・テスト・ビルド時のみ必要なパッケージ（例：`typescript`, `@types/node`, `tsx`, `vitest`, `@biomejs/biome`）
- **ロックファイル（`package-lock.json` / `pnpm-lock.yaml`）**: チーム全員と CI で完全に同じバージョンを再現するため、必ず Git にコミットします。

---

## 理解度チェック

1. `verbatimModuleSyntax: true` を有効にしているとき、型だけをインポートするのに `import { User } from "./types.ts"` と書くとどうなりますか？
2. `lib` に `"DOM"` を入れず `["ES2023"]` にしているのは、Node.js バックエンド開発においてどのようなメリットがありますか？
3. `strict: true` だけでは有効にならないが、実務で特におすすめな追加オプションを1つ挙げ、何を防げるか説明してください。

---

次の章: [第7章: 非同期処理と型安全なエラーハンドリング](./07-async-and-error-handling.md)
