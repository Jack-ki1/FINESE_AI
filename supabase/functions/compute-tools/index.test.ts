import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { TOOLS } from "./registry.ts";

Deno.test("registry has expected tools", () => {
  const expected = ["describe_column","group_by_aggregate","correlation","ttest","outliers","filter_count","histogram","train_classifier"];
  for (const name of expected) assertEquals(!!TOOLS[name], true);
});

Deno.test("describe_column works on numeric", () => {
  const data = [{ v: 1 }, { v: 2 }, { v: 3 }];
  const res = TOOLS["describe_column"]({ column: "v" }, data);
  assertEquals(res.type, "numeric");
});
