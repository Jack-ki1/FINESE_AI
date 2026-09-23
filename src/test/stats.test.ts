import { describe, it, expect } from "vitest";
import { quantile, detectSemanticType, buildProfile, aggregateData, pearsonCorrDetailed, healthScore } from "@/lib/stats";

describe("quantile", () => {
  it("returns NaN for empty", () => expect(quantile([], 0.5)).toBeNaN());
  it("handles single element", () => expect(quantile([5], 0.5)).toBe(5));
  it("computes R-7 linear interpolation", () => {
    const sorted = [1, 2, 3, 4];
    expect(quantile(sorted, 0.25)).toBeCloseTo(1.75);
    expect(quantile(sorted, 0.5)).toBeCloseTo(2.5);
    expect(quantile(sorted, 0.75)).toBeCloseTo(3.25);
  });
});

describe("detectSemanticType", () => {
  it("detects identifier by header", () => {
    expect(detectSemanticType("user_id", ["a1b2c3d4", "b2c3d4e5", "c3d4e5f6", "d4e5f6g7", "e5f6g7h8"])).toBe("identifier");
  });
  it("detects numeric (with repeats to avoid identifier)", () => {
    // Use repeated values so uniqueRatio <0.95 prevents identifier classification
    expect(detectSemanticType("age", ["23.5", "45.2", "23.5", "45.2", "23.5", "45.2", "30.1", "30.1", "30.1", "30.1"])).toBe("numeric");
  });
  it("detects categorical", () => {
    // 10 rows, 2 unique => 0.2 <0.25 => categorical
    expect(detectSemanticType("color", ["red", "blue", "red", "blue", "red", "blue", "red", "blue", "red", "blue"])).toBe("categorical");
  });
  it("detects email (with repeats to avoid identifier)", () => {
    const emails = ["a@b.com","a@b.com","c@d.org","c@d.org","a@b.com","c@d.org","a@b.com","c@d.org","a@b.com","c@d.org"];
    expect(detectSemanticType("email", emails)).toBe("email");
  });
  it("detects zip", () => {
    expect(detectSemanticType("zipcode", ["90210", "10001", "30301","90210","10001","30301","90210","10001","30301","90210"])).toBe("zip");
  });
  it("detects currency", () => {
    expect(detectSemanticType("price", ["$12", "$13", "$14","$12","$13","$14","$12","$13","$14","$12"])).toBe("currency");
  });
  it("detects boolean", () => {
    expect(detectSemanticType("flag", ["yes", "no", "yes", "no", "yes","yes","no","yes","no","yes"])).toBe("boolean");
  });
  it("detects datetime (with repeats to avoid identifier)", () => {
    const dates = ["2024-01-01","2024-01-01","2024-02-01","2024-02-01","2024-03-01","2024-03-01","2024-01-01","2024-02-01","2024-03-01","2024-01-01"];
    expect(detectSemanticType("created_at", dates)).toBe("datetime");
  });
  it("returns empty for all nulls", () => {
    expect(detectSemanticType("col", ["", null, undefined])).toBe("empty");
  });
});

describe("buildProfile", () => {
  it("builds numeric profile with quartiles", () => {
    // Use float strings with repeats to trigger numeric not identifier
    const data = [
      { v: "1.1" }, { v: "2.2" }, { v: "1.1" }, { v: "2.2" }, { v: "3.3" },
      { v: "3.3" }, { v: "4.4" }, { v: "4.4" }, { v: "5.5" }, { v: "5.5" },
    ];
    const p = buildProfile(data);
    expect(p[0].type).toBe("numeric");
    expect(p[0].mean).toBeDefined();
    expect(p[0].median).toBeDefined();
    expect(p[0].q1).toBeDefined();
    expect(p[0].q3).toBeDefined();
  });
  it("handles all nulls", () => {
    const data = [{ v: "" }, { v: null }];
    const p = buildProfile(data);
    expect(p[0].nullCount).toBe(2);
  });
  it("categorical top", () => {
    // Need 10 rows for categorical (uniqueRatio 0.2)
    const data = Array(6).fill({ c: "a" }).concat(Array(4).fill({ c: "b" }));
    const p = buildProfile(data);
    expect(p[0].type).toBe("categorical");
    expect(p[0].top?.[0].value).toBe("a");
  });
});

describe("aggregateData", () => {
  it("aggregates sum", () => {
    const data = [{ g: "a", v: 10 }, { g: "a", v: 20 }, { g: "b", v: 5 }];
    const res = aggregateData(data, "g", "v", "sum");
    expect(res.find(r => r.x === "a")?.y).toBe(30);
    expect(res.find(r => r.x === "b")?.y).toBe(5);
  });
  it("aggregates count", () => {
    const data = [{ g: "a", v: 1 }, { g: "a", v: 2 }];
    const res = aggregateData(data, "g", "v", "count");
    expect(res[0].y).toBe(2);
  });
});

describe("pearsonCorrDetailed", () => {
  it("returns warning for n<3", () => {
    const data = [{ a: 1, b: 2 }, { a: 2, b: 3 }];
    const { r, warning } = pearsonCorrDetailed(data, "a", "b");
    expect(isNaN(r)).toBe(true);
    expect(warning).toBeDefined();
  });
  it("computes perfect correlation", () => {
    const data = [{ a: 1, b: 1 }, { a: 2, b: 2 }, { a: 3, b: 3 }];
    const { r } = pearsonCorrDetailed(data, "a", "b");
    expect(r).toBeCloseTo(1);
  });
  it("warns for zero variance", () => {
    const data = [{ a: 1, b: 5 }, { a: 1, b: 6 }, { a: 1, b: 7 }];
    const { warning } = pearsonCorrDetailed(data, "a", "b");
    expect(warning).toBeDefined();
  });
});

describe("healthScore", () => {
  it("100% when no nulls", () => {
    const profile = [{ col: "a", type: "numeric" as const, nullCount: 0, uniqueCount: 2, total: 10 }];
    expect(healthScore(profile as any)).toBe(100);
  });
  it("50% when half nulls", () => {
    const profile = [{ col: "a", type: "numeric" as const, nullCount: 5, uniqueCount: 5, total: 10 }];
    expect(healthScore(profile as any)).toBe(50);
  });
});
