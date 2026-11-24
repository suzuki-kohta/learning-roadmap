/**
 * 第4章 演習: 判別可能ユニオン・網羅性チェック・ユーザー定義型ガード
 */

export type PaymentMethod =
  | { readonly type: "cash"; readonly receivedAmount: number }
  | { readonly type: "card"; readonly last4: string; readonly feeRate: number }
  | { readonly type: "points"; readonly pointsUsed: number };

/**
 * 問題 4-1:
 * 商品金額（amount）と支払い方法（method）を受け取り、支払い内容の説明文を返してください。
 * - cash: `現金支払い（お釣り: ${method.receivedAmount - amount}円）`
 * - card: `カード払い（末尾${method.last4} / 手数料: ${Math.floor(amount * method.feeRate)}円）`
 * - points: `ポイント払い（${method.pointsUsed}pt使用）`
 * ※ switch 文と never 型の網羅性チェックを使って実装しましょう。
 */
export function formatPayment(amount: number, method: PaymentMethod): string {
  void amount;
  void method;
  throw new Error("TODO: formatPayment を実装してください");
}

export type Book = {
  readonly isbn: string;
  readonly title: string;
  readonly pages: number;
};

/**
 * 問題 4-2:
 * unknown 型の値が Book 型かどうかを判定するユーザー定義型ガードを実装してください。
 * 条件:
 * - null でないオブジェクトであること（配列は false とすること）
 * - isbn が空でない string であること
 * - title が空でない string であること
 * - pages が 0 より大きい有限の number（Number.isFinite）であること
 */
export function isBook(value: unknown): value is Book {
  void value;
  throw new Error("TODO: isBook を実装してください");
}
