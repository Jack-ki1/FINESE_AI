import { useState } from 'react';
import { useDatumStore } from '@/store/datum.store';
import { PanelLeftClose, PanelLeft, Clock } from 'lucide-react';
import { formatNumber, healthScore } from '@/lib/stats';
import { useNavigate } from 'react-router-dom';
import { ExportButton } from '@/components/chat/ExportButton';
import { ChatSearch } from '@/components/chat/ChatSearch';
import { ThemeToggle } from '@/components/ThemeToggle';
import { TrustScore } from '@/components/layout/TrustScore';

export function Topbar() {
  const { fileName, isLoaded, dataset, profile, sidebarOpen, toggleSidebar, sessions, activeSessionId, changelogOpen, toggleChangelog } = useDatumStore();
  const navigate = useNavigate();
  const session = sessions.find(s => s.id === activeSessionId);
  const health = profile ? healthScore(profile) : 0;
  const [modelOpen, setModelOpen] = useState(false);

  // Get model from settings
  const model = (() => {
    try {
      const raw = localStorage.getItem('finese-settings');
      if (raw) return JSON.parse(raw).state?.ai?.model || 'FINESE AI';
    } catch {}
    return 'FINESE AI';
  })();

  return (
    <header className="h-12 min-h-[48px] flex items-center justify-between px-3 sm:px-4 border-b border-border bg-background sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <button onClick={toggleSidebar} aria-label="Toggle menu" className="p-1.5 rounded-lg text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 shrink-0">
          {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
        </button>
        {/* Model selector — ChatGPT style */}
        <div className="relative">
          <button onClick={()=>setModelOpen(!modelOpen)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-sm font-medium">
            <span className="hidden sm:inline">FINESE AI</span>
            <span className="sm:hidden">FINESE</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono hidden md:inline">{model.split('/').pop()?.split(':')[0] || '2026'}</span>
            <svg className={`w-3 h-3 opacity-60 transition-transform ${modelOpen?'rotate-180':''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          {modelOpen && (
            <div className="absolute top-full left-0 mt-1 w-72 rounded-xl border bg-popover shadow-xl p-2 z-20">
              <div className="px-3 py-2 border-b border-black/5 dark:border-white/5">
                <p className="text-xs font-semibold">FINESE AI</p>
                <p className="text-[11px] text-muted-foreground">Intelligent Analytics • 2026</p>
              </div>
              <div className="py-1">
                <div className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground">Current</div>
                <div className="mx-1 px-2 py-2 rounded-lg bg-black/5 dark:bg-white/5 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-[10px]">✦</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{model}</p>
                    <p className="text-[10px] text-muted-foreground">via Settings → AI</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
              </div>
              <button onClick={()=>{ setModelOpen(false); navigate('/settings'); }} className="w-full mt-1 px-3 py-1.5 text-xs text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-left">Change in Settings →</button>
            </div>
          )}
        </div>
        <span className="hidden lg:inline text-xs text-black/40 dark:text-white/30 truncate max-w-[200px]">{session?.title || 'New chat'}</span>
        <span className="hidden md:inline text-[10px] font-mono px-1.5 py-0.5 rounded border bg-muted text-muted-foreground">⌘K</span>
      </div>

      <div className="flex items-center gap-1">
        {isLoaded && (
          <div className="hidden md:flex items-center gap-1.5 mr-2">
            <span className="text-[11px] px-2 py-1 rounded-full bg-black/5 dark:bg-white/5 border text-black/60 dark:text-white/60 font-mono hidden xl:inline">{fileName}</span>
            <span className="text-[11px] px-1.5 py-1 rounded-full bg-white dark:bg-white/5 border text-black/60 dark:text-white/50 hidden lg:inline">{formatNumber(dataset?.length||0)} rows</span>
            <span className={`text-[11px] px-1.5 py-1 rounded-full border hidden lg:inline ${health>=90?'bg-green-500/10 text-green-600 border-green-500/20':health>=70?'bg-amber-500/10 text-amber-600 border-amber-500/20':'bg-red-500/10 text-red-600 border-red-500/20'}`}>♥ {health}%</span>
          </div>
        )}
        <button onClick={async()=>{
          const url = window.location.href;
          const title = session?.title || 'FINESE AI chat';
          try {
            if (navigator.share) { await navigator.share({ title, url }); }
            else { await navigator.clipboard.writeText(url); const { toast } = await import('sonner'); toast.success('Link copied to clipboard'); }
          } catch { try { await navigator.clipboard.writeText(url); const { toast } = await import('sonner'); toast.success('Link copied'); } catch {} }
        }} className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border bg-card hover:bg-accent">
          <span className="hidden md:inline">Share</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684z"/></svg>
        </button>
        <TrustScore />
        <ChatSearch />
        <ExportButton />
        <ThemeToggle />
        <button onClick={toggleChangelog} className={`p-1.5 rounded-lg ${changelogOpen ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white' : 'text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'}`}>
          <Clock className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

function Chip({ children, color }: { children: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'text-primary bg-primary/8 border-primary/15',
    amber: 'text-datum-amber bg-datum-amber/8 border-datum-amber/15',
    cyan: 'text-datum-cyan bg-datum-cyan/8 border-datum-cyan/15',
    violet: 'text-datum-violet bg-datum-violet/8 border-datum-violet/15',
    green: 'text-datum-green bg-datum-green/8 border-datum-green/15',
    red: 'text-datum-red bg-datum-red/8 border-datum-red/15',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-medium border ${colorMap[color] || colorMap.blue}`}>
      {children}
    </span>
  );
}
