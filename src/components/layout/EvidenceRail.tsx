import { useState, useEffect } from 'react';
import { useDatumStore } from '@/store/datum.store';
import { ChevronRight, ChevronLeft, FlaskConical } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export function EvidenceRail() {
  const { messages } = useDatumStore();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => { if (isMobile) setCollapsed(true); }, [isMobile]);

  // Gather evidence from last assistant messages' artifacts
  const evidence = messages
    .filter(m => m.role === 'assistant')
    .flatMap(m => (m.artifacts || []).map((a:any) => ({
      type: a.type,
      title: a.title || a.type,
      verified: a.verified === true,
      offline: a._offlinePreview === true,
      tool: a.toolName || a.tool || (a.verified ? 'compute-tools' : 'llm'),
      args: a.toolArgs || a.args,
      msgId: m.id,
    })))
    .slice(-12)
    .reverse();

  if (collapsed) {
    return (
      <div className="w-10 shrink-0 border-l bg-card flex flex-col items-center py-3 gap-2">
        <button onClick={()=>setCollapsed(false)} className="p-2 rounded-lg hover:bg-muted" title="Show Evidence">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground [writing-mode:vertical-lr]">Evidence</span>
        <span className="text-[10px] font-mono bg-verified/15 text-verified px-1.5 py-0.5 rounded">{evidence.filter(e=>e.verified).length}✓</span>
      </div>
    );
  }

  return (
    <div className="w-[300px] shrink-0 border-l bg-surface flex flex-col overflow-hidden">
      <div className="h-12 flex items-center justify-between px-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-verified" />
          <span className="text-xs font-semibold tracking-wide uppercase">Evidence</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-verified/15 text-verified border border-verified/20">{evidence.filter(e=>e.verified).length} verified</span>
        </div>
        <button onClick={()=>setCollapsed(true)} className="p-1.5 rounded-lg hover:bg-muted" title="Collapse">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {evidence.length === 0 ? (
          <p className="text-xs text-muted-foreground leading-relaxed">No tool-backed artifacts yet. Ask a question grounded in your dataset — e.g. “correlation between salary and age?” — and the server-verified calls will appear here in real time.</p>
        ) : evidence.map((e,i)=>(
          <div key={i} className={`rounded-lg border p-2.5 space-y-1 ${e.verified ? 'bg-white dark:bg-card border-verified/30' : e.offline ? 'bg-card border-estimated/30 border-dashed' : 'bg-card border-border'}`}>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${e.verified ? 'bg-verified/15 text-verified border-verified/30' : e.offline ? 'bg-estimated/10 text-estimated border-estimated/30 border-dashed' : 'bg-estimated/10 text-estimated border-estimated/30 border-dashed'}`}>
                {e.verified ? 'Verified' : e.offline ? 'Offline' : 'Estimated'}
              </span>
              <span className="text-xs font-mono truncate">{e.type}</span>
            </div>
            <div className="text-xs font-medium truncate">{e.title}</div>
            {e.tool && <div className="text-[11px] font-mono text-muted-foreground truncate">▸ {e.tool}{e.args ? `(${Object.entries(e.args).slice(0,3).map(([k,v])=>`${k}:${String(v).slice(0,18)}`).join(', ')})` : ''}</div>}
            <div className="text-[10px] font-mono text-muted-foreground">{e.verified ? 'n from server compute' : e.offline ? 'local JS compute' : 'LLM-generated'}</div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t bg-card">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          <span className="font-mono text-verified font-semibold">Teal = server-verified</span> · <span className="font-mono text-estimated">ochre dashed = estimated</span>. Numbers in mono are from compute, not the model.
        </p>
      </div>
    </div>
  );
}
