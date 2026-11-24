import fs from "node:fs/promises";
import path from "node:path";

export type TodoItem = {
  readonly id: number;
  readonly title: string;
  readonly done: boolean;
  readonly createdAt: string;
};

export type StoreError =
  | { readonly code: "EMPTY_TITLE" }
  | { readonly code: "NOT_FOUND"; readonly id: number }
  | { readonly code: "CORRUPTED_DATA"; readonly reason: string };

export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

function isTodoItem(value: unknown): value is TodoItem {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    typeof obj["id"] === "number" &&
    Number.isInteger(obj["id"]) &&
    typeof obj["title"] === "string" &&
    typeof obj["done"] === "boolean" &&
    typeof obj["createdAt"] === "string"
  );
}

function isTodoItemArray(value: unknown): value is TodoItem[] {
  return Array.isArray(value) && value.every(isTodoItem);
}

export interface TodoStore {
  list(): Promise<Result<readonly TodoItem[], StoreError>>;
  add(title: string): Promise<Result<TodoItem, StoreError>>;
  markDone(id: number): Promise<Result<TodoItem, StoreError>>;
}

export function createTodoStore(
  filePath: string,
  now: () => Date = () => new Date(),
): TodoStore {
  async function readTodos(): Promise<Result<TodoItem[], StoreError>> {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch (parseErr: unknown) {
        const reason =
          parseErr instanceof Error ? parseErr.message : String(parseErr);
        return err({ code: "CORRUPTED_DATA", reason });
      }

      if (!isTodoItemArray(parsed)) {
        return err({
          code: "CORRUPTED_DATA",
          reason: "JSON の構造が TodoItem[] と一致しません",
        });
      }
      return ok(parsed);
    } catch (readErr: unknown) {
      if (isErrnoException(readErr) && readErr.code === "ENOENT") {
        return ok([]);
      }
      throw readErr;
    }
  }

  async function writeTodos(todos: readonly TodoItem[]): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(todos, null, 2) + "\n", "utf8");
  }

  return {
    async list() {
      return readTodos();
    },

    async add(title: string) {
      const trimmed = title.trim();
      if (trimmed.length === 0) {
        return err({ code: "EMPTY_TITLE" });
      }

      const loaded = await readTodos();
      if (!loaded.ok) {
        return loaded;
      }

      const maxId = loaded.value.reduce((max, item) => Math.max(max, item.id), 0);
      const newTodo: TodoItem = {
        id: maxId + 1,
        title: trimmed,
        done: false,
        createdAt: now().toISOString(),
      };

      await writeTodos([...loaded.value, newTodo]);
      return ok(newTodo);
    },

    async markDone(id: number) {
      const loaded = await readTodos();
      if (!loaded.ok) {
        return loaded;
      }

      const target = loaded.value.find((item) => item.id === id);
      if (target === undefined) {
        return err({ code: "NOT_FOUND", id });
      }

      const updated: TodoItem = { ...target, done: true };
      const nextTodos = loaded.value.map((item) =>
        item.id === id ? updated : item,
      );
      await writeTodos(nextTodos);
      return ok(updated);
    },
  };
}
