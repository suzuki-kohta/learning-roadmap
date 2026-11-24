import { describe, it } from "node:test";
import assert from "node:assert/strict";

const useSolutions = process.env["USE_SOLUTIONS"] === "1";

type Ch02Module = typeof import("./ch02-basic-types.ts");
type Ch04Module = typeof import("./ch04-type-narrowing.ts");
type Ch05Module = typeof import("./ch05-generics.ts");
type Ch07Module = typeof import("./ch07-async-result.ts");

const ch02: Ch02Module = useSolutions
  ? await import("./solutions/ch02-basic-types.ts")
  : await import("./ch02-basic-types.ts");

const ch04: Ch04Module = useSolutions
  ? await import("./solutions/ch04-type-narrowing.ts")
  : await import("./ch04-type-narrowing.ts");

const ch05: Ch05Module = useSolutions
  ? await import("./solutions/ch05-generics.ts")
  : await import("./ch05-generics.ts");

const ch07: Ch07Module = useSolutions
  ? await import("./solutions/ch07-async-result.ts")
  : await import("./ch07-async-result.ts");

describe("第2章 演習: 基本の型", () => {
  it("normalizeId: 数値は4桁ゼロ埋め、文字列はtrim+大文字化される", () => {
    assert.equal(ch02.normalizeId(42), "ID-0042");
    assert.equal(ch02.normalizeId(12345), "ID-12345");
    assert.equal(ch02.normalizeId("  abc "), "ID-ABC");
  });

  it("priorityToWeight: 優先度を重みに変換できる", () => {
    assert.equal(ch02.priorityToWeight(ch02.Priority.Low), 1);
    assert.equal(ch02.priorityToWeight(ch02.Priority.Medium), 2);
    assert.equal(ch02.priorityToWeight(ch02.Priority.High), 3);
  });

  it("averageOrNull: 空配列はnull、それ以外は平均値を返す", () => {
    assert.equal(ch02.averageOrNull([]), null);
    assert.equal(ch02.averageOrNull([10, 20, 30]), 20);
  });
});

describe("第4章 演習: 型の絞り込みと安全性", () => {
  it("formatPayment: 各支払い方法の文言を正しくフォーマットする", () => {
    assert.equal(
      ch04.formatPayment(800, { type: "cash", receivedAmount: 1000 }),
      "現金支払い（お釣り: 200円）",
    );
    assert.equal(
      ch04.formatPayment(1000, { type: "card", last4: "4242", feeRate: 0.035 }),
      "カード払い（末尾4242 / 手数料: 35円）",
    );
    assert.equal(
      ch04.formatPayment(500, { type: "points", pointsUsed: 500 }),
      "ポイント払い（500pt使用）",
    );
  });

  it("isBook: 正しいBookのみtrueを返し、不正値はfalseを返す", () => {
    assert.equal(
      ch04.isBook({ isbn: "978-4-0000", title: "TS教科書", pages: 240 }),
      true,
    );
    assert.equal(ch04.isBook(null), false);
    assert.equal(ch04.isBook([]), false);
    assert.equal(ch04.isBook({ isbn: "", title: "TS", pages: 100 }), false);
    assert.equal(ch04.isBook({ isbn: "123", title: "TS", pages: 0 }), false);
    assert.equal(ch04.isBook({ isbn: "123", title: "TS", pages: Number.NaN }), false);
  });
});

describe("第5章 演習: ジェネリクス", () => {
  it("pluck: 指定したプロパティの配列を抽出できる", () => {
    const users = [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];
    assert.deepEqual(ch05.pluck(users, "name"), ["Alice", "Bob"]);
    assert.deepEqual(ch05.pluck(users, "id"), [1, 2]);
  });

  it("pick: 指定したキーだけの新しいオブジェクトを返す", () => {
    const original = { a: 1, b: "two", c: true };
    const picked = ch05.pick(original, ["a", "c"]);
    assert.deepEqual(picked, { a: 1, c: true });
    assert.notEqual(picked, original);
  });

  it("uniqueBy: keySelectorの結果で重複を除去しつつ順序を維持する", () => {
    const items = [
      { id: 1, label: "first" },
      { id: 2, label: "second" },
      { id: 1, label: "duplicate" },
    ];
    assert.deepEqual(
      ch05.uniqueBy(items, (x) => x.id),
      [
        { id: 1, label: "first" },
        { id: 2, label: "second" },
      ],
    );
  });
});

describe("第7章 演習: Result型と非同期処理", () => {
  it("mapResult: okのみ変換し、errはそのまま通す", () => {
    const doubled = ch07.mapResult(ch07.ok(21), (n) => n * 2);
    assert.deepEqual(doubled, { ok: true, value: 42 });

    const failed = ch07.mapResult(ch07.err("boom"), (n: number) => n * 2);
    assert.deepEqual(failed, { ok: false, error: "boom" });
  });

  it("safeJsonParse: 正常JSONはok、不正JSONはerrを返す", () => {
    const valid = ch07.safeJsonParse('{"ok":true}');
    assert.equal(valid.ok, true);
    if (valid.ok) {
      assert.deepEqual(valid.value, { ok: true });
    }

    const invalid = ch07.safeJsonParse("{invalid");
    assert.equal(invalid.ok, false);
    if (!invalid.ok) {
      assert.equal(typeof invalid.error, "string");
      assert.ok(invalid.error.length > 0);
    }
  });

  it("retry: リトライ後に成功すればok、上限到達でerrを返す", async () => {
    let attempts = 0;
    const successRes = await ch07.retry(async () => {
      attempts += 1;
      if (attempts < 3) {
        throw new Error(`fail #${attempts}`);
      }
      return "done";
    }, 3);

    assert.deepEqual(successRes, { ok: true, value: "done" });
    assert.equal(attempts, 3);

    const failRes = await ch07.retry(async () => {
      throw new Error("always fails");
    }, 2);

    assert.equal(failRes.ok, false);
    if (!failRes.ok) {
      assert.equal(failRes.error.message, "always fails");
    }
  });
});
