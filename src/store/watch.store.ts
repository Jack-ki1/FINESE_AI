import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Watch {
  id: string;
  fileHash: string;
  fileName: string;
  column: string;
  agg: 'mean' | 'sum';
  thresholdPct: number;
  lastValue: number | null;
  updatedAt: string;
}

interface WatchState {
  watches: Watch[];
  add: (w: Omit<Watch, 'id' | 'updatedAt'>) => void;
  remove: (id: string) => void;
  /** Recompute current values from rows; returns human-readable alerts for
   *  watches whose value moved ≥ threshold. Updates lastValue in place. */
  check: (fileHash: string, rows: Record<string, any>[]) => string[];
}

export function aggValue(rows: Record<string, any>[], column: string, agg: 'mean' | 'sum'): number | null {
  const nums = rows.map((r) => Number(r[column])).filter((v) => Number.isFinite(v));
  if (!nums.length) return null;
  const sum = nums.reduce((a, b) => a + b, 0);
  return agg === 'sum' ? sum : sum / nums.length;
}

export const useWatchStore = create<WatchState>()(
  persist(
    (set, get) => ({
      watches: [],
      add: (w) =>
        set((s) => ({
          watches: [...s.watches, { ...w, id: crypto.randomUUID(), updatedAt: new Date().toISOString() }],
        })),
      remove: (id) => set((s) => ({ watches: s.watches.filter((w) => w.id !== id) })),
      check: (fileHash, rows) => {
        const alerts: string[] = [];
        const next = get().watches.map((w) => {
          if (w.fileHash !== fileHash) return w;
          const cur = aggValue(rows, w.column, w.agg);
          if (cur === null || w.lastValue === null || w.lastValue === 0) {
            return { ...w, lastValue: cur, updatedAt: new Date().toISOString() };
          }
          const pct = Math.abs((cur - w.lastValue) / Math.abs(w.lastValue)) * 100;
          if (pct >= w.thresholdPct) {
            alerts.push(
              `“${w.column}” ${w.agg} moved ${pct.toFixed(1)}% (≥ ${w.thresholdPct}%): ${w.lastValue.toFixed(2)} → ${cur.toFixed(2)}`
            );
          }
          return { ...w, lastValue: cur, updatedAt: new Date().toISOString() };
        });
        set({ watches: next });
        return alerts;
      },
    }),
    { name: 'finese-watches' }
  )
);
