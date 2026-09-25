// MCP server for FINESE AI — exposes BOTH toy sample tools AND the real verified compute-tools registry.
// Every call is authenticated (MCP_API_KEY or Supabase JWT) + rate-limited. Compute tools are verified
// against the caller's own datasets (file_hash must belong to caller) and return real numbers.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitOrThrow, LIMITS } from "../_shared/rate-limit.ts";

// ---- sample data (kept for backward compat) ----
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
const stockData = [{ date: "2024-01-02", open: 185.2, close: 187.6, volume: 42500000 }];

type Tool = { name: string; title: string; description: string; inputSchema: any; handler: (args: any, ctx: { userId: string | null; token: string }) => any; };

function svcClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function loadDatasetForMcp(file_hash: string, userId: string): Promise<any[]> {
  const svc = svcClient();
  const { data: meta } = await svc.from("datasets").select("storage_path, user_id").eq("file_hash", file_hash).eq("user_id", userId).maybeSingle();
  if (!meta) throw new Error("Dataset not found or not owned by caller (file_hash=" + file_hash + ")");
  const { data: blob, error } = await svc.storage.from("datasets").download(meta.storage_path);
  if (error || !blob) throw new Error("Failed to download dataset: " + (error?.message || "unknown"));
  return JSON.parse(await blob.text());
}

// Import compute tools inline (avoid Deno import of registry which pulls relative paths)
import describeColumn from "../compute-tools/tools/describe-column.ts";
import groupByAggregate from "../compute-tools/tools/group-by-aggregate.ts";
import correlation from "../compute-tools/tools/correlation.ts";
import ttest from "../compute-tools/tools/ttest.ts";
import outliers from "../compute-tools/tools/outliers.ts";
import filterCount from "../compute-tools/tools/filter-count.ts";
import histogram from "../compute-tools/tools/histogram.ts";
import trainClassifier from "../compute-tools/tools/train-classifier.ts";
import linearRegression from "../compute-tools/tools/linear-regression.ts";
import kmeans from "../compute-tools/tools/kmeans.ts";
import anova from "../compute-tools/tools/anova.ts";
import driftCheck from "../compute-tools/tools/drift-check.ts";
import pca from "../compute-tools/tools/pca.ts";
import forecast from "../compute-tools/tools/forecast.ts";
import randomForest from "../compute-tools/tools/random-forest.ts";
import semanticMetric from "../compute-tools/tools/semantic-metric.ts";

const computeRegistry: Record<string, (args: any, data: any[]) => any> = {
  describe_column: describeColumn,
  group_by_aggregate: groupByAggregate,
  correlation, ttest, outliers, filter_count: filterCount, histogram,
  train_classifier: trainClassifier, linear_regression: linearRegression, kmeans, anova, drift_check: driftCheck,
  pca, forecast, random_forest: randomForest, semantic_metric: semanticMetric,
};

// Join tool (B5) — also exposed via MCP
import joinDatasets from "../compute-tools/tools/join-datasets.ts";
computeRegistry["join_datasets"] = joinDatasets as any;

const tools: Tool[] = [
  { name: "echo", title: "Echo", description: "Echo input text back.", inputSchema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] }, handler: ({ text }) => ({ content: [{ type: "text", text }] }) },
  { name: "list_sample_datasets", title: "List sample datasets", description: "List built-in public sample datasets (sales, hr, stock).", inputSchema: { type: "object", properties: {} }, handler: () => {
      const datasets = [{ id: "sales", data: salesData }, { id: "hr", data: hrData }, { id: "stock", data: stockData }].map(d => ({ id: d.id, rowCount: d.data.length, columns: Object.keys(d.data[0] ?? {}), preview: d.data.slice(0,3) }));
      return { content: [{ type: "text", text: JSON.stringify(datasets, null, 2) }], structuredContent: { datasets } };
    } },
  { name: "get_sample_dataset", title: "Get sample dataset", description: "Return full rows of a sample dataset (sales|hr|stock).", inputSchema: { type: "object", properties: { id: { type: "string", enum: ["sales","hr","stock"] }, limit: { type: "number" } }, required: ["id"] }, handler: ({ id, limit }) => {
      const map: Record<string, any> = { sales: salesData, hr: hrData, stock: stockData };
      const rows = (map[id] || []).slice(0, limit || 100);
      return { content: [{ type: "text", text: JSON.stringify({ id, rowCount: rows.length, rows }, null, 2) }], structuredContent: { id, rowCount: rows.length, rows } };
    } },
  { name: "about_finese", title: "About FINESE AI", description: "About FINESE AI and its verified compute tools.", inputSchema: { type: "object", properties: {} }, handler: () => {
      const about = { name: "FINESE AI", verified_tools: Object.keys(computeRegistry), note: "All compute tools require file_hash + authenticated caller; they read the caller's own dataset and return verified numbers." };
      return { content: [{ type: "text", text: JSON.stringify(about, null, 2) }], structuredContent: about };
    } },
  { name: "list_datasets", title: "List my datasets", description: "List the caller's own uploaded datasets (file_hash, file_name, rowCount).", inputSchema: { type: "object", properties: {} }, handler: async (_args, ctx) => {
      if (!ctx.userId) throw new Error("This tool requires a Supabase JWT (not MCP_API_KEY) so we can locate your datasets.");
      const svc = svcClient();
      const { data } = await svc.from("datasets").select("file_hash,file_name,row_count,created_at").eq("user_id", ctx.userId).order("created_at", { ascending: false }).limit(20);
      return { content: [{ type: "text", text: JSON.stringify(data || [], null, 2) }], structuredContent: { datasets: data } };
    } },
  // ---- verified compute tools (all require file_hash) ----
  { name: "describe_column", title: "Describe column", description: "Verified: descriptive stats for a column.", inputSchema: { type: "object", properties: { file_hash: { type: "string" }, column: { type: "string" } }, required: ["file_hash","column"] }, handler: async (args, ctx) => {
      const data = await loadDatasetForMcp(args.file_hash, ctx.userId!);
      const result = computeRegistry["describe_column"]({ column: args.column }, data);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }], structuredContent: result };
    } },
  { name: "correlation", title: "Correlation", description: "Verified Pearson r between two numeric columns.", inputSchema: { type: "object", properties: { file_hash: { type: "string" }, col_a: { type: "string" }, col_b: { type: "string" } }, required: ["file_hash","col_a","col_b"] }, handler: async (a,c) => {
      const d = await loadDatasetForMcp(a.file_hash, c.userId!); const r = computeRegistry["correlation"]({ col_a: a.col_a, col_b: a.col_b }, d);
      return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }], structuredContent: r };
    } },
  { name: "ttest", title: "Welch t-test", description: "Verified Welch two-sample t-test.", inputSchema: { type: "object", properties: { file_hash: { type: "string" }, value_col: { type: "string" }, group_col: { type: "string" }, group_a: { type: "string" }, group_b: { type: "string" } }, required: ["file_hash","value_col","group_col","group_a","group_b"] }, handler: async (a,c) => {
      const d = await loadDatasetForMcp(a.file_hash, c.userId!); const r = computeRegistry["ttest"](a,d);
      return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }], structuredContent: r };
    } },
  { name: "group_by_aggregate", title: "Group-by aggregate", description: "Verified group-by sum/mean/median/min/max/count.", inputSchema: { type: "object", properties: { file_hash: { type: "string" }, group_col: { type: "string" }, value_col: { type: "string" }, agg: { type: "string", enum: ["sum","mean","median","min","max","count"] } }, required: ["file_hash","group_col","value_col","agg"] }, handler: async (a,c) => {
      const d = await loadDatasetForMcp(a.file_hash, c.userId!); const r = computeRegistry["group_by_aggregate"](a,d);
      return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }], structuredContent: r };
    } },
  { name: "kmeans", title: "K-Means", description: "Verified K-Means with silhouette.", inputSchema: { type: "object", properties: { file_hash: { type: "string" }, columns: { type: "array", items: { type: "string" } }, k: { type: "number" } }, required: ["file_hash","columns"] }, handler: async (a,c) => {
      const d = await loadDatasetForMcp(a.file_hash, c.userId!); const r = computeRegistry["kmeans"](a,d);
      return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }], structuredContent: r };
    } },
  { name: "linear_regression", title: "Linear regression", description: "Verified OLS y~x with R2, p-value.", inputSchema: { type: "object", properties: { file_hash: { type: "string" }, x_col: { type: "string" }, y_col: { type: "string" } }, required: ["file_hash","x_col","y_col"] }, handler: async (a,c) => {
      const d = await loadDatasetForMcp(a.file_hash, c.userId!); const r = computeRegistry["linear_regression"](a,d);
      return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }], structuredContent: r };
    } },
  { name: "anova", title: "ANOVA", description: "Verified one-way ANOVA.", inputSchema: { type: "object", properties: { file_hash: { type: "string" }, value_col: { type: "string" }, group_col: { type: "string" } }, required: ["file_hash","value_col","group_col"] }, handler: async (a,c) => {
      const d = await loadDatasetForMcp(a.file_hash, c.userId!); const r = computeRegistry["anova"](a,d);
      return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }], structuredContent: r };
    } },
  { name: "drift_check", title: "Drift check", description: "Verified PSI+KS drift.", inputSchema: { type: "object", properties: { file_hash: { type: "string" }, columns: { type: "array", items: { type: "string" } } }, required: ["file_hash"] }, handler: async (a,c) => {
      const d = await loadDatasetForMcp(a.file_hash, c.userId!); const r = computeRegistry["drift_check"](a,d);
      return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }], structuredContent: r };
    } },
  { name: "pca", title: "PCA", description: "Verified PCA eigenvalues/loadings.", inputSchema: { type: "object", properties: { file_hash: { type: "string" }, columns: { type: "array", items: { type: "string" } }, n_components: { type: "number" } }, required: ["file_hash","columns"] }, handler: async (a,c) => {
      const d = await loadDatasetForMcp(a.file_hash, c.userId!); const r = computeRegistry["pca"](a,d);
      return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }], structuredContent: r };
    } },
  { name: "forecast", title: "Forecast", description: "Verified Holt linear forecast.", inputSchema: { type: "object", properties: { file_hash: { type: "string" }, value_col: { type: "string" }, date_col: { type: "string" }, periods: { type: "number" } }, required: ["file_hash","value_col"] }, handler: async (a,c) => {
      const d = await loadDatasetForMcp(a.file_hash, c.userId!); const r = computeRegistry["forecast"](a,d);
      return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }], structuredContent: r };
    } },
  { name: "train_classifier", title: "Naive Bayes classifier", description: "Verified Naive Bayes with holdout metrics.", inputSchema: { type: "object", properties: { file_hash: { type: "string" }, target: { type: "string" }, features: { type: "array", items: { type: "string" } } }, required: ["file_hash","target"] }, handler: async (a,c) => {
      const d = await loadDatasetForMcp(a.file_hash, c.userId!); const r = computeRegistry["train_classifier"]({ target: a.target, features: a.features }, d);
      return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }], structuredContent: r };
    } },
  { name: "random_forest", title: "Random forest", description: "Verified bagged CART forest.", inputSchema: { type: "object", properties: { file_hash: { type: "string" }, target_col: { type: "string" }, feature_cols: { type: "array", items: { type: "string" } }, n_trees: { type: "number" }, max_depth: { type: "number" } }, required: ["file_hash","target_col"] }, handler: async (a,c) => {
      const d = await loadDatasetForMcp(a.file_hash, c.userId!); const r = computeRegistry["random_forest"](a,d);
      return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }], structuredContent: r };
    } },
  { name: "outliers", title: "Outliers", description: "Verified IQR/zscore outliers.", inputSchema: { type: "object", properties: { file_hash: { type: "string" }, column: { type: "string" }, method: { type: "string", enum: ["iqr","zscore"] } }, required: ["file_hash","column"] }, handler: async (a,c) => {
      const d = await loadDatasetForMcp(a.file_hash, c.userId!); const r = computeRegistry["outliers"](a,d);
      return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }], structuredContent: r };
    } },
  { name: "histogram", title: "Histogram", description: "Verified histogram bins.", inputSchema: { type: "object", properties: { file_hash: { type: "string" }, column: { type: "string" }, bins: { type: "number" } }, required: ["file_hash","column"] }, handler: async (a,c) => {
      const d = await loadDatasetForMcp(a.file_hash, c.userId!); const r = computeRegistry["histogram"](a,d);
      return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }], structuredContent: r };
    } },
  { name: "filter_count", title: "Filter count", description: "Verified filter+count.", inputSchema: { type: "object", properties: { file_hash: { type: "string" }, column: { type: "string" }, op: { type: "string", enum: ["eq","neq","gt","gte","lt","lte","contains"] }, value: {} }, required: ["file_hash","column","op","value"] }, handler: async (a,c) => {
      const d = await loadDatasetForMcp(a.file_hash, c.userId!); const r = computeRegistry["filter_count"](a,d);
      return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }], structuredContent: r };
    } },
  { name: "semantic_metric", title: "Semantic metric", description: "Verified derived metric row-wise.", inputSchema: { type: "object", properties: { file_hash: { type: "string" }, metric_name: { type: "string" }, expression: { type: "string" }, description: { type: "string" } }, required: ["file_hash"] }, handler: async (a,c) => {
      const d = await loadDatasetForMcp(a.file_hash, c.userId!); const r = computeRegistry["semantic_metric"](a,d);
      return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }], structuredContent: r };
    } },
  { name: "join_datasets", title: "Join datasets", description: "Verified join of two datasets on a key (inner/left).", inputSchema: { type: "object", properties: { left_hash: { type: "string" }, right_hash: { type: "string" }, left_key: { type: "string" }, right_key: { type: "string" }, how: { type: "string", enum: ["inner","left"] } }, required: ["left_hash","right_hash","left_key","right_key"] }, handler: async (a,c) => {
      if (!c.userId) throw new Error("Requires Supabase JWT.");
      const left = await loadDatasetForMcp(a.left_hash, c.userId); const right = await loadDatasetForMcp(a.right_hash, c.userId);
      const r = (computeRegistry["join_datasets"] as any)({ left_key: a.left_key, right_key: a.right_key, how: a.how || "inner", left, right }, []);
      // r is already result shape; provide preview
      return { content: [{ type: "text", text: JSON.stringify(r, null, 2) }], structuredContent: r };
    } },
];

const manifest = {
  name: "finese-ai-mcp",
  title: "FINESE AI — verified compute",
  version: "0.2.0",
  instructions: "FINESE AI exposes verified statistical tools (correlation, t-test, regression, k-means, drift, pca, forecast, classifier, outlier detection...) that run on the caller's own datasets. Pass file_hash from list_datasets.",
  tools: tools.map(t => ({ name: t.name, title: t.title, description: t.description, inputSchema: t.inputSchema })),
};

async function requireMcpAuth(req: Request): Promise<{ userId: string | null; token: string }> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) throw new Response(JSON.stringify({ error: "Unauthorized — MCP requires Bearer token" }), { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  const token = auth.slice(7).trim();
  const mcpKey = Deno.env.get("MCP_API_KEY");
  if (mcpKey && token === mcpKey) return { userId: null, token };
  const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data, error } = await anon.auth.getUser(token);
  if (!error && data?.user) return { userId: data.user.id, token };
  throw new Response(JSON.stringify({ error: "Unauthorized — invalid token" }), { status: 401, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const url = new URL(req.url);
  let auth: { userId: string | null; token: string };
  try { auth = await requireMcpAuth(req); } catch (e) { if (e instanceof Response) return e; return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
  try { rateLimitOrThrow(req, auth.userId, LIMITS.mcp); } catch (e) { if (e instanceof Response) return e; throw e; }
  if (req.method === "GET") return new Response(JSON.stringify(manifest), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  let body: any = {};
  try { body = await req.json(); } catch {}
  const method = body.method; const id = body.id;
  if (method === "tools/list") return new Response(JSON.stringify({ jsonrpc: "2.0", id, result: { tools: manifest.tools } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  if (method === "tools/call") {
    const { name, arguments: args } = body.params || {};
    const tool = tools.find(t => t.name === name);
    if (!tool) return new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown tool ${name}` } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    try {
      const result = await tool.handler(args || {}, auth);
      return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (e: any) { return new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32602, message: e?.message || String(e) } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
  }
  if (body.tool) {
    const tool = tools.find(t => t.name === body.tool);
    if (!tool) return new Response(JSON.stringify({ error: `Unknown tool ${body.tool}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const result = await tool.handler(body.args || body.arguments || {}, auth);
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  if (method) return new Response(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown method ${method}` } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  return new Response(JSON.stringify(manifest), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
