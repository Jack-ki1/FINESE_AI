import type { StateCreator } from 'zustand';
import type { Session } from '@/types';
import { loadDatasetProfile, loadDatasetRows } from '@/lib/api/ingest-client';

function uid() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }

export interface SessionSlice {
  sessions: Session[];
  activeSessionId: string;
  newSession: () => void;
  setActiveSession: (id: string) => Promise<void>;
}

export const createSessionSlice: StateCreator<any, [], [], SessionSlice> = (set, get) => {
  const initialSessionId = uid();
  return {
    sessions: [{ id: initialSessionId, title: 'New Session', createdAt: now(), messages: [] }],
    activeSessionId: initialSessionId,
    newSession: () => {
      const id = uid();
      set((s: any) => ({
        dataset: null, profile: null, correlations: null, advanced: null,
        fileName: '', fileHash: null, isLoaded: false, messages: [],
        activeSessionId: id,
        sessions: [...s.sessions, { id, title: 'New Session', createdAt: now(), messages: [] }],
      }));
    },
    setActiveSession: async (id) => {
      const session = get().sessions.find((s: Session) => s.id === id);
      if (!session) return;
      set({ activeSessionId: id, messages: session.messages, fileName: session.fileName || '', fileHash: session.fileHash || null, isLoaded: !!session.fileHash, dataset: null, profile: null });
      if (session.fileHash) {
        try {
          const res = await loadDatasetProfile(session.fileHash);
          set({ profile: res.profile, correlations: res.correlations, advanced: res.advanced, healthScore: res.health_score });
          loadDatasetRows(session.fileHash).then((rows) => set({ dataset: rows })).catch(() => {});
        } catch (e) { console.warn('Session hydrate failed:', e); }
      }
    },
  };
};
