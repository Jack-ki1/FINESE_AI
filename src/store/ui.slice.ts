import type { StateCreator } from 'zustand';
import type { ChangelogEntry } from '@/types';
function uid() { return crypto.randomUUID(); }
function now() { return new Date().toISOString(); }

export interface UiSlice {
  sidebarOpen: boolean;
  changelog: ChangelogEntry[];
  changelogOpen: boolean;
  toggleSidebar: () => void;
  toggleChangelog: () => void;
  addChangelogEntry: (action: ChangelogEntry['action'], description: string) => void;
  removeChangelogEntry: (id: string) => void;
}

export const createUiSlice: StateCreator<any, [], [], UiSlice> = (set) => ({
  sidebarOpen: true,
  changelog: [],
  changelogOpen: false,
  toggleSidebar: () => set((s: any) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleChangelog: () => set((s: any) => ({ changelogOpen: !s.changelogOpen })),
  addChangelogEntry: (action, description) => set((s: any) => ({ changelog: [...s.changelog, { id: uid(), action, description, timestamp: now() }] })),
  removeChangelogEntry: (id) => set((s: any) => ({ changelog: s.changelog.filter((e: ChangelogEntry) => e.id !== id) })),
});
