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
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;
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
    deleteSession: (id: string) => {
      set((s: any) => {
        const remaining = s.sessions.filter((x: Session) => x.id !== id);
        // ensure at least one session exists
        if (remaining.length === 0) {
          const nid = uid();
          return { sessions: [{ id: nid, title: 'New Session', createdAt: now(), messages: [] }], activeSessionId: nid, messages: [], fileName: '', fileHash: null, isLoaded: false, dataset: null, profile: null };
        }
        const isActive = s.activeSessionId === id;
        const nextActive = isActive ? remaining[remaining.length - 1].id : s.activeSessionId;
        const activeSess = remaining.find((x: Session) => x.id === nextActive);
        return {
          sessions: remaining,
          activeSessionId: nextActive,
          messages: activeSess ? activeSess.messages : [],
          fileName: activeSess?.fileName || '',
          fileHash: activeSess?.fileHash || null,
          isLoaded: !!activeSess?.fileHash,
        };
      });
    },
    renameSession: (id: string, title: string) => {
      const clean = title.trim().slice(0, 60) || 'Untitled';
      set((s: any) => ({
        sessions: s.sessions.map((x: Session) => x.id === id ? { ...x, title: clean } : x),
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
