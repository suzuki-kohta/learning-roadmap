# 第1章: TypeScript と Node.js の全体像・環境構築

> **この章のゴール**
> - TypeScript の本質（静的型チェック + 型消去）を正確に説明できるようになる
> - Node.js における TypeScript の実行方式（`tsc` / `tsx` / Node ネイティブ実行）の違いを理解する
> - モダンな TypeScript + Node.js 開発環境を自力で構築できる

---

## TypeScript とは何か？（本質を3行で）

TypeScript は **「JavaScript に静的型システムを追加したスーパーセット」** です。

1. **開発時（コンパイル時）に型エラーを検出**し、タイポ・`undefined` 参照・引数の取り違えを実行前に防ぐ
2. **エディタ補完（IntelliSense）と安全なリファクタリング**を可能にする
3. **実行時には型情報はすべて消去（Type Erasure）**され、ただの JavaScript として動作する

### 最重要ポイント：型は実行時には存在しない

```ts
type User = {
  id: number;
  name: string;
};

// ❌ コンパイルエラー: User は「型」であって「値」ではないため、実行時に instanceof は使えない
// if (data instanceof User) {}
```

TypeScript の型は**コンパイル時のチェック装置**であり、ネットワーク経由の JSON やユーザー入力（外部データ）を自動で検証してくれるわけではありません。外部データのチェックには第4章・第9章で学ぶ**型ガード**や**ランタイムバリデーション**が必要です。

---

## Node.js とは何か？なぜ TypeScript と相性が良いのか

**Node.js** は、Chrome の V8 JavaScript エンジン上で動作するサーバーサイド／CLI 向けランタイムです。

- **特徴**:
  - シングルスレッド + **イベントループによるノンブロッキング I/O**（ファイル読み書き・通信を効率よく捌ける）
  - フロントエンドと同じ TypeScript でバックエンド・CLI・ビルドツールを統一できる
  - 近年は Web 標準 API（`fetch`, `URL`, `Web Streams`, `AbortController`, `crypto`）の標準搭載が進み、外部ライブラリなしでも非常に強力

---

## TypeScript の実行モデル（2025〜2026年の標準知識）

かつては「TypeScript を書く → `tsc` で JS に変換 → `node` で実行」が唯一のルートでした。現在は用途に応じて3つの方式を使い分けます。

| 方式 | コマンド例 | 特徴・向いている用途 |
| --- | --- | --- |
| **1. Node.js ネイティブ実行（Type Stripping）** | `node app.ts` | Node.js 22.18+ / 24+ でデフォルト有効。型注釈を空白に置き換えて高速実行。**型チェックはしない**ため `tsc --noEmit` と併用する。`enum` など消去不能構文は非推奨。 |
| **2. 開発用ランナー（`tsx`）** | `npx tsx app.ts` | esbuild ベースで高速実行。Node 20 でも動作し、watch モード（`tsx watch`）が便利。こちらも型チェックは `tsc --noEmit` と併用。 |
| **3. トランスパイル / バンドル（`tsc` / `tsup` / `esbuild`）** | `tsc && node dist/app.js` | npm ライブラリ配布（`.d.ts` 生成が必要）や、古い Node 環境向けの本番ビルドに使用。 |

> **実務の黄金ルール**
> 実行ツール（`node` や `tsx` や `esbuild`）は「高速実行のために型を剥がすだけ」であり、**型チェックを行いません**。必ず CI や開発中に `tsc --noEmit`（本リポジトリでは `npm run typecheck`）を実行して型の安全性を検証しましょう。

---

## 環境構築手順

### Node.js のインストール（バージョン管理ツール推奨）

OS 直接インストールではなく、バージョン管理ツール（`fnm` / `nvm` / `mise` / `Volta`）を使うのが実務の標準です。

```bash
# 例: mise を使う場合
mise use --global node@lts

# バージョン確認（Node.js 22.18+ または 24 LTS 推奨）
node -v
npm -v
```

### ゼロから TypeScript + Node.js プロジェクトを作る手順

新しく自分でプロジェクトを立ち上げるときの最小手順を覚えておきましょう。

```bash
mkdir my-ts-app && cd my-ts-app

# 1. package.json の生成
npm init -y

# 2. package.json に "type": "module" を追加（ESM を有効化）
npm pkg set type="module"

# 3. TypeScript と Node.js の型定義をインストール
npm install -D typescript @types/node tsx

# 4. tsconfig.json の雛形を作成（第6章で最適な設定を詳しく解説）
npx tsc --init
```

### `@types/node` はなぜ必要？

Node.js の標準モジュール（`node:fs`, `node:http`, `process` 等）は JavaScript で書かれているため、TypeScript コンパイラはそれらの型を知りません。`@types/node` を `devDependencies` に入れることで、`node:fs` などの型補完と型チェックが有効になります。

---

## このリポジトリでの動作確認

この教科書のルートディレクトリで以下を実行してみてください。

```bash
# 依存パッケージのインストール
npm install

# プロジェクト全体の型チェック（エラー0件ならOK）
npm run typecheck

# サンプルコードの実行（Node 22.18+ / 24+）
node examples/02-basic-types.ts

# Node 20〜22.17 の場合は tsx を使用
npx tsx examples/02-basic-types.ts
```

---

## 理解度チェック

1. TypeScript で定義した `type User = { name: string }` は、コンパイル後の JavaScript に残るでしょうか？
2. `node app.ts` や `npx tsx app.ts` を実行したとき、型エラーは検出されるでしょうか？検出するには何を実行すべきでしょうか？
3. `@types/node` は `dependencies` と `devDependencies` のどちらに入れるべきでしょうか？（ヒント：実行時に型は必要か？）

---

次の章: [第2章: 基本の型・型推論・ユニオン型](./02-basic-types.md)
