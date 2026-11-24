import crypto from "node:crypto";
import type { CreateTodoDto, Todo, UpdateTodoDto } from "./types.ts";

/**
 * 永続化層の契約（インターフェース）
 * 将来 DB（PostgreSQL / SQLite 等）へ差し替える場合も、この契約を実装すれば server.ts は変更不要。
 */
export interface TodoRepository {
  findAll(): Promise<readonly Todo[]>;
  findById(id: string): Promise<Todo | undefined>;
  create(input: CreateTodoDto): Promise<Todo>;
  update(id: string, input: UpdateTodoDto): Promise<Todo | undefined>;
  delete(id: string): Promise<boolean>;
}

export class InMemoryTodoRepository implements TodoRepository {
  readonly #items = new Map<string, Todo>();
  readonly #now: () => Date;

  constructor(now: () => Date = () => new Date()) {
    this.#now = now;
  }

  async findAll(): Promise<readonly Todo[]> {
    return [...this.#items.values()];
  }

  async findById(id: string): Promise<Todo | undefined> {
    return this.#items.get(id);
  }

  async create(input: CreateTodoDto): Promise<Todo> {
    const timestamp = this.#now().toISOString();
    const todo: Todo = {
      id: crypto.randomUUID(),
      title: input.title,
      completed: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.#items.set(todo.id, todo);
    return todo;
  }

  async update(id: string, input: UpdateTodoDto): Promise<Todo | undefined> {
    const existing = this.#items.get(id);
    if (existing === undefined) {
      return undefined;
    }

    const updated: Todo = {
      ...existing,
      title: input.title ?? existing.title,
      completed: input.completed ?? existing.completed,
      updatedAt: this.#now().toISOString(),
    };
    this.#items.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.#items.delete(id);
  }
}
