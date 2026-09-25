import type { StateCreator } from 'zustand';
import type { ChatMessage } from '@/types';
import { streamChat } from '@/lib/api/streaming';
import { parseArtifacts } from '@/lib/artifact-parser';

function uid() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }

export interface ChatSlice {
  connectionStatus: 'idle' | 'connecting' | 'streaming' | 'error';
  abortController: AbortController | null;
  isAiLoading: boolean;
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  cancelStream: () => void;
  regenerateLastMessage: () => void;
}

export const createChatSlice: StateCreator<any, [], [], ChatSlice> = (set, get) => ({
  connectionStatus: 'idle' as const,
  abortController: null,
  isAiLoading: false,
  messages: [],

  cancelStream: () => {
    const { abortController } = get();
    if (abortController) { abortController.abort(); set({ abortController: null, isAiLoading: false, connectionStatus: 'idle' }); }
  },

  sendMessage: async (content) => {
    const { profile, correlations, advanced, healthScore, fileName, fileHash, messages, activeSessionId } = get();
    const userMsg: ChatMessage = { id: uid(), role: 'user', content, timestamp: now() };
    const newMsgs = [...messages, userMsg];
    const ac = new AbortController();
    set({ messages: newMsgs, isAiLoading: true, abortController: ac, connectionStatus: 'connecting' });
    let metric_definitions: any[] = [];
    try {
      const raw = localStorage.getItem('finese-metrics');
      if (raw) { const parsed = JSON.parse(raw); metric_definitions = parsed.state?.metrics || parsed.metrics || []; }
    } catch {}
    const datasetContext = fileHash ? {
      fileName, rowCount: get().dataset?.length || (get().sessions.find((s: any) => s.id === activeSessionId)?.rowCount || 0),
      colCount: profile?.length || 0, healthScore, profile, correlations, advancedContext: advanced, sampleData: [], metric_definitions,
    } : null;
    const MAX_HISTORY = 30;
    const historySlice = newMsgs.length > MAX_HISTORY ? newMsgs.slice(-MAX_HISTORY) : newMsgs;
    const conversationHistory = historySlice.map((m: ChatMessage) => ({ role: m.role, content: m.role === 'assistant' ? (m.content || '') + (m.artifacts?.length ? ' [artifacts rendered inline]' : '') : m.content }));
    const assistantId = uid();
    let fullText = ''; let attempt = 0; const maxAttempts = 3;
    const tryStream = async (): Promise<void> => {
      attempt++;
      try {
        await streamChat({
          messages: conversationHistory, datasetContext, fileHash: fileHash || undefined, signal: ac.signal,
          onConnect: () => set({ connectionStatus: 'streaming' }),
          onDelta: (chunk) => {
            fullText += chunk;
            const streamingMsg: ChatMessage = { id: assistantId, role: 'assistant', content: fullText, timestamp: now() };
            const cur = get().messages;
            const last = cur[cur.length - 1];
            if (last?.id === assistantId) set({ messages: cur.map((m: ChatMessage) => m.id === assistantId ? streamingMsg : m) });
            else set({ messages: [...cur, streamingMsg] });
          },
          onDone: () => {
            const { cleanText, artifacts } = parseArtifacts(fullText);
            const { dataset } = get();
            const { profile } = get();
            const enriched = artifacts.map((art) => {
              if (art.type === 'chart' && dataset) return { ...art, data: dataset };
              if (art.type === 'profile' && profile) return { ...art, profile };
              return art;
            });
            const finalMsg: ChatMessage = { id: assistantId, role: 'assistant', content: cleanText, artifacts: enriched, timestamp: now() };
            const cur = get().messages;
            const finalMsgs = cur.map((m: ChatMessage) => m.id === assistantId ? finalMsg : m);
            const sessionsCur = get().sessions;
            set({ messages: finalMsgs, isAiLoading: false, abortController: null, connectionStatus: 'idle', sessions: sessionsCur.map((s: any) => s.id === activeSessionId ? { ...s, messages: finalMsgs, title: s.title === 'New Session' ? content.slice(0, 30) : s.title } : s) });
          },
          onError: (error, status) => { const err: any = new Error(error); err.status = status; throw err; },
        });
      } catch (err: any) {
        if (ac.signal.aborted) { set({ isAiLoading: false, abortController: null, connectionStatus: 'idle' }); return; }
        const terminal = [401, 402, 403].includes(err?.status);
        if (!terminal && attempt < maxAttempts) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise((r) => setTimeout(r, delay));
          fullText = ''; return tryStream();
        }
        const contentErr = err?.status === 402 ? `### ⚠️ AI credits exhausted\n\nThis workspace has run out of AI credits, so the assistant can't respond right now.\n\nAdd credits in **Settings → Plans & credits**, then retry your message.` : `⚠️ **Error after ${attempt} attempt${attempt > 1 ? 's' : ''}:** ${err?.message || 'Unknown'}`;
        const errMsg: ChatMessage = { id: assistantId, role: 'assistant', content: contentErr, timestamp: now() };
        const cur = get().messages;
        const last = cur[cur.length - 1];
        const finalMsgs = last?.id === assistantId ? cur.map((m: ChatMessage) => m.id === assistantId ? errMsg : m) : [...cur, errMsg];
        set({ messages: finalMsgs, isAiLoading: false, abortController: null, connectionStatus: 'error', sessions: get().sessions.map((s: any) => s.id === activeSessionId ? { ...s, messages: finalMsgs } : s) });
      }
    };
    await tryStream();
  },

  regenerateLastMessage: () => {
    const { messages } = get();
    const lastUserIdx = [...messages].reverse().findIndex((m: ChatMessage) => m.role === 'user');
    if (lastUserIdx === -1) return;
    const idx = messages.length - 1 - lastUserIdx;
    const lastUser = messages[idx];
    set({ messages: messages.slice(0, idx + 1) });
    get().sendMessage(lastUser.content);
  },
});
