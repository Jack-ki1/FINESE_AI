import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { loadLocalSession, clearLocalSession } from '@/lib/localAuth';

interface AuthCtx {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const Ctx = createContext<AuthCtx>({ session: null, user: null, loading: true, signOut: async () => {}, isAdmin: false });

function checkIsAdmin(user: User | null): boolean {
  if (!user) return false;
  const meta = (user.user_metadata as any) || {};
  const appMeta = (user.app_metadata as any) || {};
  if (meta.is_admin === true || appMeta.is_admin === true) return true;
  // Optional allow-list via env (comma-separated)
  const allow = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map((s:string)=>s.trim().toLowerCase()).filter(Boolean);
  if (allow.length && user.email && allow.includes(user.email.toLowerCase())) return true;
  return false;
}

const LOCAL_BYPASS = import.meta.env.DEV && import.meta.env.VITE_LOCAL_AUTH_BYPASS === 'true';
function createLocalSession(): any {
  const now = Math.floor(Date.now()/1000);
  return {
    access_token: 'local-dev-bypass',
    refresh_token: 'local-dev-bypass',
    expires_in: 86400,
    expires_at: now + 86400,
    token_type: 'bearer',
    user: {
      id: '00000000-0000-4000-a000-000000000001',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'local-dev@finese.ai',
      email_confirmed_at: new Date().toISOString(),
      user_metadata: { is_admin: true, name: 'Local Dev (bypass)' },
      app_metadata: { provider: 'email' },
      created_at: new Date().toISOString(),
    },
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    if (LOCAL_BYPASS) {
      try {
        const raw = localStorage.getItem('finese_local_session');
        if (raw) return JSON.parse(raw) as Session;
        const s = createLocalSession();
        localStorage.setItem('finese_local_session', JSON.stringify(s));
        return s as any;
      } catch { return createLocalSession() as any; }
    }
    // Try local stored session (signup/login fallback) before supabase
    const local = loadLocalSession();
    if (local) return local as Session;
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (LOCAL_BYPASS) return false;
    const local = loadLocalSession();
    if (local) return false;
    return true;
  });

  useEffect(() => {
    if (LOCAL_BYPASS) return;
    // If we already have a local session, don't override it with null supabase session
    const local = loadLocalSession();
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 3000);
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      if (cancelled) return;
      if (s) {
        setSession(s);
      } else {
        // keep local session if exists, otherwise null
        const ls = loadLocalSession();
        if (ls) setSession(ls as Session);
        else setSession(null);
      }
      setLoading(false);
      clearTimeout(timeout);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) setSession(data.session);
      else {
        const ls = loadLocalSession();
        if (ls) setSession(ls as Session);
        else setSession(null);
      }
      setLoading(false);
      clearTimeout(timeout);
    }).catch(() => {
      if (!cancelled) {
        const ls = loadLocalSession();
        if (ls) setSession(ls as Session);
        else setLoading(false);
        clearTimeout(timeout);
      }
    });
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (LOCAL_BYPASS) {
      try { localStorage.removeItem('finese_local_session'); } catch {}
      clearLocalSession();
      try { localStorage.removeItem('finese-ai-store'); } catch {}
      window.location.href = '/auth';
      return;
    }
    try { await supabase.auth.signOut(); } catch {}
    clearLocalSession();
    try { localStorage.removeItem('finese_local_session'); } catch {}
    // don't wipe finese-ai-store entirely to preserve other users? but clear session part
    window.location.href = '/auth';
  };

  const user = session?.user ?? null;

  return (
    <Ctx.Provider value={{ session, user, loading, signOut, isAdmin: checkIsAdmin(user) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
