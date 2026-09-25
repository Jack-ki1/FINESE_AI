import { useDatumStore } from "@/store/datum.store";
export function TrustScore() {
  const { messages } = useDatumStore();
  const arts = messages.filter(m=>m.role==="assistant").flatMap(m=>m.artifacts||[]) as any[];
  if (!arts.length) return null;
  const v = arts.filter(a=>a.verified===true).length;
  const flagged = arts.filter(a=>a.verified===true && (a as any).flags?.length).length;
  return (
    <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded-full border bg-card" title={`${v} verified, ${flagged} flagged`}>
      <span className={`w-1.5 h-1.5 rounded-full ${flagged? "bg-amber-500":"bg-verified"}`}/>
      {v}/{arts.length} verified{flagged? ` · ${flagged} flagged`: ""}
    </span>
  );
}
