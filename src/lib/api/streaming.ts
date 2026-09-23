import { supabase } from '@/integrations/supabase/client';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/datum-chat`;

interface StreamChatParams {
  messages: { role: string; content: string }[];
  datasetContext: any;
  fileHash?: string;
  signal?: AbortSignal;
  onConnect?: () => void;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string, status?: number) => void;
}

export async function streamChat({ messages, datasetContext, fileHash, signal, onConnect, onDelta, onDone, onError }: StreamChatParams) {
  const isOpen = (import.meta as any).env?.VITE_OPEN_MODE === 'true';
  let token: string | null = null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token || null;
  } catch {}
  // Open-mode fallback: use mock token from localStorage
  if (!token && isOpen) {
    try {
      const raw = localStorage.getItem('finese_admin_mock_session');
      if (raw) token = JSON.parse(raw).access_token || 'open-mode-jwt';
      else token = 'open-mode-jwt';
    } catch { token = 'open-mode-jwt'; }
  }
  if (!token) {
    onError('You are signed out. Please sign in again.');
    return;
  }
  // Load AI settings from store (persisted in localStorage:finese-settings)
  let aiConfig: any = null;
  try {
    const raw = localStorage.getItem('finese-settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.state?.ai) aiConfig = parsed.state.ai;
    }
  } catch {}

  let resp: Response;
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
        ai_config: aiConfig, // forwarded to FINESE-chat gateway (free/paid, keys, model)
      }),
    });
  } catch (e:any) {
    if (isOpen) {
      // Accurate local fallback — uses real profile numbers, no AI needed
      onConnect?.();
      let fallback: string;
      if (!datasetContext || !datasetContext.profile) {
        // No dataset — helpful onboarding
        fallback = `**FINESE AI — Open Mode (no dataset yet)**\n\nI'm running locally without an AI gateway, but you can still work freely:\n\n- **Upload** a CSV/JSON (up to 20 MB, 250K rows) → instant profiling\n- **Data Viewer** → Table, Visuals, **Auto-EDA**, **Clean**, **SQL Lab**\n- **Try** uploading the 100×5 sample below — I'll profile it instantly\n\n*To enable full AI, set \`AI_GATEWAY_URL\` + \`AI_API_KEY\` in Settings → AI (free models available via OpenRouter/Groq).*` +
          `\n\n<artifact>{"type":"insights","title":"Getting Started","insights":["Upload a dataset to see profiling","Try Auto-EDA for instant overview","Use SQL Lab for queries"]}</artifact>` +
          `\n<artifact>{"type":"suggestions","items":[{"text":"Upload sample data","prompt":"Upload sample data"},{"text":"What can you do?","prompt":"What can you do without AI?"},{"text":"Go to Settings","prompt":"Open Settings"}]}</artifact>`;
      } else {
        // Accurate dataset-driven fallback
        const p = datasetContext.profile;
        const numeric = p.filter((x:any)=>x.type==='numeric');
        const categorical = p.filter((x:any)=>x.type==='categorical');
        const health = datasetContext.healthScore ?? 100;
        const lastMsg = messages[messages.length-1]?.content?.toLowerCase() || '';
        // Build insights with real numbers
        const insights = [
          `**${datasetContext.fileName}** — **${datasetContext.rowCount} rows × ${datasetContext.colCount} cols**, health **${health}%**`,
          `${numeric.length} numeric, ${categorical.length} categorical columns`,
          ...numeric.slice(0,3).map((c:any)=> `**${c.col}**: mean ${c.mean?.toFixed(2)} (min ${c.min}, max ${c.max}, std ${c.std?.toFixed(2)}) — ${c.outliers||0} outliers`),
          ...categorical.slice(0,2).map((c:any)=> `**${c.col}** top: ${c.top?.slice(0,3).map((t:any)=>`"${t.value}" ${t.pct}%`).join(', ')}`),
          ...(datasetContext.correlations?.length ? [`Strong correlations: ${datasetContext.correlations.slice(0,2).map((c:any)=>`${c.colA}↔${c.colB} r=${c.r}`).join(', ')}`] : [])
        ];
        // Decide artifact based on query
        const q = lastMsg;
        let extraArtifact = '';
        if (q.includes('profile') || q.includes('overview') || q.includes('summarize')) {
          extraArtifact = `\n<artifact>{"type":"profile","title":"Column Statistics"}</artifact>`;
        } else if (q.includes('chart') || q.includes('visual')) {
          const xCol = categorical[0]?.col || p[0]?.col;
          const yCol = numeric[0]?.col || p[1]?.col || xCol;
          extraArtifact = `\n<artifact>{"type":"chart","ctype":"bar","xCol":"${xCol}","yCol":"${yCol}","aggFn":"mean","title":"${xCol} by ${yCol}"}</artifact>`;
        } else if (q.includes('outlier')) {
          const col = numeric[0]?.col || 'value';
          extraArtifact = `\n<artifact>{"type":"anomaly_report","title":"Outliers in ${col}","anomalies":[{"column":"${col}","method":"IQR","severity":"MEDIUM","explanation":"Local IQR check — see Data Viewer → Auto-EDA for details"}]}</artifact>`;
        } else if (q.includes('clean')) {
          extraArtifact = `\n<artifact>{"type":"insights","title":"Cleaning Plan","insights":["Remove ${p.filter((x:any)=>x.nullCount>0).length} cols with missing","Dedup via Data Viewer → Clean","Trim strings"]}</artifact>`;
        }
        const healthNote = health < 70 ? `⚠️ Health ${health}% — check missing/outliers in Auto-EDA.` : health < 90 ? `Health ${health}% — good, minor issues.` : `Health ${health}% — excellent.`;
        fallback = `**Analyzed ${datasetContext.fileName} — accurate local stats (no AI gateway)**\n\n${healthNote}\n\n` +
          insights.map(s=>`- ${s}`).join('\n') +
          `\n\n*All numbers are computed locally from your ${datasetContext.rowCount} rows via shared stats — not fabricated. Open **Data Viewer → Auto-EDA** for interactive charts or ask follow-ups like "show distribution of ${numeric[0]?.col || 'salary'}"*` +
          `\n\n<artifact>{"type":"insights","title":"Accurate Profile — ${datasetContext.fileName}","insights":${JSON.stringify(insights.slice(0,6))}}</artifact>` +
          `\n<artifact>{"type":"stats","title":"Health","stats":[{"label":"Health","value":"${health}%","color":"${health>=90?'green':health>=70?'amber':'red'}"},{"label":"Rows","value":"${datasetContext.rowCount}"},{"label":"Cols","value":"${datasetContext.colCount}"},{"label":"Numeric","value":"${numeric.length}"}]}</artifact>` +
          extraArtifact +
          `\n<artifact>{"type":"suggestions","items":[{"text":"Show chart","prompt":"Show a chart of ${categorical[0]?.col || 'category'} by ${numeric[0]?.col || 'value'}"},{"text":"Find outliers","prompt":"Find outliers in ${numeric[0]?.col || 'value'}"},{"text":"Clean data","prompt":"Clean this dataset"}]}</artifact>`;
      }
      for (const chunk of fallback.split(/(\s+)/)) {
        if (signal?.aborted) break;
        if (chunk) onDelta(chunk);
        await new Promise(r=>setTimeout(r, 5));
      }
      onDone();
      return;
    }
    onError(e?.message || 'Network error', 0);
    return;
  }
  onConnect?.();

  if (!resp.ok) {
    if (isOpen) {
      // In open mode, don't show error — show accurate local stats instead (AI key not needed)
      let errDetail = '';
      try { const err = await resp.json(); errDetail = err.error || ''; } catch {}
      // Generate accurate fallback even on 401/402/500
      const p = datasetContext?.profile || [];
      const numeric = p.filter((x:any)=>x.type==='numeric');
      const health = datasetContext?.healthScore ?? 100;
      const insights = datasetContext ? [
        `**${datasetContext.fileName}** — ${datasetContext.rowCount}×${datasetContext.colCount}, health ${health}%`,
        ...numeric.slice(0,2).map((c:any)=>`${c.col}: mean ${c.mean?.toFixed(1)}`),
      ] : ['No dataset'];
      const msg = `**Local analysis (AI unavailable — ${errDetail || `status ${resp.status}`})**\n\n` + insights.map(s=>`- ${s}`).join('\n') + `\n\n<artifact>{"type":"insights","title":"Local Fallback","insights":${JSON.stringify(insights)}}</artifact>\n<artifact>{"type":"suggestions","items":[{"text":"Try Auto-EDA","prompt":"Show Auto-EDA"},{"text":"Chat with data","prompt":"Profile this dataset"}]}</artifact>`;
      for (const chunk of msg.split(/(\s+)/)) { if(chunk) onDelta(chunk); await new Promise(r=>setTimeout(r,4)); }
      onDone(); return;
    }
    let errMsg = 'AI service error';
    try {
      const err = await resp.json();
      errMsg = err.error || errMsg;
    } catch {}
    onError(errMsg, resp.status);
    return;
  }

  if (!resp.body) {
    onError('No response stream');
    return;
  }

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

  // Flush remaining
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
