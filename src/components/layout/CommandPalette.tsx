import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDatumStore } from "@/store/datum.store";
import { Search, Database, MessageSquare, Settings, BarChart3 } from "lucide-react";
export function CommandPalette({ open, onClose }: { open: boolean; onClose: ()=>void }) {
  const nav = useNavigate();
  const { fileName, sessions } = useDatumStore();
  const [q, setQ] = useState("");
  useEffect(()=>{
    const h = (e: KeyboardEvent)=>{ if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){ e.preventDefault(); if(open) onClose(); else (document.getElementById("cmdk-trigger") as any)?.click(); } if(e.key==="Escape"&&open) onClose(); };
    window.addEventListener("keydown", h); return ()=>window.removeEventListener("keydown", h);
  },[open,onClose]);
  if(!open) return null;
  const items = [
    { label: "Go to Chat", icon: MessageSquare, action: ()=>{ onClose(); nav("/chat"); } },
    { label: `Dataset: ${fileName||"no dataset"}`, icon: Database, action: ()=>{ onClose(); nav("/data/upload"); } },
    { label: "Open Settings", icon: Settings, action: ()=>{ onClose(); nav("/settings"); } },
    { label: "Open Data Viewer", icon: BarChart3, action: ()=>{ onClose(); nav("/data/table"); } },
    ...sessions.slice(0,5).map(s=>({ label: `Session: ${s.title}`, icon: Search, action: ()=>{ onClose(); nav(`/chat/${s.id}`); } })),
  ].filter(it=>!q||it.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-foreground/20 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border bg-card shadow-xl overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center gap-2 px-3 py-2 border-b"><Search className="w-4 h-4 text-muted-foreground"/><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Jump to dataset, session, prompt, Evidence Rail…" className="flex-1 bg-transparent outline-none text-sm"/></div>
        <div className="max-h-64 overflow-auto p-1">
          {items.map((it,i)=>(<button key={i} onClick={it.action} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm text-left"><it.icon className="w-4 h-4"/>{it.label}</button>))}
          {items.length===0 && <p className="text-xs text-muted-foreground p-3">No matches</p>}
        </div>
        <div className="px-3 py-2 border-t text-[10px] font-mono text-muted-foreground">Cmd+K to toggle • Esc to close</div>
      </div>
    </div>
  );
}
