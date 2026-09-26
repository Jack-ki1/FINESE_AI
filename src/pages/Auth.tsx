import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Sparkles, HardDrive } from 'lucide-react';
import fineseLogo from '@/assets/finese-logo.jpg';
import { isLocalMode } from '@/lib/localMode';
import { createLocalOwnerSession, saveLocalOwner } from '@/lib/localAuth';

export default function Auth() {
  const { session, loading, isAdmin } = useAuth();
  const localMode = isLocalMode();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'signin' | 'signup'>(() =>
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(false);
  const [backendDown, setBackendDown] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate(isAdmin ? '/admin' : '/chat', { replace: true });
  }, [session, loading, isAdmin, navigate]);

  // Honest connectivity check: if the Supabase project is paused (DNS dead),
  // no credential pair can work — say so instead of blaming the password.
  // Skipped in local mode (no backend is expected there).
  useEffect(() => {
    if (localMode) return;
    let cancelled = false;
    const url = import.meta.env.VITE_SUPABASE_URL;
    if (!url) { setBackendDown(true); return; }
    fetch(`${url}/auth/v1/health`, { signal: AbortSignal.timeout(8000) })
      .then((r) => { if (!cancelled && !r.ok) setBackendDown(true); })
      .catch(() => { if (!cancelled) setBackendDown(true); });
    return () => { cancelled = true; };
  }, [localMode]);

  function friendlyAuthError(raw: string): string {
    if (/failed to fetch|networkerror|enotfound|load failed/i.test(raw)) {
      return 'Cannot reach the Supabase backend — the project may be paused or the URL misconfigured. Unpause it in the Supabase dashboard, then try again. Your credentials were not checked.';
    }
    if (/invalid login credentials/i.test(raw)) {
      return 'Invalid email or password. If this is a fresh project, the admin accounts may not exist yet — run `npm run admin:ensure` (see README) to provision them.';
    }
    if (/email not confirmed/i.test(raw)) {
      return 'Email not confirmed — check your inbox for the confirmation link, or disable email confirmation in Supabase Auth settings for dev.';
    }
    if (/already registered|already exists/i.test(raw)) {
      return 'Email already in use — try signing in instead.';
    }
    return raw || 'Authentication failed';
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/chat` },
        });
        if (error) {
          toast.error(friendlyAuthError(error.message));
          return;
        }
        if (data?.session) {
          toast.success('Account created. Signing you in…');
          return;
        }
        toast.success('Account created — check your inbox to confirm, then sign in.');
        setMode('signin');
        return;
      }
      // Sign in — Supabase only. No local fallback: a fake identity the
      // server never verified must never authenticate anyone.
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(friendlyAuthError(error.message));
        return;
      }
      toast.success('Welcome back');
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed';
      toast.error(friendlyAuthError(msg.includes('already registered') ? 'Email already in use — try signing in instead.' : msg));
    } finally {
      setBusy(false);
    }
  };

  const signInWithGoogle = async () => {
    if (oauthBusy) return;
    setOauthBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err?.message || 'Google sign-in failed');
    } finally {
      setOauthBusy(false);
    }
  };

  const forgotPassword = async () => {
    if (!email) return toast.error('Enter your email first, then tap “Forgot password?”');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Password reset link sent — check your inbox.');
    } catch (err: any) {
      toast.error(err?.message || 'Could not send reset email');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <div className="absolute top-[-10%] left-[-10%] w-[42rem] h-[42rem] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[36rem] h-[36rem] rounded-full bg-primary/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="p-[2px] rounded-2xl bg-brand-gradient shadow-lg">
            <img src={fineseLogo} alt="FINESE AI" className="w-14 h-14 rounded-2xl object-cover" />
          </div>
          <h1 className="mt-5 font-display font-extrabold text-3xl tracking-tight text-foreground">
            FINESE <span className="text-brand-gradient">AI</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === 'signin' ? 'Sign in to your workspace' : 'Create your workspace'}
          </p>
        </div>

        <form onSubmit={submit} className="bg-card border border-border rounded-2xl shadow-xl p-7 space-y-5">
          {localMode && (
            <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-4 space-y-2">
              <p className="text-sm font-semibold flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-primary" /> Local mode — this machine only
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                No Supabase, no account, no password — everything stays in this browser.
                Single-user only. Never enable <code className="font-mono">VITE_LOCAL_MODE</code> on a shared deployment.
              </p>
              <Button
                type="button"
                onClick={() => {
                  saveLocalOwner(createLocalOwnerSession());
                  toast.success('Local owner session created');
                  window.location.href = '/chat';
                }}
                className="w-full h-11 rounded-xl font-medium gap-2"
              >
                <HardDrive className="w-4 h-4" /> Continue locally as owner
              </Button>
              <div className="relative pt-1">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wide">
                  <span className="bg-card px-2 text-muted-foreground">or use Supabase</span>
                </div>
              </div>
            </div>
          )}
          {backendDown && !localMode && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-3 text-xs leading-relaxed">
              <p className="font-semibold text-amber-700 dark:text-amber-400">Supabase backend unreachable</p>
              <p className="text-muted-foreground mt-1">
                The auth server isn&apos;t responding — the Supabase project is likely <span className="font-medium">paused</span> (free-tier
                projects pause after inactivity). No password will work until it&apos;s back. Steps: open the Supabase dashboard →
                unpause <span className="font-mono">{import.meta.env.VITE_SUPABASE_PROJECT_ID}</span> → wait ~2 min → reload this page.
              </p>
            </div>
          )}
          <Button type="button" variant="outline" onClick={signInWithGoogle} disabled={oauthBusy}
            className="w-full h-11 rounded-xl font-medium gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z"/>{/* allow-hex - Google brand colors */}
              <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"/>{/* allow-hex */}
              <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z"/>{/* allow-hex */}
              <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"/>{/* allow-hex */}
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wide">
              <span className="bg-card px-2 text-muted-foreground">or with email</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium tracking-wide uppercase text-muted-foreground">Email</Label>
            <Input id="email" type="email" required autoComplete="email"
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-medium tracking-wide uppercase text-muted-foreground">Password</Label>
              {mode === 'signin' && (
                <button type="button" onClick={forgotPassword} className="text-xs text-primary hover:underline">
                  Forgot password?
                </button>
              )}
            </div>
            <Input id="password" type="password" required minLength={8}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters" className="h-11 rounded-xl" />
          </div>

          <Button type="submit" disabled={busy}
            className="w-full h-11 rounded-xl font-medium gap-2 shadow-md hover:shadow-lg transition-shadow">
            {busy ? (
              <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>

          <div className="text-center text-sm text-muted-foreground pt-1">
            {mode === 'signin' ? (
              <>New here?{' '}
                <button type="button" onClick={() => setMode('signup')}
                  className="text-primary font-medium hover:underline">Create an account</button>
              </>
            ) : (
              <>Have an account?{' '}
                <button type="button" onClick={() => setMode('signin')}
                  className="text-primary font-medium hover:underline">Sign in</button>
              </>
            )}
          </div>
        </form>

        <div className="mt-6 rounded-xl border bg-muted/20 p-3 text-xs">
          <p className="font-medium">Just looking around?</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Try the demo — sample data only, nothing saved, no account. Sign-in is never bypassed.
          </p>
          <Link
            to="/embed"
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-[11px] font-medium hover:bg-secondary transition-colors"
          >
            Try the demo (sample data only, nothing saved)
          </Link>
        </div>
        <p className="text-center text-[11px] text-muted-foreground mt-4">
          Your datasets are private to your account. <Link to="/" className="hover:text-foreground">Home</Link>
        </p>
      </div>
    </div>
  );
}
