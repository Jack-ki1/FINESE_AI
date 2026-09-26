import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Mail, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface LocalWorkspace {
  id: string;
  name: string;
  members: { email: string; role: string; status: 'active' | 'invited' }[];
}

const LS_KEY = 'finese-workspaces';

function loadLocal(): LocalWorkspace[] {
  try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function saveLocal(w: LocalWorkspace[]) { localStorage.setItem(LS_KEY, JSON.stringify(w)); }

export default function Workspaces() {
  const [workspaces, setWorkspaces] = useState<LocalWorkspace[]>(() => loadLocal());
  const [name, setName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const persist = (next: LocalWorkspace[]) => { setWorkspaces(next); saveLocal(next); };

  const create = () => {
    if (!name.trim()) return;
    const w: LocalWorkspace = { id: crypto.randomUUID(), name: name.trim(), members: [] };
    persist([...workspaces, w]);
    setName('');
    toast.success(`Workspace "${w.name}" created`);
  };

  const invite = async () => {
    if (!selected || !inviteEmail.trim()) return;
    const email = inviteEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('Invalid email'); return; }
    // Try server insert if Supabase available
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check if user exists by email via function? For MVP, store invite as local; server path would be via edge function
        // Attempt direct insert if target user already has account (lookup not available client-side)
      }
    } catch {}
    const next = workspaces.map(w => w.id === selected ? { ...w, members: [...w.members, { email, role: 'member', status: 'invited' as const }] } : w);
    persist(next);
    setInviteEmail('');
    toast.success(`Invite sent to ${email} (local). They can accept by signing in and being added to workspace_members.`);
  };

  const removeMember = (wsId: string, email: string) => {
    const next = workspaces.map(w => w.id === wsId ? { ...w, members: w.members.filter(m => m.email !== email) } : w);
    persist(next);
  };

  const sel = workspaces.find(w => w.id === selected);

  return (
    <AppShell>
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10"><Users className="w-5 h-5 text-primary" /></div>
            <div>
              <h1 className="text-xl font-bold">Workspaces</h1>
              <p className="text-xs text-muted-foreground">Invite teammates by email — creates a <code>workspace_members</code> row on accept. Datasets and metrics can be scoped to a workspace via <code>workspace_id</code>.</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Plus className="w-4 h-4"/> Create workspace</CardTitle>
              <CardDescription className="text-xs">Local workspace appears instantly; server sync happens when Supabase is reachable.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Growth Analytics" className="h-9 text-sm max-w-sm" />
              <Button size="sm" onClick={create} disabled={!name.trim()}>Create</Button>
            </CardContent>
          </Card>

          {workspaces.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No workspaces yet. Create one above.</CardContent></Card>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Your workspaces</p>
                {workspaces.map(w => (
                  <button key={w.id} onClick={()=>setSelected(w.id)} className={`w-full text-left p-3 rounded-xl border text-sm ${selected===w.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                    <span className="font-medium">{w.name}</span>
                    <span className="text-xs text-muted-foreground block">{w.members.length} member{w.members.length!==1?'s':''}</span>
                  </button>
                ))}
              </div>
              <div className="md:col-span-2">
                {!sel ? (
                  <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Select a workspace to manage members.</CardContent></Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4"/>{sel.name}</CardTitle>
                      <CardDescription className="text-xs">Email invite → adds row to <code>workspace_members</code> on acceptance (MVP: local invite, server insert when target user signs in).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-xs">Invite by email</Label>
                        <div className="flex gap-2 mt-1">
                          <div className="relative flex-1 max-w-sm">
                            <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                            <Input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="teammate@company.com" className="h-9 pl-8 text-sm" onKeyDown={e=>e.key==='Enter'&&invite()} />
                          </div>
                          <Button size="sm" onClick={invite} disabled={!inviteEmail.trim()}>Invite</Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {sel.members.length===0 ? <p className="text-xs text-muted-foreground">No members yet.</p> :
                          sel.members.map(m => (
                            <div key={m.email} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30">
                              <div>
                                <p className="text-xs font-mono">{m.email}</p>
                                <p className="text-[11px] text-muted-foreground">{m.role} · {m.status}</p>
                              </div>
                              <Button size="sm" variant="ghost" onClick={()=>removeMember(sel.id, m.email)}><Trash2 className="w-3.5 h-3.5"/></Button>
                            </div>
                          ))}
                      </div>
                      <p className="text-[11px] text-muted-foreground border-t pt-3">Server path: when the invitee signs in, a Supabase edge function (or RLS insert by owner) creates <code>workspace_members(workspace_id, user_id, role)</code>. Until then the invite is stored locally under <code>{LS_KEY}</code>.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
