import { useState, useRef, useCallback, useMemo } from 'react';
import { useDatumStore } from '@/store/datum.store';
import { parseFile } from '@/lib/parsers';
import { Upload, ArrowUp, Search, Square, Database, X } from 'lucide-react';
import { toast } from 'sonner';
import { MAX_FILE_BYTES, MAX_FILE_MB } from '@/lib/constants';

function getSmartSuggestions(profile: any[] | null): { text: string; prompt: string }[] {
  if (!profile) return [];
  const suggestions: { text: string; prompt: string }[] = [];
  const dateCols = profile.filter(p => p.type === 'datetime');
  const numCols = profile.filter(p => p.type === 'numeric');
  const catCols = profile.filter(p => p.type === 'categorical');
  const nullCols = profile.filter(p => p.nullCount > 0);

  if (dateCols.length > 0) {
    suggestions.push({ text: `📈 Show trends over ${dateCols[0].col}`, prompt: `Show me the time series trends over ${dateCols[0].col}` });
  }
  if (catCols.length > 0 && numCols.length > 0) {
    suggestions.push({ text: `📊 Compare ${numCols[0].col} by ${catCols[0].col}`, prompt: `Compare ${numCols[0].col} across different ${catCols[0].col} categories` });
  }
  if (numCols.length >= 2) {
    suggestions.push({ text: `🔗 Correlation analysis`, prompt: `Run a correlation analysis on all numeric columns and identify the strongest relationships` });
  }
  if (nullCols.length > 0) {
    suggestions.push({ text: `🧹 Handle missing values`, prompt: `Analyze missing value patterns and suggest imputation strategies for ${nullCols.map(c => c.col).join(', ')}` });
  }
  if (catCols.length > 0 && catCols.some((c: any) => c.uniqueCount <= 10)) {
    const target = catCols.find((c: any) => c.uniqueCount <= 10);
    suggestions.push({ text: `🤖 Predict ${target?.col}`, prompt: `Build a classification model to predict ${target?.col} and evaluate its performance` });
  }
  if (numCols.length > 0) {
    suggestions.push({ text: `🔍 Find anomalies`, prompt: `Detect anomalies and outliers across all numeric columns using multiple methods` });
  }

  return suggestions.slice(0, 4);
}

export function InputBar({ onSend }: { onSend?: (text: string) => void }) {
  const {
    isAiLoading, isLoaded, fileName, profile, ingest, sendMessage, cancelStream, connectionStatus,
    extraDatasets, fileHash, switchActiveDataset, removeExtraDataset,
    setIngestProgress, ingestProgress, ingestStage,
  } = useDatumStore();
  const [text, setText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const smartSuggestions = useMemo(() => getSmartSuggestions(profile), [profile]);
  const showSuggestions = focused && !text.trim() && isLoaded && smartSuggestions.length > 0;

  const handleSend = useCallback(async () => {
    const msg = text.trim();
    if (!msg || isAiLoading) return;
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    onSend?.(msg);
    await sendMessage(msg);
  }, [text, isAiLoading, sendMessage, onSend]);

  const handleFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      toast.error(`"${file.name}" is too large`, { description: `Maximum file size is ${MAX_FILE_MB}MB.` });
      return;
    }
    try {
      setIngestProgress(0, 'parsing');
      const data = await parseFile(file, {
        onProgress: ({ pct }) => setIngestProgress(pct, 'parsing'),
      });
      setIngestProgress(100, 'profiling');
      await ingest(data, file.name);
      toast.success(`Loaded ${file.name}`, { description: `${data.length.toLocaleString()} rows ready for analysis.` });
    } catch (e) {
      setIngestProgress(0);
      toast.error('Could not read that file', { description: (e as Error).message });
    }
  }, [ingest, setIngestProgress]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const setPrompt = (p: string) => { setText(p); textareaRef.current?.focus(); };

  const handleSuggestionClick = async (prompt: string) => {
    setText('');
    onSend?.(prompt);
    await sendMessage(prompt);
  };

  return (
    <div className="w-full max-w-[760px] mx-auto px-4 pb-4 relative">
      {/* Smart suggestions — ChatGPT style pills */}
      {showSuggestions && (
        <div className="absolute bottom-full left-4 right-4 mb-3 flex flex-wrap gap-2 justify-center z-10">
          {smartSuggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSuggestionClick(s.prompt)}
              className="px-3 py-1.5 rounded-full text-xs bg-card border border-border hover:bg-muted shadow-sm"
            >
              {s.text}
            </button>
          ))}
        </div>
      )}

      <div
        className={`rounded-[26px] border-2 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-200 ${
          dragOver ? 'border-orange-400 shadow-lg shadow-orange-500/20 ring-2 ring-orange-500/20' : 'border-orange-200 dark:border-orange-900/50'
        } ${focused ? 'shadow-md shadow-orange-500/10 ring-2 ring-orange-400/30 border-orange-300' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {/* Multi-file bar — minimal */}
        {extraDatasets.length > 0 && (
          <div className="flex items-center gap-1.5 px-4 pt-3 overflow-x-auto">
            {extraDatasets.map(d => {
              const active = d.fileHash === fileHash;
              return (
                <span key={d.fileHash} className={`group inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-full text-xs border ${active ? 'bg-black text-white dark:bg-white dark:text-black border-transparent' : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/5'}`}>
                  <button onClick={() => !active && switchActiveDataset(d.fileHash)} className="font-medium truncate max-w-[120px]">{d.fileName}</button>
                  <button onClick={() => removeExtraDataset(d.fileHash)} className="opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
                </span>
              );
            })}
          </div>
        )}
        {ingestStage !== 'idle' && (
          <div className="px-4 pt-3">
            <div className="h-1 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-black dark:bg-white transition-all duration-150" style={{ width: `${ingestProgress}%` }} />
            </div>
            <p className="text-[11px] text-black/40 dark:text-white/40 mt-1">{ingestStage === 'parsing' ? 'Parsing…' : 'Analyzing…'} {ingestProgress}%</p>
          </div>
        )}

        {/* Input — ChatGPT style, large, centered */}
        <div className="flex items-end gap-2 px-3 py-3">
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => fileRef.current?.click()} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-orange-500/10 text-orange-600 dark:text-orange-400" title="Attach files">
              <Upload className="w-4 h-4" />
            </button>
            <button onClick={() => setPrompt('Search the web for...')} className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-300 text-xs font-medium hover:bg-orange-500/20">
              <Search className="w-3.5 h-3.5" /> Search
            </button>
          </div>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'; }}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            disabled={isAiLoading}
            placeholder={isLoaded ? `Ask about ${fileName}…` : 'Ask anything — or drop a file for analysis'}
            rows={1}
            className="flex-1 bg-transparent text-[15px] leading-relaxed placeholder:text-black/40 dark:placeholder:text-white/40 resize-none outline-none min-h-[24px] max-h-[140px] py-1.5"
          />
          <div className="flex items-center gap-1 shrink-0">
            <button className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center hover:bg-orange-500/10 text-orange-500/60 dark:text-orange-400/60" title="Voice" onClick={()=>toast('Voice input coming soon')}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
            </button>
            {isAiLoading ? (
              <button onClick={cancelStream} className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center hover:opacity-90 shadow-md" title="Stop">
                <Square className="w-3.5 h-3.5" fill="currentColor" />
              </button>
            ) : (
              <button onClick={handleSend} disabled={!text.trim()} className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center disabled:opacity-20 hover:opacity-90 transition-opacity shadow-md shadow-orange-500/20">
                <ArrowUp className="w-4 h-4" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {/* Quick actions — orange pills */}
        <div className="flex items-center gap-1.5 px-3 pb-3 overflow-x-auto scrollbar-hide">
          <span className="text-[11px] text-orange-700/50 dark:text-orange-300/50 hidden sm:inline">Quick:</span>
          <button onClick={() => setPrompt('Profile all columns in detail')} className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-300 text-xs hover:bg-orange-500/20 whitespace-nowrap">Profile</button>
          <button onClick={() => setPrompt('Show me a chart')} className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs hover:bg-amber-500/20 whitespace-nowrap">Chart</button>
          <button onClick={() => setPrompt('Find outliers')} className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-300 text-xs hover:bg-orange-500/20 whitespace-nowrap">Outliers</button>
          {isLoaded && (
            <>
              <button onClick={() => setPrompt('Suggest and build the best ML model')} className="px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-700 dark:text-orange-300 text-xs hover:from-orange-500/20 hover:to-amber-500/20 whitespace-nowrap">Model</button>
              <button onClick={() => setPrompt('Clean this dataset')} className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-300 text-xs hover:bg-orange-500/20 whitespace-nowrap">Clean</button>
            </>
          )}
        </div>
      </div>

      <input ref={fileRef} type="file" accept=".csv,.json,.xlsx,.xls,.tsv,.png,.jpg,.pdf" multiple className="hidden"
        onChange={(e) => { const files = e.target.files; if (files) Array.from(files).forEach(f => handleFile(f)); e.target.value = ''; }} />
    </div>
  );
}
