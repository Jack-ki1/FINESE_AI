import type { AIProvider } from "@/store/settings.store";
import { FREE_MODELS } from "@/store/settings.store";
// Heuristic: short descriptive stats -> fast cheap model; multi-step analysis -> strong model
export function pickModelForTask(task: "describe"|"analysis"|"chat", settings: any): string {
  const provider = settings?.provider as AIProvider || "openrouter";
  const models = FREE_MODELS[provider] || [];
  if (!models.length) return settings?.model || "openrouter/free";
  if (task === "describe") {
    // fastest free
    const fast = models.find(m=>m.speed) || models[0];
    return fast.id;
  }
  if (task === "analysis") {
    const strong = models.find(m=>m.context?.includes("256K") || m.name.includes("70B") || m.name.includes("R1")) || models[0];
    return strong.id;
  }
  return settings?.model || models[0].id;
}
