import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import type http from "node:http";
import { createAppServer } from "./server.ts";
import type { Todo } from "./types.ts";

describe("rest-api: Todo HTTP Server", () => {
  let server: http.Server;
  let baseUrl: string;

  beforeEach(async () => {
    server = createAppServer();
    await new Promise<void>((resolve) => {
      // ポート 0 を指定して OS に空きポートを自動割り当てさせる
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    if (address === null || typeof address === "string") {
      throw new Error("Failed to get bound server address");
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err !== undefined ? reject(err) : resolve()));
    });
  });

  it("GET /health で 200 OK を返す", async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: "ok" });
  });

  it("Todo の作成・取得・更新・削除（CRUD）が一通り動作する", async () => {
    // 1. Create
    const createRes = await fetch(`${baseUrl}/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "TypeScript を極める" }),
    });
    assert.equal(createRes.status, 201);
    const created = (await createRes.json()) as Todo;
    assert.equal(created.title, "TypeScript を極める");
    assert.equal(created.completed, false);
    assert.ok(created.id.length > 0);

    // 2. List
    const listRes = await fetch(`${baseUrl}/todos`);
    assert.equal(listRes.status, 200);
    const listBody = (await listRes.json()) as { items: Todo[] };
    assert.equal(listBody.items.length, 1);

    // 3. Get by ID
    const getRes = await fetch(`${baseUrl}/todos/${created.id}`);
    assert.equal(getRes.status, 200);
    const fetched = (await getRes.json()) as Todo;
    assert.equal(fetched.id, created.id);

    // 4. Patch
    const patchRes = await fetch(`${baseUrl}/todos/${created.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    assert.equal(patchRes.status, 200);
    const updated = (await patchRes.json()) as Todo;
    assert.equal(updated.completed, true);
    assert.equal(updated.title, "TypeScript を極める");

    // 5. Delete
    const deleteRes = await fetch(`${baseUrl}/todos/${created.id}`, {
      method: "DELETE",
    });
    assert.equal(deleteRes.status, 204);

    // 6. 削除後は 404
    const afterDeleteRes = await fetch(`${baseUrl}/todos/${created.id}`);
    assert.equal(afterDeleteRes.status, 404);
  });

  it("不正なリクエストに対して 400 Bad Request を返す", async () => {
    const emptyTitleRes = await fetch(`${baseUrl}/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "   " }),
    });
    assert.equal(emptyTitleRes.status, 400);

    const invalidJsonRes = await fetch(`${baseUrl}/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{broken-json",
    });
    assert.equal(invalidJsonRes.status, 400);
  });
});
