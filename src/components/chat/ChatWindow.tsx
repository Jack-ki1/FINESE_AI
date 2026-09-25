import { useRef, useEffect, useState } from 'react';
import { useDatumStore } from '@/store/datum.store';
import { WelcomeScreen } from './WelcomeScreen';
import { MessageBubble } from './MessageBubble';
import { InputBar } from './InputBar';
import { TypingIndicator } from './TypingIndicator';
import { Pin, BookOpen, Wand2 } from 'lucide-react';
import { WizardsPanel } from '@/components/wizards/Wizards';
import { ReportExport } from '@/components/report/ReportExport';
import { NarrativeMode } from '@/components/chat/NarrativeMode';

export function ChatWindow() {
  const { messages, isAiLoading, sendMessage } = useDatumStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [showPinned, setShowPinned] = useState(false);
  const [mode, setMode] = useState<'chat'|'wizards'|'narrative'|'report'>('chat');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAiLoading]);

  const togglePin = (id: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const pinnedMessages = messages.filter(m => pinnedIds.has(m.id));
  const displayMessages = showPinned && pinnedMessages.length > 0 ? pinnedMessages : messages;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-background sticky top-0 z-10">
        <div className="flex gap-1">
          <button onClick={()=>setMode("chat")} className={`px-2.5 py-1 rounded-full text-xs ${mode==="chat"?"bg-primary text-primary-foreground":"bg-muted"}`}>Chat</button>
          <button onClick={()=>setMode("wizards")} className={`px-2.5 py-1 rounded-full text-xs flex items-center gap-1 ${mode==="wizards"?"bg-primary text-primary-foreground":"bg-muted"}`}><Wand2 className="w-3 h-3"/>Wizards</button>
          <button onClick={()=>setMode("narrative")} className={`px-2.5 py-1 rounded-full text-xs flex items-center gap-1 ${mode==="narrative"?"bg-primary text-primary-foreground":"bg-muted"}`}><BookOpen className="w-3 h-3"/>Story</button>
          <button onClick={()=>setMode("report")} className={`px-2.5 py-1 rounded-full text-xs ${mode==="report"?"bg-primary text-primary-foreground":"bg-muted"}`}>Report</button>
        </div>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground">{messages.length} msgs</span>
      </div>
      {pinnedIds.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/20">
          <button
            onClick={() => setShowPinned(!showPinned)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${showPinned ? 'bg-primary text-primary-foreground border-transparent' : 'bg-muted text-muted-foreground'}`}
          >
            <Pin className="w-3 h-3" />
            {pinnedIds.size} pinned
          </button>
          {showPinned && (
            <button onClick={() => setShowPinned(false)} className="text-xs text-muted-foreground hover:text-foreground">
              Show all
            </button>
          )}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <div><WelcomeScreen onPrompt={(text) => sendMessage(text)} /><div className="max-w-[640px] mx-auto px-4 pb-6"><WizardsPanel /></div></div>
        ) : mode==="wizards" ? <div className="py-6 max-w-[800px] mx-auto w-full px-4"><WizardsPanel /></div> : mode==="narrative" ? <NarrativeMode/> : mode==="report" ? <div className="py-6 max-w-[800px] mx-auto w-full px-4"><ReportExport/></div> : (
          <div className="py-6">
            <div className="max-w-[800px] mx-auto w-full">
              {displayMessages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isPinned={pinnedIds.has(msg.id)}
                  onTogglePin={msg.role === 'assistant' ? () => togglePin(msg.id) : undefined}
                />
              ))}
              {isAiLoading && !showPinned && <TypingIndicator />}
            </div>
          </div>
        )}
      </div>
      {mode==="chat" && (
        <div className="max-w-[800px] mx-auto w-full">
          <InputBar />
          <p className="text-center text-[11px] text-muted-foreground px-4 pb-3">
            FINESE AI can make mistakes. Check important info.
          </p>
        </div>
      )}
    </div>
  );
}
