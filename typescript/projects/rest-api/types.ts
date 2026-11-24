export type Todo = {
  readonly id: string;
  readonly title: string;
  readonly completed: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CreateTodoDto = {
  readonly title: string;
};

export type UpdateTodoDto = {
  readonly title?: string;
  readonly completed?: boolean;
};

export type ValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * 境界バリデーション: POST /todos のリクエストボディを検証する
 */
export function validateCreateTodoDto(
  raw: unknown,
): ValidationResult<CreateTodoDto> {
  if (!isRecord(raw)) {
    return { ok: false, message: "リクエストボディは JSON オブジェクトである必要があります" };
  }

  const title = raw["title"];
  if (typeof title !== "string" || title.trim().length === 0) {
    return { ok: false, message: "title は空でない文字列で指定してください" };
  }
  if (title.trim().length > 200) {
    return { ok: false, message: "title は200文字以内で指定してください" };
  }

  return { ok: true, value: { title: title.trim() } };
}

/**
 * 境界バリデーション: PATCH /todos/:id のリクエストボディを検証する
 */
export function validateUpdateTodoDto(
  raw: unknown,
): ValidationResult<UpdateTodoDto> {
  if (!isRecord(raw)) {
    return { ok: false, message: "リクエストボディは JSON オブジェクトである必要があります" };
  }

  const hasTitle = "title" in raw && raw["title"] !== undefined;
  const hasCompleted = "completed" in raw && raw["completed"] !== undefined;

  if (!hasTitle && !hasCompleted) {
    return {
      ok: false,
      message: "title または completed の少なくとも1つを指定してください",
    };
  }

  let validatedTitle: string | undefined;
  if (hasTitle) {
    if (typeof raw["title"] !== "string" || raw["title"].trim().length === 0) {
      return { ok: false, message: "title は空でない文字列で指定してください" };
    }
    if (raw["title"].trim().length > 200) {
      return { ok: false, message: "title は200文字以内で指定してください" };
    }
    validatedTitle = raw["title"].trim();
  }

  let validatedCompleted: boolean | undefined;
  if (hasCompleted) {
    if (typeof raw["completed"] !== "boolean") {
      return { ok: false, message: "completed は boolean で指定してください" };
    }
    validatedCompleted = raw["completed"];
  }

  const dto: UpdateTodoDto = {
    ...(validatedTitle !== undefined ? { title: validatedTitle } : {}),
    ...(validatedCompleted !== undefined ? { completed: validatedCompleted } : {}),
  };

  return { ok: true, value: dto };
}
