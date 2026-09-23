import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { buildSystemPrompt } from "./prompts/index.ts";

Deno.test("buildSystemPrompt returns persona when no ctx", () => {
  const prompt = buildSystemPrompt(null);
  assertEquals(prompt.includes("FINESE AI"), true);
});
