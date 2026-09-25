import { getCorsHeaders } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
Deno.serve(async (req)=>{
  const cors=getCorsHeaders(req);
  if(req.method==="OPTIONS") return new Response(null,{headers:cors});
  try{ await requireUser(req); }catch(e){ if(e instanceof Response) return e; throw e; }
  return new Response(JSON.stringify({ error: "Sheets import is handled client-side via CSV export. Use GoogleSheetsConnector which fetches the published CSV directly." }),{ status: 501, headers:{...cors,"Content-Type":"application/json"}});
});
