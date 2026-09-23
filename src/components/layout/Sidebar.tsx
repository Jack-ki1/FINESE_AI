import { useState } from 'react';
import { useDatumStore } from '@/store/datum.store';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Database, Plus, Search, BookOpen, LogOut, X, Settings, PanelLeft } from 'lucide-react';
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
        className={`w-[260px] min-w-[260px] flex flex-col bg-[#171717] text-white overflow-hidden ${
          isMobile ? 'fixed inset-y-0 left-0 z-50 h-[100dvh] shadow-2xl' : 'h-[100dvh]'
        }`}
      >
        {/* Header — ChatGPT style */}
        <div className="px-3 pt-3 pb-2 flex items-center justify-between">
          <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white">
            <PanelLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1">
            <button onClick={() => { navigate('/settings'); closeOnMobile(); }} className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white" title="Settings">
              <Settings className="w-4 h-4" />
            </button>
            {isMobile && (
              <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-white/10 text-white/70">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Logo + New Chat — ChatGPT style */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2.5 px-2 py-2 mb-3">
            <img src={fineseLogo} alt="FINESE" className="w-7 h-7 rounded-full object-cover" />
            <span className="font-semibold text-[14px] tracking-tight">FINESE AI</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono">2026</span>
          </div>
          <button onClick={() => { newSession(); navigate('/chat'); closeOnMobile(); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white text-black text-[13px] font-medium hover:bg-white/90 transition-colors">
            <Plus className="w-4 h-4" /> New chat
          </button>
          <button onClick={() => { navigate('/chat'); closeOnMobile(); }} className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-white/80 text-[13px] hover:bg-white/10">
            <Search className="w-4 h-4" /> Temporary chat
          </button>
        </div>

        {/* Search — functional like ChatGPT */}
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.05] border border-white/5 focus-within:bg-white/10 focus-within:border-white/10">
            <Search className="w-3.5 h-3.5 text-white/40" />
            <input
              value={search}
              onChange={e=>setSearch(e.target.value)}
              placeholder="Search chats"
              className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/40 outline-none"
            />
            {search && <button onClick={()=>setSearch('')} className="text-white/40 hover:text-white"><X className="w-3 h-3" /></button>}
          </div>
        </div>

        {/* Sample Prompts + Data */}
        <div className="px-3 py-2 flex gap-2">
          <button onClick={() => { navigate('/prompts'); closeOnMobile(); }} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 text-white/70 text-xs hover:bg-white/10">
            <BookOpen className="w-3.5 h-3.5" /> Prompts
          </button>
          <button onClick={() => { navigate('/data/upload'); closeOnMobile(); }} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/5 text-white/70 text-xs hover:bg-white/10">
            <Database className="w-3.5 h-3.5" /> Data
          </button>
        </div>

        {/* Chats — grouped like ChatGPT */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
          {Object.entries(grouped).map(([label, list]) => list.length ? (
            <div key={label}>
              <p className="text-[11px] font-medium text-white/40 px-2 py-1.5">{label}</p>
              <div className="space-y-0.5">
                {list.map(s => {
                  const active = s.id === activeSessionId;
                  return (
                    <div key={s.id} className={`group flex items-center gap-2 px-2 py-2 rounded-lg text-[13px] cursor-pointer ${active ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/[0.05] hover:text-white'}`} onClick={() => { setActiveSession(s.id); navigate('/chat'); closeOnMobile(); }}>
                      <MessageSquare className="w-4 h-4 shrink-0 opacity-60" />
                      <span className="truncate flex-1">{s.title}</span>
                      <button onClick={e=>{e.stopPropagation(); /* share */ navigator.clipboard.writeText(window.location.href);}} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded">
                        <Search className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null)}
          {filtered.length===0 && <p className="text-xs text-white/30 px-2 py-4">No chats found</p>}
        </div>

        {/* Dataset — ChatGPT style footer */}
        {isLoaded && (
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 border border-white/5">
              <Database className="w-4 h-4 text-white/60" />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium text-white truncate block">{fileName}</span>
                <span className="text-[11px] text-white/40">{dataset?.length} rows · {profile?.length} cols</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>
        )}

        {/* User — ChatGPT style */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer" onClick={()=>navigate('/settings')}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold">
              {(user?.email || 'F').slice(0,1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">{user?.email || 'finese_admin@gmail.com'}</p>
              <p className="text-[11px] text-white/40">Free • Open Mode</p>
            </div>
            <button onClick={signOut} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
