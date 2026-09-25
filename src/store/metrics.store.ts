import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MetricDefinition } from '@shared/semantic/metric';

interface MetricsState {
  metrics: MetricDefinition[];
  add: (m: MetricDefinition) => string | null;
  update: (name: string, expr: string, desc?: string) => string | null;
  remove: (name: string) => void;
  find: (name: string) => MetricDefinition | undefined;
}

function validate(name: string, expr: string): string | null {
  if (!/^[a-zA-Z][a-zA-Z0-9_]{1,63}$/.test(name)) return 'name 2-64 chars, letters/_';
  if (!expr || expr.length > 500) return 'expression required, max 500';
  if (!/^[a-zA-Z0-9_\s+\-*/()%\.]+$/.test(expr)) return 'only arithmetic + column names';
  return null;
}

export const useMetricsStore = create<MetricsState>()(
  persist(
    (set, get) => ({
      metrics: [],
      add: (m) => {
        const err = validate(m.name, m.expression);
        if (err) return err;
        if (get().metrics.some((x) => x.name === m.name)) return 'name already exists';
        set((s) => ({ metrics: [...s.metrics, { ...m, created_at: new Date().toISOString() }] }));
        return null;
      },
      update: (name, expr, desc) => {
        const err = validate(name, expr);
        if (err) return err;
        set((s) => ({ metrics: s.metrics.map((x) => x.name === name ? { ...x, expression: expr, description: desc } : x) }));
        return null;
      },
      remove: (name) => set((s) => ({ metrics: s.metrics.filter((x) => x.name !== name) })),
      find: (name) => get().metrics.find((x) => x.name === name),
    }),
    { name: 'finese-metrics' }
  )
);
