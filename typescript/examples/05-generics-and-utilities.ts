/**
 * 第5章サンプル: ジェネリクス・制約・keyof・Utility Types・Mapped/Conditional Types
 * 実行: node examples/05-generics-and-utilities.ts
 */

import crypto from "node:crypto";

// 1. ジェネリクスと keyof 制約
function groupBy<T, K extends keyof T>(
  items: readonly T[],
  key: K,
): Map<T[K], T[]> {
  const groups = new Map<T[K], T[]>();
  for (const item of items) {
    const groupKey = item[key];
    const bucket = groups.get(groupKey);
    if (bucket !== undefined) {
      bucket.push(item);
    } else {
      groups.set(groupKey, [item]);
    }
  }
  return groups;
}

type Employee = {
  readonly id: number;
  readonly name: string;
  readonly department: "engineering" | "design" | "sales";
};

const employees: readonly Employee[] = [
  { id: 1, name: "Alice", department: "engineering" },
  { id: 2, name: "Bob", department: "design" },
  { id: 3, name: "Carol", department: "engineering" },
];

const byDept = groupBy(employees, "department");
console.log("[1] 部署別グループ:", Object.fromEntries(byDept));

// 2. Utility Types（Single Source of Truth から派生型を生成）
type Todo = {
  readonly id: string;
  readonly title: string;
  readonly completed: boolean;
  readonly createdAt: string;
};

type CreateTodoInput = Omit<Todo, "id" | "createdAt">;
type UpdateTodoInput = Partial<Pick<Todo, "title" | "completed">>;

function createTodo(input: CreateTodoInput): Todo {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };
}

function updateTodo(todo: Todo, patch: UpdateTodoInput): Todo {
  return { ...todo, ...patch };
}

const todo = createTodo({ title: "Generics を学ぶ", completed: false });
const updated = updateTodo(todo, { completed: true });
console.log("[2] Utility Types CRUD:", updated);

// 3. Mapped Types によるバリデーションエラー型
type FieldErrors<T> = {
  [K in keyof T]?: string;
};

function validateTodoInput(input: CreateTodoInput): FieldErrors<CreateTodoInput> {
  const errors: FieldErrors<CreateTodoInput> = {};
  if (input.title.trim().length === 0) {
    errors.title = "タイトルは必須です";
  }
  return errors;
}

console.log("[3] Mapped Types バリデーション:", validateTodoInput({ title: "  ", completed: false }));
