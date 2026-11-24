/**
 * 第4章 演習 解答例
 */

export type PaymentMethod =
  | { readonly type: "cash"; readonly receivedAmount: number }
  | { readonly type: "card"; readonly last4: string; readonly feeRate: number }
  | { readonly type: "points"; readonly pointsUsed: number };

function assertNever(value: never): never {
  throw new Error(`Unexpected payment method: ${JSON.stringify(value)}`);
}

export function formatPayment(amount: number, method: PaymentMethod): string {
  switch (method.type) {
    case "cash":
      return `現金支払い（お釣り: ${method.receivedAmount - amount}円）`;
    case "card":
      return `カード払い（末尾${method.last4} / 手数料: ${Math.floor(amount * method.feeRate)}円）`;
    case "points":
      return `ポイント払い（${method.pointsUsed}pt使用）`;
    default:
      return assertNever(method);
  }
}

export type Book = {
  readonly isbn: string;
  readonly title: string;
  readonly pages: number;
};

export function isBook(value: unknown): value is Book {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record["isbn"] === "string" &&
    record["isbn"].length > 0 &&
    typeof record["title"] === "string" &&
    record["title"].length > 0 &&
    typeof record["pages"] === "number" &&
    Number.isFinite(record["pages"]) &&
    record["pages"] > 0
  );
}
