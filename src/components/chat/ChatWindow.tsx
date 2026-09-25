import { useRef, useEffect, useState } from 'react';
import { useDatumStore } from '@/store/datum.store';
import { WelcomeScreen } from './WelcomeScreen';
import { MessageBubble } from './MessageBubble';
import { InputBar } from './InputBar';
import { TypingIndicator } from './TypingIndicator';
import { Pin } from 'lucide-react';

export function ChatWindow() {
  const { messages, isAiLoading, sendMessage } = useDatumStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [showPinned, setShowPinned] = useState(false);

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
    <div className="flex flex-col h-full bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-orange-950/20 dark:via-background dark:to-amber-950/10">
      {pinnedIds.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-orange-200/50 bg-orange-500/10 backdrop-blur">
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

      <div ref={scrollRef} className="flex-1 overflow-y-auto relative" role="log" aria-live="polite">
        <div className="pointer-events-none absolute -top-24 right-10 w-72 h-72 bg-gradient-to-br from-orange-400/10 to-amber-400/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 -left-20 w-96 h-96 bg-gradient-to-br from-orange-300/10 to-red-400/5 rounded-full blur-3xl" />
        {messages.length === 0 ? (
          <WelcomeScreen onPrompt={(text) => sendMessage(text)} />
        ) : (
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
      <div className="max-w-[800px] mx-auto w-full relative">
        <div className="absolute -inset-2 bg-gradient-to-r from-orange-400/10 via-amber-400/10 to-orange-400/10 rounded-[28px] blur-xl" />
        <div className="relative">
          <InputBar />
          <p className="text-center text-[11px] text-orange-700/60 dark:text-orange-300/60 px-4 pb-3">
            FINESE AI can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
}
