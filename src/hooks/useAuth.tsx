import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { clearLocalSession, purgeLegacyLocalAuth, loadLocalOwner, clearLocalOwner } from '@/lib/localAuth';
import { isLocalMode } from '@/lib/localMode';

interface AuthCtx {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  /** True when VITE_LOCAL_MODE=true: single-user local operation, no cloud. */
  isLocalMode: boolean;
}

const Ctx = createContext<AuthCtx>({ session: null, user: null, loading: true, signOut: async () => {}, isAdmin: false, isLocalMode: false });

function checkIsAdmin(user: User | null): boolean {
  if (!user) return false;
  const meta = (user.user_metadata as any) || {};
  const appMeta = (user.app_metadata as any) || {};
  if (meta.is_admin === true || appMeta.is_admin === true) return true;
  // Single-user local mode: the explicit local owner administers their own
  // machine. Gated on the flag — never true on a hosted deployment unless
  // someone deliberately turns local mode on there (don't).
  if (isLocalMode() && meta.is_local_owner === true) return true;
  // Optional allow-list via env (comma-separated)
  const allow = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map((s:string)=>s.trim().toLowerCase()).filter(Boolean);
  if (allow.length && user.email && allow.includes(user.email.toLowerCase())) return true;
  return false;
}

// DEV-only escape hatch for local UI work. Compiled out of prod builds
// entirely via import.meta.env.DEV — never rely on it in preview/prod, and
// never authenticate a real user through it.
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
  const localMode = isLocalMode();
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
    if (localMode) {
      // Explicit single-user mode: restore the owner's own session if they
      // previously clicked "Continue locally". Nothing is seeded.
      purgeLegacyLocalAuth();
      return (loadLocalOwner() as Session) || null;
    }
    // Supabase-only: never seed a session from localStorage. Legacy
    // local/backdoor keys are purged so a previously-planted fake session
    // cannot persist across the fix.
    purgeLegacyLocalAuth();
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (LOCAL_BYPASS) return false;
    if (localMode) return false;
    return true;
  });

  useEffect(() => {
    if (LOCAL_BYPASS) return;
    if (localMode) return; // no cloud calls at all in local mode
    purgeLegacyLocalAuth();
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 3000);
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      if (cancelled) return;
      // Trust only Supabase-issued sessions. Never fall back to localStorage.
      setSession(s);
      setLoading(false);
      clearTimeout(timeout);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setLoading(false);
      clearTimeout(timeout);
    }).catch(() => {
      if (!cancelled) {
        setLoading(false);
        clearTimeout(timeout);
      }
    });
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, [localMode]);

  const signOut = async () => {
    if (LOCAL_BYPASS) {
      try { localStorage.removeItem('finese_local_session'); } catch {}
      clearLocalSession();
      purgeLegacyLocalAuth();
      try { localStorage.removeItem('finese-ai-store'); } catch {}
      window.location.href = '/auth';
      return;
    }
    if (localMode) {
      clearLocalOwner();
      window.location.href = '/auth';
      return;
    }
    try { await supabase.auth.signOut(); } catch {}
    clearLocalSession();
    purgeLegacyLocalAuth();
    try { localStorage.removeItem('finese_local_session'); } catch {}
    window.location.href = '/auth';
  };

  const user = session?.user ?? null;

  // Local-mode sessions can also be established from the Auth page after
  // mount (the "Continue locally" click writes directly to localStorage).
  // Pick it up without a reload.
  useEffect(() => {
    if (!localMode || session) return;
    const owner = loadLocalOwner();
    if (owner) setSession(owner as Session);
  }, [localMode, session]);

  return (
    <Ctx.Provider value={{ session, user, loading, signOut, isAdmin: checkIsAdmin(user), isLocalMode: localMode }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
