import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createTodoStore } from "./store.ts";

describe("cli-todo: TodoStore", () => {
  let tempDir: string;
  let dataFile: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "cli-todo-test-"));
    dataFile = path.join(tempDir, "todos.json");
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("初期状態（ファイル未存在）では空配列を返す", async () => {
    const store = createTodoStore(dataFile);
    const res = await store.list();
    assert.deepEqual(res, { ok: true, value: [] });
  });

  it("タスクの追加・一覧取得・完了更新ができる", async () => {
    const fixedDate = new Date("2026-11-24T00:00:00.000Z");
    const store = createTodoStore(dataFile, () => fixedDate);

    const added1 = await store.add("  第1章を読む  ");
    assert.equal(added1.ok, true);
    if (added1.ok) {
      assert.deepEqual(added1.value, {
        id: 1,
        title: "第1章を読む",
        done: false,
        createdAt: "2026-11-24T00:00:00.000Z",
      });
    }

    const added2 = await store.add("演習を解く");
    assert.equal(added2.ok, true);
    if (added2.ok) {
      assert.equal(added2.value.id, 2);
    }

    const doneRes = await store.markDone(1);
    assert.equal(doneRes.ok, true);
    if (doneRes.ok) {
      assert.equal(doneRes.value.done, true);
    }

    const all = await store.list();
    assert.equal(all.ok, true);
    if (all.ok) {
      assert.equal(all.value.length, 2);
      assert.equal(all.value[0]?.done, true);
      assert.equal(all.value[1]?.done, false);
    }
  });

  it("空タイトルや存在しない ID に対して適切なエラーを返す", async () => {
    const store = createTodoStore(dataFile);

    const emptyRes = await store.add("   ");
    assert.deepEqual(emptyRes, { ok: false, error: { code: "EMPTY_TITLE" } });

    const notFoundRes = await store.markDone(999);
    assert.deepEqual(notFoundRes, {
      ok: false,
      error: { code: "NOT_FOUND", id: 999 },
    });
  });

  it("壊れた JSON ファイルを読み込んだときに CORRUPTED_DATA を返す", async () => {
    await fs.writeFile(dataFile, '{"not": "an array"}', "utf8");
    const store = createTodoStore(dataFile);

    const res = await store.list();
    assert.equal(res.ok, false);
    if (!res.ok) {
      assert.equal(res.error.code, "CORRUPTED_DATA");
    }
  });
});
