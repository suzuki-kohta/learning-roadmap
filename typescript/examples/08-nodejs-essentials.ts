/**
 * 第8章サンプル: モダン Node.js 実践（fs/promises, path, Stream, EventEmitter, URL）
 * 実行: node examples/08-nodejs-essentials.ts
 */

import fs from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import os from "node:os";
import path from "node:path";
import { EventEmitter } from "node:events";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

// 1. 型安全な EventEmitter
type AuditEvents = {
  fileWritten: [info: { filePath: string; bytes: number }];
};

const emitter = new EventEmitter<AuditEvents>();
emitter.on("fileWritten", ({ filePath, bytes }) => {
  console.log(`[1] EventEmitter 通知: ${path.basename(filePath)} (${bytes} bytes)`);
});

// 2. 一時ディレクトリ作成 + fs/promises でファイル読み書き（終了時にクリーンアップ）
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ts-textbook-"));
try {
  const inputPath = path.join(tempDir, "notes.txt");
  const outputPath = path.join(tempDir, "notes-upper.txt");

  const content = "typescript\nmodern nodejs\nstreams and promises\n";
  await fs.writeFile(inputPath, content, "utf8");
  emitter.emit("fileWritten", {
    filePath: inputPath,
    bytes: Buffer.byteLength(content, "utf8"),
  });

  // 3. stream/promises の pipeline でファイル内容を大文字変換して別ファイルへ出力
  const toUpperTransform = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      callback(null, chunk.toString("utf8").toUpperCase());
    },
  });

  await pipeline(
    createReadStream(inputPath),
    toUpperTransform,
    createWriteStream(outputPath),
  );

  // 4. Readable ストリームを for await でチャンク読み取り
  const chunks: string[] = [];
  for await (const chunk of createReadStream(outputPath, { encoding: "utf8" })) {
    chunks.push(String(chunk));
  }
  console.log("[2] Stream 変換結果:\n" + chunks.join("").trim());

  // 5. URL / URLSearchParams による安全なクエリ生成
  const apiUrl = new URL("/api/todos", "https://example.com");
  apiUrl.searchParams.set("status", "done");
  apiUrl.searchParams.set("limit", "10");
  console.log("[3] URL 生成:", apiUrl.toString());
} finally {
  // 一時ディレクトリを確実に削除
  await fs.rm(tempDir, { recursive: true, force: true });
  console.log("[4] 一時ディレクトリを削除しました");
}
