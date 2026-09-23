import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createDatasetSlice, type DatasetSlice } from './dataset.slice';
import { createChatSlice, type ChatSlice } from './chat.slice';
import { createSessionSlice, type SessionSlice } from './session.slice';
import { createUiSlice, type UiSlice } from './ui.slice';
import type { Session } from '@/types';

const MAX_PERSISTED_SESSIONS = 25;

export type DatumStore = DatasetSlice & ChatSlice & SessionSlice & UiSlice;

export const useDatumStore = create<DatumStore>()(
  persist(
    (set, get, api) => ({
      ...createDatasetSlice(set as any, get as any, api as any),
      ...createChatSlice(set as any, get as any, api as any),
      ...createSessionSlice(set as any, get as any, api as any),
      ...createUiSlice(set as any, get as any, api as any),
    }),
    {
      name: 'finese-ai-store',
      storage: createJSONStorage(() => ({
        getItem: (name) => { try { return localStorage.getItem(name); } catch { return null; } },
        setItem: (name, value) => {
          try { localStorage.setItem(name, value); } catch (e: any) {
            const isQuota = e?.name === 'QuotaExceededError' || e?.code === 22 || e?.message?.includes('quota');
            if (isQuota) {
              console.warn('[persist] localStorage quota exceeded, trimming sessions');
              try {
                const parsed = JSON.parse(value);
                const state = parsed?.state;
                if (state?.sessions?.length) {
                  const trimmed = [...state.sessions].sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, Math.max(5, Math.floor(MAX_PERSISTED_SESSIONS / 2)));
                  trimmed.forEach((s: any) => {
                    if (s.messages) s.messages = s.messages.map((m: any) => ({ ...m, artifacts: (m.artifacts || []).map((a: any) => {
                      if (a.data && Array.isArray(a.data) && a.data.length > 20) return { ...a, data: a.data.slice(0, 20), _truncated: true };
                      if (a.code && a.code.length > 5000) return { ...a, code: a.code.slice(0, 5000) + '\n// [truncated for storage]' };
                      return a;
                    }) }));
                  });
                  const retry = JSON.stringify({ ...parsed, state: { ...state, sessions: trimmed, changelog: (state.changelog || []).slice(-20) } });
                  try { localStorage.setItem(name, retry); return; } catch {}
                }
              } catch {}
              try { localStorage.removeItem(name); } catch {}
            } else console.warn('[persist] setItem failed:', e);
          }
        },
        removeItem: (name) => { try { localStorage.removeItem(name); } catch {} },
      })),
      partialize: (state) => {
        const sortedSessions = [...state.sessions].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, MAX_PERSISTED_SESSIONS).map((s) => ({
          ...s,
          messages: s.messages.map((m) => ({ ...m, artifacts: (m.artifacts || []).map((a) => {
            if ((a.type === 'table' || a.type === 'pivot') && Array.isArray((a as any).data) && (a as any).data.length > 30) return { ...a, data: (a as any).data.slice(0, 30) };
            return a;
          }) })),
        }));
        return { sessions: sortedSessions, activeSessionId: state.activeSessionId, sidebarOpen: state.sidebarOpen, changelog: state.changelog.slice(-50) };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          const active = (state as DatumStore).sessions.find((s: Session) => s.id === (state as DatumStore).activeSessionId);
          if (active?.fileHash) setTimeout(() => (useDatumStore.getState() as any).setActiveSession(active.id), 0);
        }
      },
    }
  )
);

export { MAX_PERSISTED_SESSIONS };
export type { ExtraDataset } from './dataset.slice';
