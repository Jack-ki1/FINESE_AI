import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function Admin() {
  const { user } = useAuth();
  const bypass = import.meta.env.VITE_DEV_ADMIN_BYPASS === 'true';
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (bypass) {
      setStats({ mode: 'BYPASS (VITE_DEV_ADMIN_BYPASS=true)', note: 'Supabase unreachable — local building mode. All data is mocked.' });
      setUsers([{ email: 'finese_admin@gmail.com', id: 'local-admin', is_admin: true }, { email: 'demo@test.com', id: 'demo-1' }]);
      setLogs([{ id: '1', level: 'info', message: 'Admin bypass active', created_at: new Date().toISOString() }]);
      return;
    }
    // Try live fetch when not bypassed
    (async () => {
      try {
        const { data: ds } = await supabase.from('datasets').select('file_hash,file_name,row_count,user_id').limit(5);
        setStats({ datasets: ds });
      } catch {}
      try {
        const { data: lg } = await supabase.from('app_logs').select('*').order('created_at',{ascending:false}).limit(20);
        setLogs(lg || []);
      } catch {}
    })();
  }, [bypass]);

  const testSignIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email: 'finese_admin@gmail.com', password: 'finese_admin1' });
    alert(error ? `Sign-in failed: ${error.message}` : 'Sign-in success — check /admin again');
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin — FINESE AI</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-mono ${bypass ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30' : 'bg-green-500/20 text-green-600 border border-green-500/30'}`}>
            {bypass ? 'BYPASS MODE' : 'LIVE MODE'} • {user?.email || 'no session'}
          </span>
        </div>

        {bypass && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader><CardTitle className="text-sm text-amber-700">Building-phase bypass active</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p><b>VITE_DEV_ADMIN_BYPASS=true</b> — you can access <code>/admin</code> without Supabase. Remove this in prod.</p>
              <p>Configured admin: <code>finese_admin@gmail.com</code> / <code>finese_admin1</code></p>
              <Button size="sm" onClick={testSignIn}>Test live sign-in (will fail if Supabase ENOTFOUND)</Button>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Admin User</CardTitle></CardHeader>
            <CardContent className="text-sm font-mono break-all">
              <div>Email: {user?.email || 'finese_admin@gmail.com (bypass)'}</div>
              <div>ID: {user?.id || 'local-admin'}</div>
              <div>is_admin: {String((user?.user_metadata as any)?.is_admin ?? (bypass ? true : false))}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">System Stats</CardTitle></CardHeader>
            <CardContent className="text-sm font-mono whitespace-pre-wrap">{JSON.stringify(stats, null, 2)}</CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-sm">Users (sample)</CardTitle></CardHeader>
          <CardContent><pre className="text-xs font-mono whitespace-pre-wrap">{JSON.stringify(users, null, 2)}</pre></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Recent app_logs</CardTitle></CardHeader>
          <CardContent><pre className="text-xs font-mono whitespace-pre-wrap">{JSON.stringify(logs, null, 2)}</pre></CardContent>
        </Card>

        <div className="flex gap-2">
          <Button onClick={() => window.location.href='/chat'}>Go to Chat</Button>
          <Button variant="outline" onClick={() => window.location.href='/'}>Home</Button>
        </div>
      </div>
    </div>
  );
}
