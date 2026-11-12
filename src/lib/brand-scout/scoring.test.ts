// @ts-nocheck -- run with `bun test`; test runner types are not installed
import { describe, expect, it } from "bun:test";
import { normalizeTeardownScores } from "./scoring";

describe("normalizeTeardownScores", () => {
  it("clamps out-of-range model scores to 0-100", () => {
    const r = normalizeTeardownScores({ audience: 140, content: -20, distribution: 50, operations: 50, strategy: 50, alignment: 50 });
    expect(r.dimensions.audience).toBe(100);
    expect(r.dimensions.content).toBe(0);
  });
  it("recomputes the Publisher Index with category weights, ignoring any model total", () => {
    const r = normalizeTeardownScores({ audience: 100, content: 0, distribution: 0, operations: 0, strategy: 0, alignment: 0 });
    // 100*1.2 / 6.0 total weight
    expect(r.overall).toBe(20);
  });
});
