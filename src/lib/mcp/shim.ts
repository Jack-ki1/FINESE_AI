// Simple local MCP shim — no external dependency.
// Provides defineTool / defineMcp compatible with previous usage but fully self-contained.

import { z } from "zod";

export type ToolDefinition = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, any>;
  annotations?: Record<string, any>;
  handler: (args: any) => any | Promise<any>;
};

export function defineTool(def: ToolDefinition): ToolDefinition {
  return def;
}

export type McpDefinition = {
  name: string;
  title: string;
  version: string;
  instructions: string;
  tools: ToolDefinition[];
};

export function defineMcp(def: McpDefinition): McpDefinition {
  return def;
}

// Minimal MCP JSON-RPC handler
// Handles `tools/list` and `tools/call` over POST, plus SSE if requested.
export function createMcpHandler(mcp: McpDefinition) {
  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, content-type, accept, x-client-info, apikey",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });

    // Health / manifest endpoint
    if (url.pathname.endsWith("/manifest") || req.method === "GET") {
      return new Response(JSON.stringify({
        name: mcp.name,
        title: mcp.title,
        version: mcp.version,
        instructions: mcp.instructions,
        tools: mcp.tools.map(t => ({ name: t.name, title: t.title, description: t.description, inputSchema: t.inputSchema })),
      }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    let body: any = {};
    try { body = await req.json(); } catch {}

    // JSON-RPC 2.0 MCP protocol
    const method = body.method;
    const id = body.id;

    if (method === "tools/list") {
      return new Response(JSON.stringify({
        jsonrpc: "2.0", id,
        result: {
          tools: mcp.tools.map(t => ({
            name: t.name,
            title: t.title,
            description: t.description,
            inputSchema: zodToJsonSchema(t.inputSchema),
          })),
        }
      }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (method === "tools/call") {
      const { name, arguments: args } = body.params || {};
      const tool = mcp.tools.find(t => t.name === name);
      if (!tool) {
        return new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown tool ${name}` } }), { headers: { ...cors, "Content-Type": "application/json" } });
      }
      try {
        // Validate with zod if possible
        if (tool.inputSchema && Object.keys(tool.inputSchema).length) {
          const schema = z.object(tool.inputSchema);
          schema.parse(args || {});
        }
        const result = await tool.handler(args || {});
        return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), { headers: { ...cors, "Content-Type": "application/json" } });
      } catch (e: any) {
        return new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32602, message: e?.message || String(e) } }), { headers: { ...cors, "Content-Type": "application/json" } });
      }
    }

    // Fallback: treat POST as direct tool call { tool, args } (simple REST)
    if (body.tool) {
      const tool = mcp.tools.find(t => t.name === body.tool);
      if (!tool) return new Response(JSON.stringify({ error: `Unknown tool ${body.tool}` }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
      const result = await tool.handler(body.args || body.arguments || {});
      return new Response(JSON.stringify(result), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown method ${method}` } }), { headers: { ...cors, "Content-Type": "application/json" } });
  };
}

function zodToJsonSchema(schema: Record<string, any>): any {
  // Already zod schemas — convert via zod internal; fallback to raw if not zod
  try {
    if (!schema || typeof schema !== "object") return { type: "object", properties: {} };
    const converted: any = { type: "object", properties: {} };
    for (const [k, v] of Object.entries(schema)) {
      // v is a zod schema; try to infer type
      if (v && typeof (v as any)._def === "object") {
        const def: any = (v as any)._def;
        const typeName = def.typeName;
        if (typeName === "ZodString") converted.properties[k] = { type: "string" };
        else if (typeName === "ZodNumber") converted.properties[k] = { type: "number" };
        else if (typeName === "ZodBoolean") converted.properties[k] = { type: "boolean" };
        else if (typeName === "ZodEnum") converted.properties[k] = { type: "string", enum: def.values };
        else if (typeName === "ZodOptional") converted.properties[k] = zodToJsonSchema({ [k]: def.innerType }).properties[k];
        else converted.properties[k] = { type: "string" };
      } else {
        converted.properties[k] = { type: "string" };
      }
    }
    return converted;
  } catch {
    return { type: "object", properties: {} };
  }
}
