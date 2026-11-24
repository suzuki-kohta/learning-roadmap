# 演習問題の進め方

このディレクトリには、各章の理解を定着させるための実践演習と自動テストが入っています。

## 演習一覧

| ファイル | 対応章 | テーマ |
| --- | --- | --- |
| [ch02-basic-types.ts](./ch02-basic-types.ts) | 第2章 | ユニオン型・リテラル型・配列の安全な扱い |
| [ch04-type-narrowing.ts](./ch04-type-narrowing.ts) | 第4章 | 判別可能ユニオン・網羅性チェック・ユーザー定義型ガード |
| [ch05-generics.ts](./ch05-generics.ts) | 第5章 | ジェネリクス・`keyof` 制約・Utility Types |
| [ch07-async-result.ts](./ch07-async-result.ts) | 第7章 | `Result<T, E>` 型・非同期リトライ・並列実行 |

## 進め方

1. 各問題ファイル内の `TODO` コメントを読み、関数を実装してください（関数のシグネチャとエクスポート名は変えないでください）。
2. 型チェックを実行して、型エラーがないことを確認します：
   ```bash
   npm run typecheck
   ```
3. 自動テストを実行して、仕様通りに動いているか確認します：
   ```bash
   npm run test:exercises
   ```
4. 詰まったときは `exercises/solutions/` にある解答例を参照してください。解答例が全テストをパスすることも以下で確認できます：
   ```bash
   npm run test:solutions
   ```
