import { useEffect, useRef, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ChangelogSidebar } from './ChangelogSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDatumStore } from '@/store/datum.store';
import { CommandPalette } from './CommandPalette';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [cmdOpen, setCmdOpen] = useState(false);
  useEffect(()=>{ const h=(e:KeyboardEvent)=>{ if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); setCmdOpen(v=>!v); } }; window.addEventListener('keydown',h); return ()=>window.removeEventListener('keydown',h); },[]);
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
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      <CommandPalette open={cmdOpen} onClose={()=>setCmdOpen(false)} />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <Topbar />
        <div className="flex-1 flex overflow-hidden min-w-0">
          <main className="flex-1 min-w-0 overflow-y-auto bg-background flex flex-col items-center">
            <div className="w-full max-w-[800px] flex-1 flex flex-col min-h-0">
              {children}
            </div>
          </main>
          <ChangelogSidebar />
        </div>
      </div>
    </div>
  );
}
