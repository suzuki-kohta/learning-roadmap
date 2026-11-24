/**
 * 第7章サンプル: 非同期処理（並列実行・タイムアウト）と Result<T, E> パターン
 * 実行: node examples/07-async-and-result.ts
 */

import { setTimeout as delay } from "node:timers/promises";

// 1. Result<T, E> 型とヘルパー
type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// 2. 想定内エラーを型で表現する
type ParsePortError =
  | { readonly code: "INVALID_FORMAT"; readonly raw: string }
  | { readonly code: "OUT_OF_RANGE"; readonly value: number };

function parsePort(raw: string): Result<number, ParsePortError> {
  if (!/^\d+$/.test(raw.trim())) {
    return err({ code: "INVALID_FORMAT", raw });
  }
  const port = Number(raw);
  if (port < 1 || port > 65535) {
    return err({ code: "OUT_OF_RANGE", value: port });
  }
  return ok(port);
}

for (const sample of ["3000", "99999", "abc"]) {
  const res = parsePort(sample);
  if (res.ok) {
    console.log(`[1] ポートOK: ${res.value}`);
  } else {
    console.log(`[1] ポートNG (${res.error.code}):`, res.error);
  }
}

// 3. 並列処理: Promise.all と Promise.allSettled
async function fakeFetch(name: string, ms: number, shouldFail = false): Promise<string> {
  await delay(ms);
  if (shouldFail) {
    throw new Error(`${name} failed`);
  }
  return `${name}:OK(${ms}ms)`;
}

const start = Date.now();
const settled = await Promise.allSettled([
  fakeFetch("service-A", 40),
  fakeFetch("service-B", 60, true),
  fakeFetch("service-C", 30),
]);
const elapsed = Date.now() - start;

console.log(`[2] Promise.allSettled 完了 (${elapsed}ms):`);
for (const item of settled) {
  if (item.status === "fulfilled") {
    console.log("  ✅", item.value);
  } else {
    const message = item.reason instanceof Error ? item.reason.message : String(item.reason);
    console.log("  ❌", message);
  }
}

// 4. AbortController による非同期処理のキャンセル
const controller = new AbortController();
setTimeout(() => controller.abort(new Error("タイムアウトで中断しました")), 30);

try {
  await delay(500, "完了値", { signal: controller.signal });
} catch (error: unknown) {
  if (error instanceof Error && error.name === "AbortError") {
    console.log("[3] AbortController で正常にキャンセル:", error.cause);
  } else {
    throw error;
  }
}
