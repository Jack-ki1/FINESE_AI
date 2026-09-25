import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function Admin() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: ds } = await supabase.from('datasets').select('file_hash,file_name,row_count,user_id').limit(5);
        if (!cancelled) setStats({ datasets: ds });
      } catch {}
      try {
        const { data: lg } = await supabase.from('app_logs').select('*').order('created_at',{ascending:false}).limit(20);
        if (!cancelled) setLogs(lg || []);
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold font-display">Admin — FINESE AI</h1>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-primary/10 text-primary border border-primary/20">
            LIVE • {user?.email || 'no session'}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Admin User</CardTitle></CardHeader>
            <CardContent className="text-sm font-mono break-all space-y-1">
              <div>Email: {user?.email || '—'}</div>
              <div>ID: {user?.id || '—'}</div>
              <div>is_admin: {String((user?.user_metadata as any)?.is_admin ?? false)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">System Stats</CardTitle></CardHeader>
            <CardContent className="text-sm font-mono whitespace-pre-wrap">
              {loading ? 'Loading…' : JSON.stringify(stats, null, 2)}
            </CardContent>
          </Card>
        </div>

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
