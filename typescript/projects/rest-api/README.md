# ハンズオン 2: 依存ゼロの型安全 REST API サーバー（`rest-api`）

外部フレームワークを使わず、Node.js 標準の `node:http` と TypeScript の型設計だけで構築した Todo REST API サーバーです。

## エンドポイント仕様

| Method | Path | 説明 | ステータス |
| --- | --- | --- | --- |
| `GET` | `/health` | ヘルスチェック | `200 OK` |
| `GET` | `/todos` | Todo 一覧取得 | `200 OK` |
| `GET` | `/todos/:id` | 指定 ID の Todo 取得 | `200 OK` / `404 Not Found` |
| `POST` | `/todos` | Todo 新規作成（`{ "title": string }`） | `201 Created` / `400 Bad Request` |
| `PATCH` | `/todos/:id` | Todo 部分更新（`{ "title"?: string, "completed"?: boolean }`） | `200 OK` / `400` / `404` |
| `DELETE` | `/todos/:id` | Todo 削除 | `204 No Content` / `404 Not Found` |

## 起動と動作確認

```bash
# サーバー起動（デフォルトポート: 3000。PORT 環境変数で変更可能）
node projects/rest-api/server.ts

# 統合テスト実行
node --test projects/rest-api/server.test.ts
```

### `curl` でのリクエスト例

```bash
curl -s http://localhost:3000/health
curl -s -X POST http://localhost:3000/todos -H "Content-Type: application/json" -d '{"title":"APIを作る"}'
curl -s http://localhost:3000/todos
```
