import { supabase } from '@/integrations/supabase/client';
import { isLocalMode } from '@/lib/localMode';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/FINESE-chat`;

interface StreamChatParams {
  messages: { role: string; content: string }[];
  datasetContext: any;
  fileHash?: string;
  signal?: AbortSignal;
  onConnect?: () => void;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string, status?: number) => void;
  onEvidence?: (calls: { tool: string; args: any; result?: any }[]) => void;
  onMeta?: (meta: { provider?: string; model?: string; failoverFrom?: string }) => void;
}

function isOfflinePreviewMode(): boolean {
  // Explicit opt-in for local preview when backend unreachable — distinct from normal verified path.
  // Enabled by default in dev if VITE_OFFLINE_PREVIEW !== 'false', but never silently masquerades as Verified.
  return (import.meta as any).env?.VITE_OFFLINE_PREVIEW !== 'false';
}

export async function streamChat({ messages, datasetContext, fileHash, signal, onConnect, onDelta, onDone, onError, onMeta }: StreamChatParams) {
  const localMode = isLocalMode();
  let token: string | null = null;
  if (!localMode) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token || null;
    } catch {}
  }
  if (!token && !localMode) {
    onError('You are signed out. Please sign in again.');
    return;
  }
  if (localMode && !datasetContext) {
    onError('Local mode: load a dataset first (Data → Upload), or point Settings → AI at Ollama for free chat.');
    return;
  }

  let aiConfig: any = null;
  try {
    const raw = localStorage.getItem('finese-settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.state?.ai) aiConfig = parsed.state.ai;
    }
  } catch {}
  // §3.2 round-robin: rotate the chain start index per message so multi-key
  // users spread load across providers instead of always starting on Groq.
  try {
    const offset = Number(localStorage.getItem('finese-chain-offset') || '0') || 0;
    aiConfig = { ...(aiConfig || {}), chainOffset: offset };
    localStorage.setItem('finese-chain-offset', String(offset + 1));
  } catch {}

  let resp: Response | null = null;
  let fetchError: string | null = null;
  if (localMode) {
    // No backend exists — go straight to the local computation path below.
    fetchError = 'local mode — no backend';
  } else {
    try {
      resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      signal,
      body: JSON.stringify({
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        dataset_context: datasetContext,
        file_hash: fileHash,
        ai_config: aiConfig,
      }),
    });
    } catch (e:any) {
      fetchError = e?.message || 'Network error';
      resp = null;
    }
  }

  if (!resp || !resp.ok) {
    // If backend unreachable or error, enter explicit Offline Preview mode — never silently fake a Verified badge.
    if (isOfflinePreviewMode() && datasetContext) {
      onConnect?.();
      const p = datasetContext.profile || [];
      const numeric = p.filter((x:any)=>x.type==='numeric');
      const health = datasetContext.healthScore ?? 100;
      const errDetail = fetchError || (resp ? `status ${resp.status}: ${await resp.text().catch(()=> '')}` : 'no response');
      const offlineBanner = `> **⚠️ Offline preview — local compute (not server-verified)**\n> AI gateway unreachable (${errDetail}). Numbers below are computed locally in your browser and are *not* marked Verified. Reconnect for server-verified results.\n\n`;
      const insights = [
        `**${datasetContext.fileName}** — ${datasetContext.rowCount}×${datasetContext.colCount}, health ${health}%`,
        ...numeric.slice(0,2).map((c:any)=>`${c.col}: mean ${c.mean?.toFixed(1)}`),
      ];
      const msg = offlineBanner + insights.map(s=>`- ${s}`).join('\n') + `\n\n<artifact>{"type":"insights","title":"Offline Preview — Local Stats","insights":${JSON.stringify(insights)},"verified":false}</artifact>`;
      for (const chunk of msg.split(/(\s+)/)) { if(chunk) onDelta(chunk); await new Promise(r=>setTimeout(r,4)); }
      onDone(); return;
    }
    if (!resp) {
      onError(fetchError || 'Network error', 0);
      return;
    }
    let errMsg = 'AI service error';
    try { const err = await resp.json(); errMsg = err.error || errMsg; } catch {}
    onError(errMsg, resp.status);
    return;
  }

  onConnect?.();

  if (!resp.ok) {
    let errMsg = 'AI service error';
    try { const err = await resp.json(); errMsg = err.error || errMsg; } catch {}
    onError(errMsg, resp.status);
    return;
  }

  if (!resp.body) {
    onError('No response stream');
    return;
  }

  // §3.1: which free provider actually answered (failover chain headers).
  try {
    onMeta?.({
      provider: resp.headers.get('X-Free-Provider') || undefined,
      model: resp.headers.get('X-Free-Model') || undefined,
      failoverFrom: resp.headers.get('X-Failover-From') || undefined,
    });
  } catch {}

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') {
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        buffer = line + '\n' + buffer;
        break;
      }
    }
  }

  if (buffer.trim()) {
    for (let raw of buffer.split('\n')) {
      if (!raw) continue;
      if (raw.endsWith('\r')) raw = raw.slice(0, -1);
      if (raw.startsWith(':') || raw.trim() === '') continue;
      if (!raw.startsWith('data: ')) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {}
    }
  }

  onDone();
}
