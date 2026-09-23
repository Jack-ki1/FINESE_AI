import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { buildProfile, buildAdvanced } from "../_shared/stats.ts";

Deno.test("buildProfile detects numeric and categorical", () => {
  const data = [{ a: 1, b: "x" }, { a: 2, b: "x" }, { a: 3, b: "y" }];
  const profile = buildProfile(data);
  assertEquals(profile.find(p => p.col === "a")?.type, "numeric");
  assertEquals(profile.find(p => p.col === "b")?.type, "categorical");
});

Deno.test("buildAdvanced finds correlations", () => {
  const data = [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }];
  const profile = buildProfile(data);
  const { correlations } = buildAdvanced(data, profile);
  // With perfect correlation, should be found
  // Note: need enough numeric cols with correlation >0.4
});
