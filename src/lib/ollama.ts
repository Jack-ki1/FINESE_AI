// Ollama local detection (§3.5) — the truly-zero-cost path: no account, no
// key, data never leaves the machine.

export interface OllamaStatus {
  running: boolean;
  models: string[];
  error?: string;
}

export async function checkOllama(baseUrl = 'http://localhost:11434'): Promise<OllamaStatus> {
  try {
    const resp = await fetch(`${baseUrl.replace(/\/$/, '')}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!resp.ok) return { running: false, models: [], error: `Status ${resp.status}` };
    const json = await resp.json().catch(() => ({}));
    const models = Array.isArray(json.models) ? json.models.map((m: any) => m.name).filter(Boolean) : [];
    return { running: true, models };
  } catch (e: any) {
    return { running: false, models: [], error: e?.message || 'Not reachable' };
  }
}

export const OLLAMA_INSTALL: { os: string; command: string }[] = [
  { os: 'macOS', command: 'brew install ollama && ollama run llama3.2' },
  { os: 'Linux', command: 'curl -fsSL https://ollama.com/install.sh | sh && ollama run llama3.2' },
  { os: 'Windows', command: 'Download OllamaSetup.exe from ollama.com, then: ollama run llama3.2' },
];
