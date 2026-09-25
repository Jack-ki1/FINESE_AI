import { useDatumStore } from "@/store/datum.store";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { downloadReceipt } from "@/lib/receipt";

export function ReportExport() {
  const { messages, fileName, fileHash } = useDatumStore();
  const arts = messages.filter(m=>m.role==="assistant").flatMap(m=>m.artifacts||[]).map((a:any)=>({ ...a, msgId: (a as any).msgId }));
  const verified = arts.filter((a:any)=>a.verified===true).length;
  const total = arts.length;
  const onExport = () => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>FINESE Report</title><style>body{font-family:Inter,sans-serif;max-width:800px;margin:40px auto;padding:0 24px} .badge{font:10px monospace;padding:4px 8px;border-radius:999px;border:1px solid} .verified{color:#0f766e;background:#ccfbf1;border-color:#99f6e4} .est{color:#a16207;background:#fef9c3;border-color:#fde68a;border-style:dashed} h1{font-size:24px} .stamp{margin-top:32px;padding:12px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb;font:12px monospace}</style></head><body><h1>FINESE AI — Report</h1><p><em>${fileName||"dataset"} • ${new Date().toLocaleString()}</em></p><div class="stamp">${verified} of ${total} figures in this report are server-verified (● Verified). Estimated figures are marked ◐ Estimated and are AI-generated scaffolding.</div>` + arts.map((a:any)=>`<section style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:16px 0"><div style="font:10px monospace;text-transform:uppercase;color:#64748b">${a.type} — ${a.title||a.type}</div><pre style="font:12px monospace;white-space:pre-wrap">${JSON.stringify(a,null,2)}</pre><span class="badge ${a.verified? "verified":"est"}">${a.verified? "● Verified · real compute":"⚠ Estimated · AI-generated"}</span></section>`).join("") + `<p style="font:11px monospace;color:#64748b">Receipt: each figure has a JSON receipt (dataset hash, tool, params, timestamp) — export via ⋯ → Receipt in the artifact header. Re-run the tool to reproduce.</p></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`finese-report-${(fileHash||"session").slice(0,8)}.html`; a.click(); URL.revokeObjectURL(url);
  };
  if (!arts.length) return <p className="text-xs text-muted-foreground">No artifacts yet — run a verified analysis first.</p>;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono px-2 py-1 rounded bg-verified/10 text-verified border border-verified/20">{verified}/{total} verified</span>
      <Button size="sm" onClick={onExport}><FileDown className="w-4 h-4 mr-1"/> Export report (HTML with stamp)</Button>
      <Button size="sm" variant="outline" onClick={()=>{
        const all = arts.map((a:any)=>downloadReceipt(a, fileHash||"session", fileName||"dataset"));
      }}>Export receipts (JSON)</Button>
    </div>
  );
}
