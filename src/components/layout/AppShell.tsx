import { useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ChangelogSidebar } from './ChangelogSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDatumStore } from '@/store/datum.store';

export function AppShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const { sidebarOpen, toggleSidebar, changelogOpen, toggleChangelog } = useDatumStore();
  const collapsed = useRef(false);

  // On small screens start with both panels collapsed so the content gets full width.
  useEffect(() => {
    if (isMobile && !collapsed.current) {
      collapsed.current = true;
      if (sidebarOpen) toggleSidebar();
      if (changelogOpen) toggleChangelog();
    }
    if (!isMobile) collapsed.current = false;
  }, [isMobile, sidebarOpen, changelogOpen, toggleSidebar, toggleChangelog]);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <div className="flex-1 flex overflow-hidden min-w-0">
          <main className="flex-1 min-w-0 overflow-y-auto bg-muted/30">{children}</main>
          <ChangelogSidebar />
        </div>
      </div>
    </div>
  );
}
