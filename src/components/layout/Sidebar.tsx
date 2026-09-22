import { useDatumStore } from '@/store/datum.store';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Database, Plus, Search, BookOpen, LogOut, X } from 'lucide-react';
import fineseLogo from '@/assets/finese-logo.jpg';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';

export function Sidebar() {
  const { sessions, activeSessionId, setActiveSession, newSession, fileName, isLoaded, dataset, profile, sidebarOpen, toggleSidebar } = useDatumStore();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();

  if (!sidebarOpen) return null;

  const closeOnMobile = () => { if (isMobile) toggleSidebar(); };

  return (
    <>
      {isMobile && (
        <div className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm" onClick={toggleSidebar} />
      )}
      <aside
        className={`w-[260px] min-w-[260px] flex flex-col border-r border-border bg-card overflow-hidden ${
          isMobile ? 'fixed inset-y-0 left-0 z-50 h-[100dvh] shadow-2xl animate-fade-slide' : 'h-[100dvh]'
        }`}
      >
        {/* Brand */}
        <div className="px-5 pt-6 pb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img src={fineseLogo} alt="FINESE AI" className="w-8 h-8 rounded-xl object-cover shadow-sm" />
            <div>
              <span className="font-display font-extrabold text-foreground text-[17px] tracking-tight">FINESE AI</span>
              <p className="text-[10px] font-medium text-muted-foreground tracking-wide">Intelligent Analytics</p>
            </div>
          </div>
          {isMobile && (
            <button onClick={toggleSidebar} aria-label="Close menu"
              className="p-1.5 -mr-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* New session button */}
        <div className="px-4 pb-3">
          <button onClick={() => { newSession(); closeOnMobile(); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:shadow-md hover:brightness-105 transition-all duration-200">
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        {/* Sample Prompts */}
        <div className="px-4 pb-3">
          <button onClick={() => { navigate('/prompts'); closeOnMobile(); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-all duration-200">
            <BookOpen className="w-4 h-4" /> Sample Prompts
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted text-muted-foreground text-xs">
            <Search className="w-3.5 h-3.5" />
            <span>Search sessions…</span>
          </div>
        </div>

        {/* Sessions */}
        <div className="flex-1 overflow-y-auto px-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-2 py-2.5">Recent</p>
          <div className="space-y-1">
            {sessions.map(s => {
              const active = s.id === activeSessionId;
              return (
                <button key={s.id} onClick={() => { setActiveSession(s.id); closeOnMobile(); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition-all duration-150
                    ${active
                      ? 'bg-primary/8 text-foreground font-medium shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                  <MessageSquare className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : ''}`} />
                  <span className="truncate text-[13px]">{s.title}</span>
                  {s.rowCount && (
                    <span className="ml-auto text-[10px] font-mono text-muted-foreground opacity-60">{s.rowCount}×{s.colCount}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer — active dataset */}
        {isLoaded && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/15">
              <Database className="w-4 h-4 text-primary" />
              <div className="min-w-0 flex-1">
                <span className="text-[12px] font-medium text-foreground truncate block">{fileName}</span>
                <span className="text-[10px] text-muted-foreground">
                  {dataset?.length} rows · {profile?.length} cols
                </span>
              </div>
            </div>
          </div>
        )}

        {/* User + sign out */}
        {user && (
          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-muted transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-datum-cyan flex items-center justify-center text-primary-foreground text-xs font-semibold shrink-0">
                {(user.email || '?').slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-foreground truncate">{user.email}</p>
                <p className="text-[10px] text-muted-foreground">Signed in</p>
              </div>
              <button onClick={signOut}
                title="Sign out"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-datum-red hover:bg-datum-red/10 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
