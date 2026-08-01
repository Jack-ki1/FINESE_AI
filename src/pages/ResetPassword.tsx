import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase parses the recovery hash and emits PASSWORD_RECOVERY / SIGNED_IN
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Password updated');
      navigate('/chat', { replace: true });
    } catch (err: any) {
      toast.error(err?.message || 'Could not update password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-7 space-y-5">
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary"><KeyRound className="w-5 h-5" /></div>
          <h1 className="font-display font-bold text-xl">Set a new password</h1>
          <p className="text-sm text-muted-foreground text-center">
            {ready ? 'Choose a strong password you haven’t used elsewhere.' : 'Open this page from the link in your reset email.'}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs font-medium tracking-wide uppercase text-muted-foreground">New password</Label>
          <Input id="password" type="password" required minLength={8} autoComplete="new-password"
            value={password} onChange={e => setPassword(e.target.value)}
            placeholder="At least 8 characters" className="h-11 rounded-xl" />
        </div>
        <Button type="submit" disabled={busy || !ready} className="w-full h-11 rounded-xl font-medium">
          Update password
        </Button>
      </form>
    </div>
  );
}