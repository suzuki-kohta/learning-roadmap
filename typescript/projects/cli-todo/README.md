# ハンズオン 1: 型安全 CLI タスク管理ツール（`cli-todo`）

外部パッケージを使わず、Node.js 標準機能（`node:fs/promises`, `node:util` の `parseArgs`, `node:test`）と TypeScript の型設計だけで実装した CLI タスク管理アプリです。

## コマンド一覧

```bash
# タスクを追加
node projects/cli-todo/cli.ts add "TypeScriptの型ガードを復習する"

# 未完了タスク一覧を表示
node projects/cli-todo/cli.ts list

# 完了済みも含めて全タスクを表示
node projects/cli-todo/cli.ts list --all

# ID を指定してタスクを完了にする
node projects/cli-todo/cli.ts done 1

# 保存先 JSON ファイルを指定する
node projects/cli-todo/cli.ts --file ./my-todos.json list

# ヘルプ表示
node projects/cli-todo/cli.ts --help
```

## テストの実行

```bash
node --test projects/cli-todo/store.test.ts
```
