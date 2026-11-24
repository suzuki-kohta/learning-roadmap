import http, { type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { InMemoryTodoRepository, type TodoRepository } from "./repository.ts";
import { validateCreateTodoDto, validateUpdateTodoDto } from "./types.ts";

const MAX_BODY_BYTES = 64 * 1024; // 64KB

type BodyReadResult =
  | { readonly ok: true; readonly value: unknown }
  | { readonly ok: false; readonly status: 400 | 413; readonly message: string };

async function readJsonBody(req: IncomingMessage): Promise<BodyReadResult> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    totalBytes += buf.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      return {
        ok: false,
        status: 413,
        message: "リクエストボディが大きすぎます（上限 64KB）",
      };
    }
    chunks.push(buf);
  }

  const rawText = Buffer.concat(chunks).toString("utf8");
  if (rawText.trim().length === 0) {
    return {
      ok: false,
      status: 400,
      message: "JSON ボディが空です",
    };
  }

  try {
    const parsed: unknown = JSON.parse(rawText);
    return { ok: true, value: parsed };
  } catch {
    return {
      ok: false,
      status: 400,
      message: "不正な JSON 形式です",
    };
  }
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function sendNoContent(res: ServerResponse): void {
  res.writeHead(204);
  res.end();
}

export function createAppServer(
  repository: TodoRepository = new InMemoryTodoRepository(),
): http.Server {
  async function handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const method = req.method ?? "GET";
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const segments = url.pathname.split("/").filter((s) => s.length > 0);

    // GET /health
    if (method === "GET" && url.pathname === "/health") {
      sendJson(res, 200, { status: "ok" });
      return;
    }

    // /todos
    if (segments.length === 1 && segments[0] === "todos") {
      if (method === "GET") {
        const items = await repository.findAll();
        sendJson(res, 200, { items });
        return;
      }

      if (method === "POST") {
        const bodyResult = await readJsonBody(req);
        if (!bodyResult.ok) {
          sendJson(res, bodyResult.status, { error: bodyResult.message });
          return;
        }

        const validation = validateCreateTodoDto(bodyResult.value);
        if (!validation.ok) {
          sendJson(res, 400, { error: validation.message });
          return;
        }

        const created = await repository.create(validation.value);
        sendJson(res, 201, created);
        return;
      }
    }

    // /todos/:id
    if (segments.length === 2 && segments[0] === "todos") {
      const id = decodeURIComponent(segments[1] ?? "");

      if (method === "GET") {
        const todo = await repository.findById(id);
        if (todo === undefined) {
          sendJson(res, 404, { error: "Todo が見つかりません" });
          return;
        }
        sendJson(res, 200, todo);
        return;
      }

      if (method === "PATCH") {
        const bodyResult = await readJsonBody(req);
        if (!bodyResult.ok) {
          sendJson(res, bodyResult.status, { error: bodyResult.message });
          return;
        }

        const validation = validateUpdateTodoDto(bodyResult.value);
        if (!validation.ok) {
          sendJson(res, 400, { error: validation.message });
          return;
        }

        const updated = await repository.update(id, validation.value);
        if (updated === undefined) {
          sendJson(res, 404, { error: "Todo が見つかりません" });
          return;
        }
        sendJson(res, 200, updated);
        return;
      }

      if (method === "DELETE") {
        const deleted = await repository.delete(id);
        if (!deleted) {
          sendJson(res, 404, { error: "Todo が見つかりません" });
          return;
        }
        sendNoContent(res);
        return;
      }
    }

    sendJson(res, 404, { error: "エンドポイントが見つかりません" });
  }

  return http.createServer((req, res) => {
    void handleRequest(req, res).catch((error: unknown) => {
      console.error("Unhandled server error:", error);
      if (!res.headersSent) {
        sendJson(res, 500, { error: "Internal Server Error" });
      }
    });
  });
}

// 直接実行された場合のみサーバーをリッスンする
const isDirectExecution =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectExecution) {
  const rawPort = process.env["PORT"] ?? "3000";
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT environment variable: ${rawPort}`);
  }

  const server = createAppServer();
  server.listen(port, () => {
    console.log(`REST API server listening on http://localhost:${port}`);
  });

  const shutdown = (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down...`);
    server.close(() => {
      process.exit(0);
    });
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}
