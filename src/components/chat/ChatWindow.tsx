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
    <div className="flex flex-col h-full bg-white dark:bg-[#212121]">
      {/* Pinned filter — ChatGPT style, minimal */}
      {pinnedIds.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-black/5 dark:border-white/5 bg-white dark:bg-[#212121] sticky top-0 z-10">
          <button
            onClick={() => setShowPinned(!showPinned)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${showPinned ? 'bg-black text-white dark:bg-white dark:text-black border-transparent' : 'bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60 hover:bg-black/10'}`}
          >
            <Pin className="w-3 h-3" />
            {pinnedIds.size} pinned
          </button>
          {showPinned && (
            <button onClick={() => setShowPinned(false)} className="text-xs text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white">
              Show all
            </button>
          )}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto" role="log" aria-live="polite">
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
      <div className="max-w-[800px] mx-auto w-full">
        <InputBar />
        <p className="text-center text-[11px] text-black/30 dark:text-white/30 px-4 pb-3">
          FINESE AI can make mistakes. Check important info. <span className="underline">See Cookie Preferences</span>
        </p>
      </div>
    </div>
  );
}
