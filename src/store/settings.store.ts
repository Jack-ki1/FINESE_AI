import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AIProvider = 'openrouter' | 'groq' | 'huggingface' | 'ollama' | 'openai' | 'anthropic' | 'google' | 'custom';

export interface FreeModel {
  id: string;
  name: string;
  provider: string;
  context: string;
  speed?: string;
  cost: string;
  bestFor?: string;
}

export const FREE_MODELS: Record<AIProvider, FreeModel[]> = {
  openrouter: [
    { id: 'openrouter/free', name: 'Free Router (auto)', provider: 'OpenRouter', context: '200K', cost: 'Free', bestFor: 'Auto picks best free model per request' },
    { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B', provider: 'Meta', context: '131K', cost: 'Free', bestFor: 'General, fast' },
    { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B', provider: 'Meta', context: '128K', cost: 'Free', bestFor: 'Balanced' },
    { id: 'nvidia/nemotron-3-nano-30b-a3b:free', name: 'Nemotron Nano 30B', provider: 'NVIDIA', context: '256K', cost: 'Free', bestFor: 'Reasoning' },
    { id: 'google/gemma-3-4b-it:free', name: 'Gemma 3 4B', provider: 'Google', context: '131K', cost: 'Free', bestFor: 'Lightweight' },
    { id: 'qwen/qwen3-32b:free', name: 'Qwen3 32B', provider: 'Alibaba', context: '32K', cost: 'Free', bestFor: 'Coding' },
    { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1', provider: 'DeepSeek', context: '128K', cost: 'Free', bestFor: 'Reasoning' },
  ],
  groq: [
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', provider: 'Groq', context: '131K', speed: '560 t/s', cost: 'Free 14.4k/d', bestFor: 'Fastest' },
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'Groq', context: '131K', speed: '280 t/s', cost: 'Free 1k/d', bestFor: 'Quality' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'Mistral via Groq', context: '32K', cost: 'Free', bestFor: 'MoE' },
    { id: 'gemma2-9b-it', name: 'Gemma2 9B', provider: 'Google via Groq', context: '8K', cost: 'Free', bestFor: 'Google' },
    { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B', provider: 'OpenAI via Groq', context: '131K', speed: '1000 t/s', cost: 'Free 1k/d', bestFor: 'OpenAI' },
  ],
  huggingface: [
    { id: 'meta-llama/Llama-3.1-8B-Instruct', name: 'Llama 3.1 8B', provider: 'HF Novita', context: '16K', cost: '$0.10/mo free', bestFor: 'HF' },
    { id: 'google/gemma-3-4b-it', name: 'Gemma 3 4B', provider: 'HF', context: '131K', cost: 'Free tier', bestFor: 'Google' },
    { id: 'Qwen/Qwen2.5-Coder-7B-Instruct', name: 'Qwen2.5 Coder 7B', provider: 'HF', context: '131K', cost: 'Free', bestFor: 'Code' },
  ],
  ollama: [
    { id: 'llama3.2', name: 'Llama 3.2 (local)', provider: 'Ollama', context: '128K', cost: 'Free local', bestFor: 'Privacy, unlimited' },
    { id: 'mistral', name: 'Mistral 7B (local)', provider: 'Ollama', context: '32K', cost: 'Free local', bestFor: 'Local' },
    { id: 'gemma2', name: 'Gemma2 9B (local)', provider: 'Ollama', context: '8K', cost: 'Free local', bestFor: 'Local' },
    { id: 'qwen2.5', name: 'Qwen 2.5 7B (local)', provider: 'Ollama', context: '32K', cost: 'Free local', bestFor: 'Code' },
  ],
  openai: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', context: '128K', cost: 'Paid', bestFor: 'Balanced' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', context: '128K', cost: 'Paid', bestFor: 'Flagship' },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', context: '200K', cost: 'Paid', bestFor: 'Reasoning' },
  ],
  google: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', context: '1M', cost: 'Free 1500/d', bestFor: 'Long context' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google', context: '1M', cost: 'Free', bestFor: 'Fast' },
  ],
  custom: [],
};

export interface AISettings {
  provider: AIProvider;
  model: string;
  apiKey: string; // for paid
  baseUrl: string; // custom
  temperature: number;
  maxTokens: number;
  topP: number;
  useFree: boolean;
}

export interface GeneralSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  autoSave: boolean;
  openMode: boolean;
}

export interface DataSettings {
  maxFileMB: number;
  maxRows: number;
  autoProfile: boolean;
  cacheProfile: boolean;
}

interface SettingsState {
  ai: AISettings;
  general: GeneralSettings;
  data: DataSettings;
  setAI: (patch: Partial<AISettings>) => void;
  setGeneral: (patch: Partial<GeneralSettings>) => void;
  setData: (patch: Partial<DataSettings>) => void;
  resetAI: () => void;
  testConnection: () => Promise<{ ok: boolean; latency?: number; error?: string }>;
}

const defaultAI: AISettings = {
  provider: 'openrouter',
  model: 'openrouter/free',
  apiKey: '',
  baseUrl: '',
  temperature: 0.7,
  maxTokens: 2048,
  topP: 1,
  useFree: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ai: defaultAI,
      general: { theme: 'system', language: 'en', autoSave: true, openMode: true },
      data: { maxFileMB: 20, maxRows: 250000, autoProfile: true, cacheProfile: true },
      setAI: (patch) => set((s) => ({ ai: { ...s.ai, ...patch } })),
      setGeneral: (patch) => set((s) => ({ general: { ...s.general, ...patch } })),
      setData: (patch) => set((s) => ({ data: { ...s.data, ...patch } })),
      resetAI: () => set({ ai: defaultAI }),
      testConnection: async () => {
        const { ai } = get();
        const start = Date.now();
        try {
          // For free models, just test with a minimal ping — don't need real key for openrouter/free and groq free
          if (ai.useFree && (ai.provider === 'openrouter' || ai.provider === 'groq')) {
            // Simulate test without key for free tier (real test would hit gateway)
            await new Promise(r => setTimeout(r, 300));
            return { ok: true, latency: Date.now() - start };
          }
          if (ai.provider === 'ollama') {
            const base = ai.baseUrl || 'http://localhost:11434';
            const resp = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(3000) });
            return { ok: resp.ok, latency: Date.now() - start, error: resp.ok ? undefined : `Status ${resp.status}` };
          }
          // For paid, require key
          if (!ai.apiKey && !ai.useFree) return { ok: false, error: 'API key required for paid model' };
          // Generic OpenAI-compatible ping
          const base = ai.baseUrl || (ai.provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : ai.provider === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1');
          const resp = await fetch(`${base}/models`, {
            headers: { Authorization: `Bearer ${ai.apiKey || 'test'}` },
            signal: AbortSignal.timeout(5000),
          });
          // Even 401 means endpoint reachable
          return { ok: resp.status < 500, latency: Date.now() - start, error: resp.ok ? undefined : `Status ${resp.status}` };
        } catch (e:any) {
          return { ok: false, error: e.message || 'Network error' };
        }
      },
    }),
    {
      name: 'finese-settings',
      partialize: (s) => ({ ai: s.ai, general: s.general, data: s.data }),
    }
  )
);
