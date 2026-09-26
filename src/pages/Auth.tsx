import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import fineseLogo from '@/assets/finese-logo.jpg';
import { createLocalUser, validateLocalUser, createLocalSessionForUser, saveLocalSession } from '@/lib/localAuth';

export default function Auth() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate('/chat', { replace: true });
  }, [session, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const isNetworkError = (m: string) => /failed to fetch|network|enotfound|fetch/i.test(m);
    try {
      if (mode === 'signup') {
        // try supabase first
        try {
          const { error, data } = await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/chat` },
          });
          if (error) throw error;
          // if supabase succeeds, also mirror locally for offline fallback
          const local = createLocalUser(email, password);
          if (!local.error) {
            // mark admin if matches default admin emails? keep as is
          }
          toast.success('Account created. Signing you in…');
          // supabase will auto-sign in or require confirm; if session exists navigate
          if (data?.session) {
            // will be handled by useAuth redirect
            return;
          }
          // if no session (confirm required), create local session so user can continue locally
          const u = validateLocalUser(email, password);
          if (u) {
            const sess = createLocalSessionForUser(u);
            saveLocalSession(sess);
            window.location.href = '/chat';
          }
          return;
        } catch (supaErr: any) {
          const msg = supaErr?.message || '';
          if (isNetworkError(msg) || msg.includes('Failed to fetch')) {
            // fallback to local
            const res = createLocalUser(email, password);
            if (res.error) throw new Error(res.error);
            const sess = createLocalSessionForUser(res.user!);
            saveLocalSession(sess);
            toast.success('Account created locally — offline mode');
            window.location.href = '/chat';
            return;
          }
          throw supaErr;
        }
      } else {
        // signin
        try {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          toast.success('Welcome back');
          return;
        } catch (supaErr: any) {
          const msg = supaErr?.message || '';
          // try local fallback for network or invalid credentials
          const localUser = validateLocalUser(email, password);
          if (localUser) {
            const sess = createLocalSessionForUser(localUser);
            saveLocalSession(sess);
            toast.success(`Welcome back, ${localUser.is_admin ? 'admin' : 'user'} — local sign in`);
            window.location.href = '/chat';
            return;
          }
          if (isNetworkError(msg)) {
            throw new Error('Network error and no local account found — try signing up first');
          }
          throw supaErr;
        }
      }
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed';
      toast.error(msg.includes('already registered') ? 'Email already in use — try signing in instead.' : msg);
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
          <p className="font-medium">Demo accounts (local, stored in browser):</p>
          <p className="font-mono text-[11px] mt-1">Admin: <span className="font-semibold">finese_admin@gmail.com</span> / <span className="font-semibold">finese_admin1</span></p>
          <p className="font-mono text-[11px]">Admin 2: admin@finese.ai / Admin123!</p>
          <p className="text-[11px] text-muted-foreground mt-1">Sign up creates a local account when Supabase is offline. All data stays in <code>localStorage</code>.</p>
        </div>
        <p className="text-center text-[11px] text-muted-foreground mt-4">
          Your datasets are private to your account. <Link to="/" className="hover:text-foreground">Home</Link>
        </p>
      </div>
    </div>
  );
}
