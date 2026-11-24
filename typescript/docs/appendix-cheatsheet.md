# 付録: TypeScript & Node.js 逆引きチートシート

困ったときにすぐ引けるリファレンスと、TypeScript で頻繁に出会うエラーメッセージの対処法集です。

## TypeScript 型演算子・構文 早見表

| やりたいこと | 書き方 | 例 |
| --- | --- | --- |
| 値から型を取り出す | `typeof value` | `type Config = typeof defaultConfig` |
| オブジェクトのキーをユニオン型に | `keyof T` | `type Keys = keyof User` |
| プロパティの型を取り出す | `T["prop"]` | `type Id = User["id"]` |
| 配列の要素型を取り出す | `T[number]` | `type Item = (typeof list)[number]` |
| `as const` オブジェクトの値をユニオンに | `(typeof Obj)[keyof typeof Obj]` | `type Status = (typeof Status)[keyof typeof Status]` |
| リテラル型を保ったまま型チェック | `satisfies T` | `const cfg = { ... } as const satisfies Config` |
| 型だけをインポート | `import type { ... }` | `import type { User } from "./types.ts"` |
| ユーザー定義型ガード | `(x: unknown): x is T` | `function isUser(x: unknown): x is User` |
| 網羅性チェック | `const _: never = value` | `switch` の `default` で漏れ検知 |

---

## よく出る TypeScript コンパイルエラーと対処法

### `TS2532: Object is possibly 'undefined'` / `TS18048: 'x' is possibly 'undefined'`

- **原因**: `strictNullChecks` や `noUncheckedIndexedAccess` により、`undefined` の可能性が排除できていない。
- **対処法**:
  - 存在チェック（`if (x !== undefined) { ... }`）で絞り込む
  - デフォルト値を使う（`const value = x ?? defaultValue`）
  - オプショナルチェーンを使う（`user?.profile?.name`）
  - ❌ 安易に `x!`（Non-null assertion）で握りつぶさない

### `TS2322: Type 'string' is not assignable to type '"GET" | "POST"'`

- **原因**: `let method = "GET"` のように広い型（`string`）に推論された値を、リテラル型に代入しようとした。
- **対処法**: `const method = "GET"` にするか、`{ method: "GET" } as const` を付ける。

### `TS1484: '...' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled`

- **原因**: 型エイリアスやインターフェースを通常の `import` で読み込んだ。
- **対処法**: `import type { Foo } from "./foo.ts"` に変更する。

### `TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '...'`

- **原因**: 固定キーを持つオブジェクト型 `User` に対して、任意の `string` 変数で `user[key]` とアクセスした。
- **対処法**: キー変数の型を `keyof User` に制約するか、動的辞書なら `Record<string, V>` / `Map<string, V>` を使う。

### `TS2345` / `TS2322` で長いエラーメッセージが出たときの読み方

TypeScript のエラーは **「一番下の行（最も内側の具体的な不一致）」から上に向かって読む** のがコツです！

---

## モダン Node.js 標準 API 早見表

| 用途 | モジュール / グローバル | 代表的な API |
| --- | --- | --- |
| ファイル操作 | `node:fs/promises` | `readFile`, `writeFile`, `mkdir`, `rm`, `readdir`, `stat` |
| パス結合・解決 | `node:path` | `join`, `resolve`, `basename`, `extname`, `dirname` |
| 現在のファイル位置 | ESM 組み込み | `import.meta.dirname`, `import.meta.filename` |
| HTTP クライアント | グローバル（Web標準） | `fetch`, `URL`, `URLSearchParams`, `AbortSignal.timeout` |
| HTTP サーバー | `node:http` | `createServer` |
| ストリーム連携 | `node:stream/promises` | `pipeline` |
| CLI 引数解析 | `node:util` | `parseArgs` |
| 非同期タイマー | `node:timers/promises` | `setTimeout(ms)` |
| UUID / ハッシュ | `node:crypto` | `randomUUID()`, `createHash("sha256")` |
| テスト実行 | `node:test`, `node:assert/strict` | `describe`, `it`, `assert.equal`, `assert.deepEqual` |
| ディープコピー | グローバル（Web標準） | `structuredClone(obj)` |

## 次に学ぶべきステップ（ロードマップ）

この教科書を終えたら、自分の作りたいものに合わせて次の技術へ進むのがおすすめです。

- **Web API / バックエンド**: Hono または Fastify + Zod（バリデーション）+ Drizzle ORM / Prisma（DB）
- **フロントエンド**: React + TypeScript（Vite / Next.js）
- **モノレポ・ビルド**: pnpm workspaces / tsup / Vitest / Biome
- **型システムのさらなる深掘り**: Type Challenges（型パズルの練習集）
