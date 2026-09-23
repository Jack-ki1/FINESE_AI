// MCP server for FINESE AI — requires authentication.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitOrThrow, LIMITS } from "../_shared/rate-limit.ts";

const salesData = [
  { region: "North", product: "Widget A", revenue: 12400, quantity: 62, date: "2024-01-15", customer_type: "Enterprise" },
  { region: "South", product: "Widget B", revenue: 8900, quantity: 45, date: "2024-01-18", customer_type: "SMB" },
  { region: "East", product: "Widget A", revenue: 15600, quantity: 78, date: "2024-01-22", customer_type: "Enterprise" },
  { region: "West", product: "Widget C", revenue: 6200, quantity: 31, date: "2024-02-01", customer_type: "Consumer" },
  { region: "North", product: "Widget B", revenue: 11300, quantity: 57, date: "2024-02-05", customer_type: "SMB" },
  { region: "South", product: "Widget A", revenue: 9800, quantity: 49, date: "2024-02-10", customer_type: "Enterprise" },
  { region: "East", product: "Widget C", revenue: 14200, quantity: 71, date: "2024-02-14", customer_type: "Consumer" },
  { region: "West", product: "Widget A", revenue: 7500, quantity: 38, date: "2024-02-20", customer_type: "SMB" },
];
const hrData = [
  { name: "Alice Chen", department: "Engineering", salary: 125000, years: 5, performance: "Exceeds" },
  { name: "Bob Smith", department: "Marketing", salary: 82000, years: 3, performance: "Meets" },
];
const stockData = [
  { date: "2024-01-02", open: 185.2, close: 187.6, volume: 42500000 },
];

type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: any;
  handler: (args: any) => any;
};

const tools: Tool[] = [
  {
    name: "echo",
    title: "Echo",
    description: "Echo the input text back to the caller. Useful for verifying MCP connectivity.",
    inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] },
    handler: ({ text }) => ({ content: [{ type: "text", text }] }),
  },
  {
    name: "list_sample_datasets",
    title: "List sample datasets",
    description: "List the built-in public sample datasets available in FINESE AI (sales, HR, stock) with row counts, column names, and a small preview.",
    inputSchema: { type: "object", properties: {} },
    handler: () => {
      const datasets = [
        { id: "sales", name: "Sales Data", data: salesData },
        { id: "hr", name: "HR Data", data: hrData },
        { id: "stock", name: "Stock Data", data: stockData },
      ].map(d => ({ id: d.id, name: d.name, rowCount: d.data.length, columns: Object.keys(d.data[0] ?? {}), preview: d.data.slice(0, 3) }));
      return { content: [{ type: "text", text: JSON.stringify(datasets, null, 2) }], structuredContent: { datasets } };
    },
  },
  {
    name: "get_sample_dataset",
    title: "Get sample dataset",
    description: "Return the full rows of a built-in public sample dataset (sales, hr, or stock).",
    inputSchema: { type: "object", properties: { id: { type: "string", enum: ["sales","hr","stock"] }, limit: { type: "number" } }, required: ["id"] },
    handler: ({ id, limit }) => {
      const map: Record<string, any> = { sales: salesData, hr: hrData, stock: stockData };
      const data = map[id] || [];
      const rows = limit ? data.slice(0, limit) : data;
      const payload = { id, rowCount: rows.length, columns: Object.keys(data[0] ?? {}), rows };
      return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }], structuredContent: payload };
    },
  },
  {
    name: "about_finese",
    title: "About FINESE AI",
    description: "Return a short description of FINESE AI, its capabilities, and the modes it supports.",
    inputSchema: { type: "object", properties: {} },
    handler: () => {
      const about = {
        name: "FINESE AI",
        tagline: "Chat-first AI data intelligence for data professionals.",
        capabilities: [
          "Automatic dataset profiling (types, nulls, outliers, correlations)",
          "Server-side statistical compute via tool-calls",
          "Chart, table, profile, stats, hypothesis, pivot, and code artifacts",
          "In-browser Python execution via Pyodide",
        ],
      };
      return { content: [{ type: "text", text: JSON.stringify(about, null, 2) }], structuredContent: about };
    },
  },
];

const manifest = {
  name: "finese-ai-mcp",
  title: "FINESE AI",
  version: "0.1.0",
  instructions: "Public tools for FINESE AI, a chat-first data intelligence platform.",
  tools: tools.map(t => ({ name: t.name, title: t.title, description: t.description, inputSchema: t.inputSchema })),
};

async function requireMcpAuth(req: Request): Promise<string> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    throw new Response(JSON.stringify({ error: "Unauthorized — MCP requires Bearer token (MCP_API_KEY or Supabase JWT)" }), {
      status: 401,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
  const token = auth.slice(7).trim();
  const mcpKey = Deno.env.get("MCP_API_KEY");
  if (mcpKey && token === mcpKey) return `mcp-key:${token.slice(0,8)}`;
  // Fall back to Supabase JWT validation
  const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data, error } = await anon.auth.getUser(token);
  if (!error && data?.user) return data.user.id;
  throw new Response(JSON.stringify({ error: "Unauthorized — invalid MCP token" }), {
    status: 401,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  // Auth gate — every request must present a valid MCP key or Supabase JWT
  let callerId: string;
  try {
    callerId = await requireMcpAuth(req);
  } catch (e) {
    if (e instanceof Response) return e;
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Rate limit per caller
  try {
    rateLimitOrThrow(req, callerId, LIMITS.mcp);
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  if (req.method === "GET") {
    return new Response(JSON.stringify(manifest), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  let body: any = {};
  try { body = await req.json(); } catch {}

  const method = body.method;
  const id = body.id;

  if (method === "tools/list") {
    return new Response(JSON.stringify({ jsonrpc: "2.0", id, result: { tools: manifest.tools } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (method === "tools/call") {
    const { name, arguments: args } = body.params || {};
    const tool = tools.find(t => t.name === name);
    if (!tool) return new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown tool ${name}` } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    try {
      const result = await tool.handler(args || {});
      return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (e: any) {
      return new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32602, message: e?.message || String(e) } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  if (body.tool) {
    const tool = tools.find(t => t.name === body.tool);
    if (!tool) return new Response(JSON.stringify({ error: `Unknown tool ${body.tool}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const result = await tool.handler(body.args || body.arguments || {});
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (method) {
    return new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown method ${method}` } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify(manifest), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
