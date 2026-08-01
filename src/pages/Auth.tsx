import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import fineseLogo from '@/assets/finese-logo.jpg';

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
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/chat` },
        });
        if (error) throw error;
        toast.success('Account created. Signing you in…');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back');
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
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
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
      {/* Background flourish */}
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <div className="absolute top-[-10%] left-[-10%] w-[42rem] h-[42rem] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[36rem] h-[36rem] rounded-full bg-datum-cyan/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="p-[2px] rounded-2xl bg-gradient-to-br from-primary via-datum-violet to-datum-cyan shadow-lg">
            <img src={fineseLogo} alt="FINESE AI" className="w-14 h-14 rounded-2xl object-cover" />
          </div>
          <h1 className="mt-5 font-display font-extrabold text-3xl tracking-tight text-foreground">
            FINESE <span className="bg-gradient-to-r from-primary to-datum-cyan bg-clip-text text-transparent">AI</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === 'signin' ? 'Sign in to your workspace' : 'Create your workspace'}
          </p>
        </div>

        <form onSubmit={submit} className="bg-card border border-border rounded-2xl shadow-xl p-7 space-y-5">
          <Button type="button" variant="outline" onClick={signInWithGoogle} disabled={oauthBusy}
            className="w-full h-11 rounded-xl font-medium gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z"/>
              <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"/>
              <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z"/>
              <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"/>
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

        <p className="text-center text-[11px] text-muted-foreground mt-6">
          Your datasets are private to your account. <Link to="/" className="hover:text-foreground">Home</Link>
        </p>
      </div>
    </div>
  );
}