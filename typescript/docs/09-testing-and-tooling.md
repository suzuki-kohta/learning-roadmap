# 第9章: 実務の開発環境・テスト・コード品質

> **この章のゴール**
> - Node.js 標準テストランナー（`node:test` + `node:assert/strict`）と Vitest の特徴と書き方を理解する
> - リンター・フォーマッター（Biome / ESLint + Prettier）と CI チェックの標準構成を知る
> - 「システムの境界」で外部データを検証し、内部を純粋な型安全空間に保つ設計原則を習得する

---

## テストを書く：Node.js 標準 `node:test` と Vitest

型チェック（`tsc`）は「型の整合性」を保証しますが、「ビジネスロジックの正しさ」までは保証しません。**型チェック + 自動テスト**の両輪が揃って初めて安心してリファクタリングできます。

### `node:test`（Node.js 20+ 標準搭載・依存ゼロ）

本リポジトリの演習・ハンズオンテストでも使用している、Node.js 組み込みの高速なテストランナーです。

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";

function calcTax(price: number, rate = 0.1): number {
  return Math.floor(price * (1 + rate));
}

describe("calcTax", () => {
  it("標準税率10%で税込価格を計算できる", () => {
    assert.equal(calcTax(1000), 1100);
  });

  it("軽減税率8%を指定できる", () => {
    assert.equal(calcTax(1000, 0.08), 1080);
  });
});
```

```bash
# 実行コマンド
node --test path/to/file.test.ts
```

### Vitest（実務で最も人気のテストフレームワーク）

大規模プロジェクトやフロントエンド併用、高度なモック、watch モード、カバレッジレポートが必要な場合は **Vitest** が第一候補です。API は Jest 互換で、`vi.fn()` / `expect(...).toEqual(...)` が直感的に書けます。

| 観点 | `node:test` | Vitest |
| --- | --- | --- |
| インストール | 不要（標準組み込み） | `npm i -D vitest` |
| 起動速度 | 非常に高速 | 高速（watch 体験が最高） |
| モック・スナップショット・UI | 基本機能あり | 非常に充実 |
| おすすめ用途 | CLI・軽量ライブラリ・学習 | 中〜大規模アプリ、フロント共通基盤 |

---

## Linter / Formatter（コード品質の自動化）

コードレビューで「インデント」「セミコロン」「未使用変数」を人間が指摘するのは時間の無駄です。ツールにすべて任せましょう。

### 2つの主流構成

1. **Biome（Rust 製・オールインワンで超高速）**
   - フォーマット + リントを1ツールで完結でき、設定ファイルも `biome.json` 1つだけ。新規プロジェクトで急速に普及しています。
2. **ESLint（Flat Config: `eslint.config.js`）+ `typescript-eslint` + Prettier**
   - 型情報を活用した強力なルール（**Type-aware linting**：`@typescript-eslint/no-floating-promises` のような `await` 忘れ検知など）が最強。大規模・厳格なチーム開発で依然として強力です。

### 実務で特に効果が高い Lint ルール（意識したいポイント）

- **`no-floating-promises`**: `Promise` を返す関数を `await` も `.catch()` もし忘れるバグを検出
- **`no-explicit-any`**: `any` の混入を禁止
- **`consistent-type-imports`**: 型インポートに `import type` を強制

---

## 実務の設計原則：「境界で検証し、内部は型を信じる」

TypeScript アプリケーションが壊れる最大の原因は、**外部との境界（HTTP リクエスト、環境変数、DB 結果、JSON ファイル）から不正なデータが侵入すること**です。

```text
[外部世界: unknown]  ──▶  (境界: バリデーション / 型ガード)  ──▶  [内部世界: 厳密なドメイン型]
  - HTTP JSON body           ここで不正を弾き Result / 400 を返す       ここからは型を100%信頼して
  - ファイル入力                                                      ビジネスロジックを簡潔に書ける
  - 環境変数
  - 外部APIレスポンス
```

### 境界バリデーションの2つの選択肢

1. **依存ゼロで型ガード関数を書く**（本リポジトリのハンズオンで採用）
   - 仕組みを完全に理解でき、小さなプロジェクトに最適。
2. **スキーマバリデーションライブラリを使う（Zod / Valibot）**
   - 実務の API 開発では定番。「バリデーションルール」と「TypeScript の型」を1箇所で定義できます。

```ts
// 例：Zod を使った場合（参考イメージ）
// import { z } from "zod";
//
// const CreateUserSchema = z.object({
//   name: z.string().min(1).max(100),
//   email: z.string().email(),
// });
//
// // スキーマから TypeScript の型を自動生成！二重管理がゼロになる
// type CreateUserInput = z.infer<typeof CreateUserSchema>;
```

---

## テスタブルな設計：依存性の注入（DI）

関数やサービスが直接 `Date.now()` やファイルシステム、外部 HTTP に密結合していると、テストが不安定になります。**インターフェース（または関数引数）で依存を外から渡せるようにする**だけで、テストが一気に簡単になります。

```ts
// ❌ テストしにくい（現在時刻に依存して結果が変わる）
function isExpiredBad(expiresAt: Date): boolean {
  return Date.now() > expiresAt.getTime();
}

// ✅ テストしやすい（現在時刻の取得方法をデフォルト引数で注入可能にする）
function isExpiredGood(expiresAt: Date, now: () => number = Date.now): boolean {
  return now() > expiresAt.getTime();
}

// テスト時は固定時刻を渡せる！
// assert.equal(isExpiredGood(new Date("2026-01-01"), () => Date.parse("2026-01-02")), true);
```

第10章の `projects/rest-api` では、この原則を活かして `TodoRepository` インターフェースを分離しています。

---

## CI で毎回回すべき4点セット

GitHub Actions などの CI では、Pull Request ごとに最低限この4つを自動実行するのが実務のスタンダードです。

1. **Format / Lint**: `biome check .`（または `eslint .`）
2. **Type Check**: `tsc --noEmit`
3. **Unit / Integration Tests**: `node --test`（または `vitest run`）
4. **Build**（配布物がある場合）: `npm run build`

---

次の章: [第10章: 実践ハンズオン：CLI ツール & REST API サーバー](./10-hands-on-projects.md)
