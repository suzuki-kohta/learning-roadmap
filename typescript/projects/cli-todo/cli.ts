import path from "node:path";
import { parseArgs } from "node:util";
import { createTodoStore, type StoreError } from "./store.ts";

const HELP_TEXT = `
使い方:
  node projects/cli-todo/cli.ts <command> [args] [options]

コマンド:
  add <title>    新しいタスクを追加する
  list           タスク一覧を表示する（デフォルトは未完了のみ）
  done <id>      指定した ID のタスクを完了にする

オプション:
  -f, --file <path>  データ保存先の JSON ファイル（デフォルト: ./todos.json）
  -a, --all          list 時に完了済みタスクも表示する
  -h, --help         このヘルプを表示する
`.trim();

function formatStoreError(error: StoreError): string {
  switch (error.code) {
    case "EMPTY_TITLE":
      return "エラー: タスクのタイトルは空にできません。";
    case "NOT_FOUND":
      return `エラー: ID=${error.id} のタスクは見つかりませんでした。`;
    case "CORRUPTED_DATA":
      return `エラー: データファイルが破損しています（${error.reason}）`;
  }
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      file: { type: "string", short: "f", default: path.resolve("todos.json") },
      all: { type: "boolean", short: "a", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
    allowPositionals: true,
  });

  const command = positionals[0];
  if (values.help || command === undefined) {
    console.log(HELP_TEXT);
    return;
  }

  const targetFile = values.file ?? path.resolve("todos.json");
  const store = createTodoStore(path.resolve(targetFile));

  switch (command) {
    case "add": {
      const title = positionals.slice(1).join(" ");
      const res = await store.add(title);
      if (!res.ok) {
        console.error(formatStoreError(res.error));
        process.exitCode = 1;
        return;
      }
      console.log(`追加しました: [${res.value.id}] ${res.value.title}`);
      return;
    }

    case "list": {
      const res = await store.list();
      if (!res.ok) {
        console.error(formatStoreError(res.error));
        process.exitCode = 1;
        return;
      }

      const items = values.all
        ? res.value
        : res.value.filter((todo) => !todo.done);

      if (items.length === 0) {
        console.log("表示するタスクはありません。");
        return;
      }

      for (const todo of items) {
        const mark = todo.done ? "[x]" : "[ ]";
        console.log(`${mark} ${todo.id}: ${todo.title}`);
      }
      return;
    }

    case "done": {
      const rawId = positionals[1];
      const id = Number(rawId);
      if (rawId === undefined || !Number.isInteger(id) || id <= 0) {
        console.error("エラー: 有効なタスク ID（正の整数）を指定してください。");
        process.exitCode = 1;
        return;
      }

      const res = await store.markDone(id);
      if (!res.ok) {
        console.error(formatStoreError(res.error));
        process.exitCode = 1;
        return;
      }
      console.log(`完了にしました: [${res.value.id}] ${res.value.title}`);
      return;
    }

    default: {
      console.error(`不明なコマンドです: ${command}\n`);
      console.log(HELP_TEXT);
      process.exitCode = 1;
    }
  }
}

await main();
