export function ok(data: any, corsHeaders: Record<string, string>, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json", ...extraHeaders } });
}
export function badRequest(msg: string, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ error: msg }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
export function unauthorized(corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
export function forbidden(msg: string, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ error: msg }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
export function serverError(msg: string, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
