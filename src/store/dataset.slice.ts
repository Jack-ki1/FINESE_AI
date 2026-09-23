import type { StateCreator } from 'zustand';
import type { ColumnProfile } from '@/types';
import { ingestDataset, loadDatasetRows, loadDatasetProfile } from '@/lib/api/ingest-client';

export interface ExtraDataset {
  fileHash: string;
  fileName: string;
  rowCount: number;
  colCount: number;
}

export interface DatasetSlice {
  dataset: Record<string, any>[] | null;
  transformedDataset: Record<string, any>[] | null;
  activeView: 'original' | 'transformed';
  profile: ColumnProfile[] | null;
  correlations: any[] | null;
  advanced: any | null;
  healthScore: number;
  fileName: string;
  fileHash: string | null;
  isLoaded: boolean;
  isIngesting: boolean;
  ingestError: string | null;
  extraDatasets: ExtraDataset[];
  ingestProgress: number;
  ingestStage: 'idle' | 'parsing' | 'profiling';
  ingestAbort: AbortController | null;
  ingest: (data: Record<string, any>[], name: string) => Promise<void>;
  setIngestProgress: (pct: number, stage?: 'parsing' | 'profiling') => void;
  cancelIngest: () => void;
  switchActiveDataset: (fileHash: string) => Promise<void>;
  removeExtraDataset: (fileHash: string) => void;
  hydrateActiveDataset: () => Promise<void>;
  setActiveView: (view: 'original' | 'transformed') => void;
  setTransformedDataset: (data: Record<string, any>[]) => void;
}

function uid() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }

import type { ChatMessage, Session, ChangelogEntry } from '@/types';

function generateWelcome(rowCount: number, profile: ColumnProfile[], fileName: string, healthScore: number): ChatMessage {
  const numCols = profile.filter(p => p.type === 'numeric');
  const catCols = profile.filter(p => p.type === 'categorical');
  const nullCols = profile.filter(p => p.nullCount > 0);
  const outlierCols = numCols.filter(p => (p.outliers || 0) > 0);
  const insights = [
    `Dataset contains **${rowCount} rows** and **${profile.length} columns**`,
    `**${numCols.length}** numeric columns, **${catCols.length}** categorical columns`,
    nullCols.length > 0 ? `**${nullCols.length} columns** have missing values (${nullCols.map(c => c.col).join(', ')})` : `All columns are **complete** — no missing values detected`,
    `Data health score: **${healthScore}%** ${healthScore >= 90 ? '✓' : healthScore >= 70 ? '⚠' : '✗'}`,
    outlierCols.length > 0 ? `**${outlierCols.length} columns** contain statistical outliers` : `No statistical outliers detected in numeric columns`,
  ];
  return { id: uid(), role: 'assistant', content: `I've loaded and profiled **"${fileName}"** server-side. All future numbers will be computed against the real data via tool-calls. Here's what I found:`, artifacts: [{ type: 'insights', insights, title: 'Dataset Overview' }], timestamp: now() };
}

export const createDatasetSlice: StateCreator<any, [], [], DatasetSlice> = (set, get) => ({
  dataset: null, transformedDataset: null, activeView: 'original' as const,
  profile: null, correlations: null, advanced: null, healthScore: 0,
  fileName: '', fileHash: null, isLoaded: false,
  isIngesting: false, ingestError: null,
  extraDatasets: [],
  ingestProgress: 0, ingestStage: 'idle' as const, ingestAbort: null as AbortController | null,

  ingest: async (data, name) => {
    const ac = new AbortController();
    set({ isIngesting: true, ingestError: null, ingestStage: 'profiling', ingestProgress: 0, ingestAbort: ac });
    try {
      const res = await ingestDataset(data, name, {
        signal: ac.signal,
        onUploadProgress: (pct) => set({ ingestProgress: pct, ingestStage: 'profiling' }),
        onUploaded: () => set({ ingestProgress: 100, ingestStage: 'profiling' }),
      });
      const welcome = generateWelcome(res.row_count, res.profile, res.file_name, res.health_score);
      const { activeSessionId, sessions, extraDatasets } = get();
      const msgs = [welcome];
      const entry: ChangelogEntry = { id: uid(), action: 'upload', description: `Uploaded ${name} (${res.row_count} rows)${res.cached ? ' [cached profile]' : ''}`, timestamp: now() };
      const others = extraDatasets.filter((d: ExtraDataset) => d.fileHash !== res.file_hash);
      const nextExtras: ExtraDataset[] = [...others, { fileHash: res.file_hash, fileName: res.file_name, rowCount: res.row_count, colCount: res.col_count }];
      set({
        dataset: data, profile: res.profile, correlations: res.correlations, advanced: res.advanced, healthScore: res.health_score,
        fileName: res.file_name, fileHash: res.file_hash, isLoaded: true, isIngesting: false, ingestProgress: 100, ingestStage: 'idle', ingestAbort: null,
        extraDatasets: nextExtras, messages: msgs, changelog: [...get().changelog, entry],
        sessions: (sessions as Session[]).map((s) => s.id === activeSessionId ? { ...s, title: name.replace(/\.\w+$/, ''), fileName: name, fileHash: res.file_hash, rowCount: res.row_count, colCount: res.col_count, messages: msgs } : s),
      });
    } catch (e) {
      set({ isIngesting: false, ingestStage: 'idle', ingestProgress: 0, ingestAbort: null, ingestError: e instanceof Error ? e.message : 'Ingest failed' });
      throw e;
    }
  },

  setIngestProgress: (pct, stage) => set({ ingestProgress: pct, ...(stage ? { ingestStage: stage, isIngesting: true } : {}) }),
  cancelIngest: () => {
    const ac = (get() as any).ingestAbort as AbortController | null;
    if (ac) ac.abort();
    set({ isIngesting: false, ingestStage: 'idle', ingestProgress: 0, ingestAbort: null });
  },
  switchActiveDataset: async (fileHash) => {
    const extra = get().extraDatasets.find((d: ExtraDataset) => d.fileHash === fileHash);
    if (!extra) return;
    try {
      const res = await loadDatasetProfile(fileHash);
      set({ profile: res.profile, correlations: res.correlations, advanced: res.advanced, healthScore: res.health_score, fileName: res.file_name, fileHash: res.file_hash, isLoaded: true });
      loadDatasetRows(fileHash).then((rows) => set({ dataset: rows })).catch(() => {});
    } catch (e) {
      console.warn('switchActiveDataset failed:', e);
      try {
        const rows = await loadDatasetRows(fileHash);
        const res = await ingestDataset(rows, extra.fileName);
        set({ dataset: rows, profile: res.profile, correlations: res.correlations, advanced: res.advanced, healthScore: res.health_score, fileName: res.file_name, fileHash: res.file_hash, isLoaded: true });
      } catch (e2) { console.warn('switchActiveDataset fallback failed:', e2); }
    }
  },
  removeExtraDataset: (fileHash) => set((s: any) => ({ extraDatasets: s.extraDatasets.filter((d: ExtraDataset) => d.fileHash !== fileHash) })),
  hydrateActiveDataset: async () => {
    const { fileHash, dataset } = get();
    if (!fileHash || dataset) return;
    try { const rows = await loadDatasetRows(fileHash); set({ dataset: rows }); } catch (e) { console.warn('Hydrate failed:', e); }
  },
  setActiveView: (view) => set({ activeView: view }),
  setTransformedDataset: (data) => set({ transformedDataset: data }),
});
