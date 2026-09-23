import { z } from "https://esm.sh/zod@3.25.76";

export const fileHashSchema = z.string().min(16).max(128).regex(/^[a-f0-9]+$/i, "file_hash must be hex");

export const ingestSchema = z.object({
  file_name: z.string().min(1).max(256),
  file_ext: z.string().min(1).max(16).optional(),
  rows: z.array(z.record(z.any())).min(1).max(250_000),
});

export const datasetFetchSchema = z.object({
  file_hash: fileHashSchema,
  profile_only: z.boolean().optional(),
});

export const datasetProfileSchema = z.object({
  file_hash: fileHashSchema,
});

export const computeToolsSchema = z.object({
  tool: z.string().min(1).max(64),
  file_hash: fileHashSchema,
  args: z.record(z.any()).optional(),
});

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system", "tool"]),
  content: z.string().min(1).max(20_000),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(60),
  dataset_context: z.any().optional(),
  file_hash: fileHashSchema.optional().nullable(),
  ai_config: z.any().optional().nullable(),
});

export const mcpCallSchema = z.object({
  jsonrpc: z.string().optional(),
  id: z.any().optional(),
  method: z.string().optional(),
  params: z.any().optional(),
  tool: z.string().optional(),
  args: z.record(z.any()).optional(),
  arguments: z.record(z.any()).optional(),
});

export function parseOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const res = schema.safeParse(data);
  if (!res.success) {
    const msg = res.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    throw new Response(JSON.stringify({ error: `Invalid request: ${msg}` }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  return res.data;
}
