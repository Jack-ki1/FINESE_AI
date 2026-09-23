import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthCtx {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({ session: null, user: null, loading: true, signOut: async () => {} });

// OPEN MODE: frozen auth — always return a mock admin session so the app is fully open
const MOCK_KEY = 'finese_admin_mock_session';
function createOpenSession(): Session {
  const now = Math.floor(Date.now()/1000);
  return {
    access_token: 'open-mode-jwt',
    refresh_token: 'open-mode-refresh',
    expires_in: 86400,
    expires_at: now + 86400,
    token_type: 'bearer',
    user: {
      id: '00000000-0000-4000-a000-000000000001',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'finese_admin@gmail.com',
      email_confirmed_at: new Date().toISOString(),
      user_metadata: { is_admin: true, name: 'FINESE Admin (Open Mode)' },
      app_metadata: { provider: 'email' },
      created_at: new Date().toISOString(),
    } as any,
  } as any;
}
function loadMockSession(): Session | null {
  try {
    const raw = localStorage.getItem(MOCK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.expires_at && parsed.expires_at * 1000 < Date.now()) {
        localStorage.removeItem(MOCK_KEY);
      } else {
        return parsed as Session;
      }
    }
  } catch {}
  // OPEN MODE: if no mock, create one automatically so app is always open
  if (import.meta.env.VITE_OPEN_MODE !== 'false') {
    const open = createOpenSession();
    try { localStorage.setItem(MOCK_KEY, JSON.stringify(open)); } catch {}
    return open;
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // OPEN MODE: always open — return mock immediately
    const mock = loadMockSession();
    if (mock) {
      setSession(mock as any);
      setLoading(false);
      // Still sync with Supabase in background if reachable, but don't block
      supabase.auth.getSession().then(({ data }) => {
        if (data.session && !(loadMockSession() as any)?.user?.user_metadata?.is_admin) {
          // ignore real session in open mode
        }
      }).catch(()=>{});
      return;
    }
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      if (loadMockSession()) return;
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (loadMockSession()) return;
      setSession(data.session);
      setLoading(false);
    }).catch(() => {
      const m = loadMockSession();
      if (m) setSession(m as any);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try { localStorage.removeItem(MOCK_KEY); } catch {}
    try { await supabase.auth.signOut(); } catch {}
    // Clear persisted store so next user doesn't inherit sessions
    try { localStorage.removeItem('finese-ai-store'); } catch {}
    window.location.href = '/auth';
  };

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);