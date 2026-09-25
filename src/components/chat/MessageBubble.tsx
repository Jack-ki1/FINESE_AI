import type { ChatMessage } from '@/types';
import ReactMarkdown from 'react-markdown';
import { ArtifactRenderer } from '@/components/artifacts/ArtifactRenderer';
import { User, Copy, Check, RefreshCw, Pin, PinOff } from 'lucide-react';
import { useState } from 'react';
import { useDatumStore } from '@/store/datum.store';
import fineseLogo from '@/assets/finese-logo.jpg';

export function MessageBubble({ message, isPinned, onTogglePin }: {
  message: ChatMessage;
  isPinned?: boolean;
  onTogglePin?: () => void;
}) {
  const isUser = message.role === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<'up' | 'down' | null>(null);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const { regenerateLastMessage, isAiLoading, sendMessage } = useDatumStore();

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const handleEdit = () => {
    if (!editing) { setEditText(message.content); setEditing(true); }
    else {
      setEditing(false);
      if (editText.trim() && editText !== message.content) {
        // Branch: send edited message as new
        sendMessage(editText);
      }
    }
  };

  return (
    <div className={`group flex gap-3 px-4 sm:px-6 py-5 ${isPinned ? 'bg-orange-500/[0.06] border-l-2 border-orange-400' : ''} ${isUser ? 'bg-gradient-to-r from-orange-500/[0.04] to-amber-500/[0.04] border-l-2 border-orange-200/50' : 'bg-transparent'}`}>
      {/* Avatar — orange glow */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${isUser ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-orange-500/20' : 'bg-white dark:bg-zinc-800 border-2 border-orange-200 dark:border-orange-900/50 shadow-orange-500/10'}`}>
        {isUser ? <span className="text-[11px] font-bold">U</span> : <img src={fineseLogo} alt="F" className="w-7 h-7 rounded-full object-cover" />}
      </div>

      {/* Content — ChatGPT style, centered, max width */}
      <div className="flex-1 min-w-0 max-w-[680px]">
        {isUser ? (
          editing ? (
            <div className="space-y-2">
              <textarea value={editText} onChange={e=>setEditText(e.target.value)} className="w-full min-h-[60px] p-3 rounded-xl border bg-white dark:bg-[#2f2f2f] text-sm focus:outline-none focus:ring-1 focus:ring-black/10 dark:focus:ring-white/10" autoFocus />
              <div className="flex gap-2">
                <button onClick={handleEdit} className="px-3 py-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-medium">Send</button>
                <button onClick={()=>setEditing(false)} className="px-3 py-1.5 rounded-full border text-xs">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-2">
              <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 text-[15px] leading-relaxed max-w-[85%] ml-auto">
                {message.content}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white" title="Copy">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button onClick={handleEdit} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-black/40 dark:text-white/40" title="Edit">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="space-y-3">
            <div className="text-[15px] leading-relaxed text-black dark:text-white prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  code: ({ children }) => <code className="font-mono text-[13px] bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">{children}</code>,
                  pre: ({ children }) => <pre className="bg-code-bg text-white p-3 rounded-xl overflow-auto text-xs my-3">{children}</pre>,
                  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  h3: ({ children }) => <h3 className="font-semibold text-base mt-4 mb-2">{children}</h3>,
                  h4: ({ children }) => <h4 className="font-medium mt-3 mb-1">{children}</h4>,
                  blockquote: ({ children }) => <blockquote className="border-l-2 border-black/10 dark:border-white/20 pl-3 italic my-3 opacity-80">{children}</blockquote>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            {message.artifacts?.map((art, i) => (
              <ArtifactRenderer key={i} artifact={art} />
            ))}
            <div className="flex items-center gap-1 pt-1">
              <span className="text-[11px] text-black/30 dark:text-white/30">{time}</span>
              <div className="flex items-center gap-0.5 ml-2">
                <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white" title="Copy">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button onClick={()=>setLiked(liked==='up'?null:'up')} className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 ${liked==='up'?'text-black dark:text-white bg-black/5 dark:bg-white/10':'text-black/40 dark:text-white/40'}`} title="Good response">
                  <svg className="w-3.5 h-3.5" fill={liked==='up'?'currentColor':'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 10h4v4a2 2 0 01-2 2h-2v-4zM10 14H6v-4a2 2 0 012-2h2v6z"/></svg>
                </button>
                <button onClick={()=>setLiked(liked==='down'?null:'down')} className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 ${liked==='down'?'text-black dark:text-white bg-black/5 dark:bg-white/10':'text-black/40 dark:text-white/40'}`} title="Bad response">
                  <svg className="w-3.5 h-3.5" fill={liked==='down'?'currentColor':'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 10H6v4a2 2 0 012 2h2v-6zM14 14h4v-4a2 2 0 01-2-2h-2v6z" transform="rotate(180 12 12)"/></svg>
                </button>
                <button onClick={() => !isAiLoading && regenerateLastMessage()} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-black/40 dark:text-white/40" title="Regenerate">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button onClick={()=>navigator.clipboard.writeText(window.location.href)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-black/40 dark:text-white/40" title="Share">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684z"/></svg>
                </button>
                {onTogglePin && (
                  <button onClick={onTogglePin} className={`p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 ${isPinned ? 'text-black dark:text-white' : 'text-black/40 dark:text-white/40'}`} title={isPinned ? 'Unpin' : 'Pin'}>
                    {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
