import { useState } from 'react';
import { useDatumStore } from '@/store/datum.store';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Database, Plus, Search, BookOpen, LogOut, X, Settings, PanelLeft, ShieldCheck, Cloud, PieChart, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import fineseLogo from '@/assets/finese-logo.jpg';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';

export function Sidebar() {
  const { sessions, activeSessionId, setActiveSession, newSession, fileName, isLoaded, dataset, profile, sidebarOpen, toggleSidebar } = useDatumStore();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');

  if (!sidebarOpen) return null;

  const closeOnMobile = () => { if (isMobile) toggleSidebar(); };

  // Group by date like ChatGPT: Today, Yesterday, Previous 7 Days, Previous 30 Days
  const filtered = sessions.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));
  const grouped = (() => {
    const now = new Date();
    const groups: Record<string, typeof sessions> = { Today: [], Yesterday: [], 'Previous 7 Days': [], 'Previous 30 Days': [] };
    filtered.forEach(s => {
      const d = new Date(s.createdAt);
      const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diff === 0) groups.Today.push(s);
      else if (diff === 1) groups.Yesterday.push(s);
      else if (diff < 7) groups['Previous 7 Days'].push(s);
      else groups['Previous 30 Days'].push(s);
    });
    return groups;
  })();

  return (
    <>
      {isMobile && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={toggleSidebar} />
      )}
      <aside
        className={`w-[260px] min-w-[260px] flex flex-col bg-sidebar text-sidebar-foreground overflow-hidden ${
          isMobile ? 'fixed inset-y-0 left-0 z-50 h-[100dvh] shadow-2xl' : 'h-[100dvh]'
        }`}
      >
        {/* Header */}
        <div className="px-3 pt-3 pb-2 flex items-center justify-between">
          <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground hover:text-foreground">
            <PanelLeft className="w-4 h-4" strokeWidth={1.75} />
          </button>
          <div className="flex items-center gap-1">
            <button onClick={() => { navigate('/settings'); closeOnMobile(); }} className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground hover:text-foreground" title="Settings">
              <ShieldCheck className="w-4 h-4" strokeWidth={1.75} />
            </button>
            {isMobile && (
              <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground">
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            )}
          </div>
        </div>

        {/* Logo + New Chat */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2.5 px-2 py-2 mb-3">
            <img src={fineseLogo} alt="FINESE" className="w-7 h-7 rounded-full object-cover" />
            <span className="font-semibold text-[14px] tracking-tight text-sidebar-foreground">FINESE AI</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-sidebar-accent text-sidebar-foreground/60 font-mono border border-sidebar-border">2026</span>
          </div>
          <button onClick={() => { newSession(); navigate('/chat'); closeOnMobile(); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" strokeWidth={1.75} /> New chat
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent border border-sidebar-border focus-within:bg-card focus-within:border-sidebar-ring">
            <Search className="w-3.5 h-3.5 text-sidebar-foreground/50" />
            <input
              value={search}
              onChange={e=>setSearch(e.target.value)}
              placeholder="Search chats"
              className="flex-1 bg-transparent text-[13px] text-sidebar-foreground placeholder:text-sidebar-foreground/40 outline-none"
            />
            {search && <button onClick={()=>setSearch('')} className="text-sidebar-foreground/50 hover:text-sidebar-foreground"><X className="w-3 h-3" /></button>}
          </div>
        </div>

        {/* Sample Prompts + Data + Metrics/Workspaces */}
        <div className="px-3 py-2 flex gap-2">
          <button onClick={() => { navigate('/prompts'); closeOnMobile(); }} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-sidebar-accent text-sidebar-foreground text-xs hover:opacity-80 border border-sidebar-border">
            <BookOpen className="w-3.5 h-3.5" strokeWidth={1.75} /> Prompts
          </button>
          <button onClick={() => { navigate('/data/upload'); closeOnMobile(); }} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-sidebar-accent text-sidebar-foreground text-xs hover:opacity-80 border border-sidebar-border">
            <Database className="w-3.5 h-3.5" strokeWidth={1.75} /> Data
          </button>
        </div>
        <div className="px-3 pb-1 flex gap-2">
          <button onClick={() => { navigate('/metrics'); closeOnMobile(); }} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg bg-sidebar-accent text-sidebar-foreground text-[11px] hover:opacity-80 border border-sidebar-border">
            <BarChart3 className="w-3.5 h-3.5" strokeWidth={1.75} /> Metrics
          </button>
          <button onClick={() => { navigate('/workspaces'); closeOnMobile(); }} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg bg-sidebar-accent text-sidebar-foreground text-[11px] hover:opacity-80 border border-sidebar-border">
            <Cloud className="w-3.5 h-3.5" strokeWidth={1.75} /> Workspaces
          </button>
        </div>

        {/* Chats — grouped */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 scrollbar-thin scrollbar-thumb-sidebar-border">
          {Object.entries(grouped).map(([label, list]) => list.length ? (
            <div key={label}>
              <p className="text-[11px] font-medium text-sidebar-foreground/50 px-2 py-1.5">{label}</p>
              <div className="space-y-0.5">
                {list.map(s => {
                  const active = s.id === activeSessionId;
                  return (
                    <SessionRow key={s.id} session={s} active={active} onSelect={()=>{ setActiveSession(s.id); navigate('/chat'); closeOnMobile(); }} />
                  );
                })}
              </div>
            </div>
          ) : null)}
          {filtered.length===0 && <p className="text-xs text-sidebar-foreground/40 px-2 py-4">No chats found</p>}
        </div>

        {/* Dataset footer */}
        {isLoaded && (
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-sidebar-accent border border-sidebar-border">
              <PieChart className="w-4 h-4 text-sidebar-foreground/60" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium text-sidebar-foreground truncate block">{fileName}</span>
                <span className="text-[11px] text-sidebar-foreground/60">{dataset?.length} rows · {profile?.length} cols</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-verified animate-pulse" />
            </div>
          </div>
        )}

        {/* User */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-sidebar-accent cursor-pointer" onClick={()=>navigate('/settings')}>
            <div className="w-7 h-7 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-semibold">
              {(user?.email || 'F').slice(0,1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.email || 'finese_admin@gmail.com'}</p>
              <p className="text-[11px] text-sidebar-foreground/60">Free • Open Mode</p>
            </div>
            <button onClick={signOut} className="p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/50 hover:text-sidebar-foreground">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function SessionRow({ session, active, onSelect }: { session: any; active: boolean; onSelect: () => void }) {
  const { deleteSession, renameSession } = useDatumStore();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(session.title);
  const [menuOpen, setMenuOpen] = useState(false);

  const save = () => {
    const t = title.trim();
    if (t && t !== session.title) renameSession(session.id, t);
    setEditing(false);
    setMenuOpen(false);
  };

  return (
    <div className={`group flex items-center gap-1 px-2 py-1.5 rounded-lg text-[13px] ${active ? 'bg-sidebar-accent border border-sidebar-border text-sidebar-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`}>
      <button onClick={onSelect} className="flex items-center gap-2 flex-1 min-w-0 text-left">
        <Search className="w-3.5 h-3.5 shrink-0 opacity-60" strokeWidth={1.75} />
        {editing ? (
          <input value={title} onChange={e=>setTitle(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') save(); if(e.key==='Escape'){ setTitle(session.title); setEditing(false); } }} onBlur={save} autoFocus className="flex-1 bg-card border border-sidebar-border rounded px-1.5 py-0.5 text-xs outline-none" onClick={e=>e.stopPropagation()} />
        ) : (
          <span className="truncate flex-1">{session.title}</span>
        )}
      </button>
      {!editing && (
        <div className={`flex items-center gap-0.5 ${menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
          <button onClick={e=>{ e.stopPropagation(); setMenuOpen(!menuOpen); }} className="p-1 rounded hover:bg-card border border-transparent hover:border-sidebar-border"><MoreHorizontal className="w-3 h-3" /></button>
          {menuOpen && (
            <div className="flex items-center gap-0.5">
              <button onClick={e=>{ e.stopPropagation(); setTitle(session.title); setEditing(true); }} className="p-1 rounded hover:bg-card border border-sidebar-border" title="Rename"><Pencil className="w-3 h-3" /></button>
              <button onClick={e=>{ e.stopPropagation(); if(confirm(`Delete "${session.title}"?`)) deleteSession(session.id); }} className="p-1 rounded hover:bg-destructive/10 text-destructive border border-transparent hover:border-destructive/20" title="Delete"><Trash2 className="w-3 h-3" /></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
