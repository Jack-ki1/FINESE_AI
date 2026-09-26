import { useSettingsStore } from '@/store/settings.store';

// Audience-tone toggle (§4.3): same verified number, different English.
// Analyst (default) vs board-ready executive vs plain language.
const TONES = [
  { id: 'analyst', label: 'Analyst' },
  { id: 'executive', label: 'Board' },
  { id: 'plain', label: 'Plain' },
] as const;

export function ToneToggle() {
  const tone = useSettingsStore((s) => s.ai.tone || 'analyst');
  const setAI = useSettingsStore((s) => s.setAI);
  return (
    <div className="hidden md:flex items-center rounded-lg border bg-card p-0.5" title="Answer framing — same verified number, different English">
      {TONES.map((t) => (
        <button
          key={t.id}
          onClick={() => setAI({ tone: t.id })}
          className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${tone === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
