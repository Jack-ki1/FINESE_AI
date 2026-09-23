import { useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ChangelogSidebar } from './ChangelogSidebar';
import { EvidenceRail } from './EvidenceRail';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDatumStore } from '@/store/datum.store';

export function AppShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const { sidebarOpen, toggleSidebar, changelogOpen, toggleChangelog } = useDatumStore();
  const collapsed = useRef(false);

  useEffect(() => {
    if (isMobile && !collapsed.current) {
      collapsed.current = true;
      if (sidebarOpen) toggleSidebar();
      if (changelogOpen) toggleChangelog();
    }
    if (!isMobile) collapsed.current = false;
  }, [isMobile, sidebarOpen, changelogOpen, toggleSidebar, toggleChangelog]);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-white dark:bg-[#212121]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#212121]">
        <Topbar />
        <div className="flex-1 flex overflow-hidden min-w-0">
          <main className="flex-1 min-w-0 overflow-y-auto bg-background flex flex-col items-center">
            <div className="w-full max-w-[800px] flex-1 flex flex-col min-h-0">
              {children}
            </div>
          </main>
          <div className="hidden xl:flex shrink-0">
            <EvidenceRail />
          </div>
          <ChangelogSidebar />
        </div>
      </div>
    </div>
  );
}
