import { useDatumStore } from "@/store/datum.store";
export function NarrativeMode() {
  const { messages } = useDatumStore();
  const arts = messages.filter(m=>m.role==="assistant").flatMap(m=>m.artifacts||[]) as any[];
  const verified = arts.filter(a=>a.verified===true);
  if (!arts.length) return <p className="text-xs text-muted-foreground p-6">No verified artifacts yet — run an analysis to build a narrative.</p>;
  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      <div><h2 className="text-lg font-bold">Story — Data Storyteller</h2><p className="text-xs text-muted-foreground">{verified.length} of {arts.length} figures verified • Scroll to read, export via Report.</p></div>
      {arts.map((a:any,i)=>(
        <section key={i} className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2"><span className="text-[10px] font-mono uppercase text-primary">{a.type}</span><span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${a.verified? "bg-verified/10 text-verified border-verified/20":"bg-estimated/10 text-estimated border-estimated/20 border-dashed"}`}>{a.verified? "● Verified":"Estimated"}</span></div>
          <h3 className="text-sm font-semibold">{a.title||a.type}</h3>
          <pre className="text-xs font-mono whitespace-pre-wrap bg-muted/30 p-3 rounded">{JSON.stringify(a,null,2)}</pre>
        </section>
      ))}
    </div>
  );
}
