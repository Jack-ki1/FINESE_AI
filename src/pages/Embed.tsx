import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ChartArtifact } from "@/components/artifacts/ChartArtifact";
import { StatsArtifact } from "@/components/artifacts/StatsArtifact";
export default function Embed() {
  const [sp] = useSearchParams();
  const payload = sp.get("p");
  const [art, setArt] = useState<any>(null);
  useEffect(()=>{ if(payload) try{ setArt(JSON.parse(atob(payload))); }catch{} },[payload]);
  if (!art) return <div className="p-6 text-xs text-muted-foreground">No payload. Embed a verified artifact via share → Embed link.</div>;
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-xl mx-auto rounded-xl border bg-card overflow-hidden">
        <div className="px-3 py-2 border-b bg-muted/50 flex items-center justify-between"><span className="text-[10px] font-mono uppercase">{art.type}</span><span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${art.verified? "bg-verified/10 text-verified border-verified/20":"bg-estimated/10 text-estimated border-estimated/20 border-dashed"}`}>{art.verified? "● Verified":"Estimated"}</span></div>
        {art.type==="chart" ? <ChartArtifact artifact={art}/> : art.type==="stats" ? <StatsArtifact artifact={art}/> : <pre className="p-3 text-xs font-mono whitespace-pre-wrap">{JSON.stringify(art,null,2)}</pre>}
        <div className="px-3 py-2 border-t text-[10px] font-mono text-muted-foreground">FINESE AI — verified compute</div>
      </div>
    </div>
  );
}
