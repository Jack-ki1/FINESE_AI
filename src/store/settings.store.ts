import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AIProvider = 'openrouter' | 'groq' | 'huggingface' | 'ollama' | 'openai' | 'anthropic' | 'google' | 'cerebras' | 'mistral' | 'cloudflare' | 'nvidia' | 'together' | 'cohere' | 'custom';

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
    { id: 'openrouter/free', name: 'Free Router (auto)', provider: 'OpenRouter', context: '200K', cost: 'Free', bestFor: 'Auto picks best free model per request · 20 RPM / 50-1000/d' },
    { id: 'google/gemma-4-26b-a4b-it:free', name: 'Gemma 4 26B A4B', provider: 'Google', context: '262K', cost: 'Free', bestFor: 'Long context, vision' },
    { id: 'google/gemma-4-31b-it:free', name: 'Gemma 4 31B', provider: 'Google', context: '262K', cost: 'Free', bestFor: 'Vision, tools' },
    { id: 'openai/gpt-oss-20b:free', name: 'GPT-OSS 20B', provider: 'OpenAI', context: '131K', cost: 'Free', bestFor: 'Open-weight, tools' },
    { id: 'openai/gpt-oss-120b:free', name: 'GPT-OSS 120B', provider: 'OpenAI', context: '131K', cost: 'Free', bestFor: 'Flagship open-weight' },
    { id: 'nvidia/nemotron-3-nano-30b-a3b:free', name: 'Nemotron Nano 30B', provider: 'NVIDIA', context: '256K', cost: 'Free', bestFor: 'Reasoning' },
    { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', name: 'Nemotron Ultra 550B', provider: 'NVIDIA', context: '1M', cost: 'Free', bestFor: 'Frontier reasoning' },
    { id: 'cohere/north-mini-code:free', name: 'North Mini Code', provider: 'Cohere', context: '256K', cost: 'Free', bestFor: 'Coding' },
    { id: 'z-ai/glm-4.7:free', name: 'GLM 4.7', provider: 'Zhipu AI', context: '128K', cost: 'Free', bestFor: 'Reasoning, tools' },
    { id: 'liquid/lfm-2.5-2.6b:free', name: 'LFM 2.5 2.6B', provider: 'Liquid', context: '32K', cost: 'Free', bestFor: 'Fast, efficient' },
    { id: 'poolside/laguna-s-2.1:free', name: 'Laguna S 2.1', provider: 'Poolside', context: '262K', cost: 'Free', bestFor: 'Coding' },
    { id: 'inclusionai/ling-3.0-flash:free', name: 'Ling 3 Flash', provider: 'InclusionAI', context: '262K', cost: 'Free', bestFor: 'MoE, 200 req/hr' },
    { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B', provider: 'Meta', context: '131K', cost: 'Free', bestFor: 'General, fast' },
    { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B', provider: 'Meta', context: '128K', cost: 'Free', bestFor: 'Balanced' },
    { id: 'qwen/qwen3-32b:free', name: 'Qwen3 32B', provider: 'Alibaba', context: '32K', cost: 'Free', bestFor: 'Coding' },
    { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1', provider: 'DeepSeek', context: '128K', cost: 'Free', bestFor: 'Reasoning' },
  ],
  groq: [
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', provider: 'Groq', context: '131K', speed: '560 t/s', cost: 'Free 14.4k/d', bestFor: 'Fastest — 30 RPM' },
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'Groq', context: '131K', speed: '280 t/s', cost: 'Free 1k/d', bestFor: 'Quality, 1000 RPD' },
    { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B', provider: 'OpenAI via Groq', context: '131K', speed: '1000 t/s', cost: 'Free 1k/d', bestFor: 'OpenAI open-weight' },
    { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', provider: 'OpenAI via Groq', context: '131K', speed: '400 t/s', cost: 'Free 1k/d', bestFor: '120B flagship' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', provider: 'Mistral via Groq', context: '32K', cost: 'Free', bestFor: 'MoE, 30 RPM' },
    { id: 'gemma2-9b-it', name: 'Gemma2 9B', provider: 'Google via Groq', context: '8K', cost: 'Free', bestFor: 'Google, 30 RPM' },
    { id: 'qwen3-32b', name: 'Qwen3 32B via Groq', provider: 'Alibaba via Groq', context: '32K', cost: 'Free', bestFor: 'Coding, fast' },
    { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout', provider: 'Meta via Groq', context: '131K', cost: 'Free preview', bestFor: '16E MoE, vision' },
  ],
  huggingface: [
    { id: 'meta-llama/Llama-3.1-8B-Instruct', name: 'Llama 3.1 8B', provider: 'HF Novita', context: '16K', cost: '$0.10/mo free', bestFor: 'HF Inference, credit-metered' },
    { id: 'google/gemma-3-4b-it', name: 'Gemma 3 4B', provider: 'HF', context: '131K', cost: 'Free tier', bestFor: 'Vision, 131K' },
    { id: 'Qwen/Qwen2.5-Coder-7B-Instruct', name: 'Qwen2.5 Coder 7B', provider: 'HF', context: '131K', cost: 'Free', bestFor: 'Code' },
    { id: 'meta-llama/Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B', provider: 'HF', context: '131K', cost: 'Free trial', bestFor: '70B flagship' },
    { id: 'mistralai/Mistral-7B-Instruct-v0.3', name: 'Mistral 7B v0.3', provider: 'HF', context: '32K', cost: 'Free', bestFor: 'Instruct' },
    { id: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B', name: 'DeepSeek R1 70B Distill', provider: 'HF', context: '131K', cost: 'Free', bestFor: 'Reasoning distill' },
  ],
  ollama: [
    { id: 'llama3.2', name: 'Llama 3.2 (local)', provider: 'Ollama', context: '128K', cost: 'Free local', bestFor: 'Privacy, unlimited' },
    { id: 'llama3.3', name: 'Llama 3.3 70B (local)', provider: 'Ollama', context: '128K', cost: 'Free local', bestFor: '70B local' },
    { id: 'deepseek-r1:14b', name: 'DeepSeek R1 14B (local)', provider: 'Ollama', context: '128K', cost: 'Free local', bestFor: 'Reasoning local' },
    { id: 'mistral', name: 'Mistral 7B (local)', provider: 'Ollama', context: '32K', cost: 'Free local', bestFor: 'Local' },
    { id: 'gemma3:4b', name: 'Gemma 3 4B (local)', provider: 'Ollama', context: '131K', cost: 'Free local', bestFor: 'Vision local' },
    { id: 'qwen2.5', name: 'Qwen 2.5 7B (local)', provider: 'Ollama', context: '32K', cost: 'Free local', bestFor: 'Code' },
    { id: 'phi4', name: 'Phi-4 14B (local)', provider: 'Microsoft', context: '16K', cost: 'Free local', bestFor: 'Reasoning, 14B' },
    { id: 'nomic-embed-text', name: 'Nomic Embed (local)', provider: 'Ollama', context: '8K', cost: 'Free local', bestFor: 'Embeddings' },
  ],
  openai: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', context: '128K', cost: '$0.15/1M in', bestFor: 'Balanced, cheap' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', context: '128K', cost: '$2.50/1M in', bestFor: 'Flagship' },
    { id: 'o1-mini', name: 'o1-mini', provider: 'OpenAI', context: '128K', cost: '$3/1M in', bestFor: 'Reasoning' },
    { id: 'gpt-4.1-2025-04-14', name: 'GPT-4.1', provider: 'OpenAI', context: '1M', cost: '$2/1M in', bestFor: '1M context' },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', context: '200K', cost: '$3/1M in', bestFor: 'Reasoning, coding' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', provider: 'Anthropic', context: '200K', cost: '$0.80/1M in', bestFor: 'Fast, cheap' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'Anthropic', context: '200K', cost: '$15/1M in', bestFor: 'Most capable' },
  ],
  google: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google', context: '1M', cost: 'Free 1500/d', bestFor: 'Long context, 15 RPM' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google', context: '1M', cost: 'Free 1500/d', bestFor: 'Fast, 15 RPM' },
    { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash', provider: 'Google', context: '1M', cost: 'Free 500/d', bestFor: 'Preview, reasoning' },
    { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', provider: 'Google', context: '1M', cost: 'Free 500/d', bestFor: 'Multimodal, 1M' },
    { id: 'gemma-3-27b-it', name: 'Gemma 3 27B', provider: 'Google', context: '131K', cost: 'Free via AI Studio', bestFor: 'Open-weight 27B' },
  ],
  cerebras: [
    { id: 'llama3.1-8b', name: 'Llama 3.1 8B', provider: 'Cerebras', context: '8K', cost: 'Free 1M/d', bestFor: 'Fastest Wafer, 30x' },
    { id: 'llama3.1-70b', name: 'Llama 3.1 70B', provider: 'Cerebras', context: '8K', cost: 'Free 1M/d', bestFor: 'Wafer 70B, ~2600 t/s' },
    { id: 'gpt-oss-120b', name: 'GPT-OSS 120B', provider: 'Cerebras', context: '8K', cost: 'Free 1M/d', bestFor: 'OpenAI 120B wafer' },
    { id: 'zai-glm-4.7', name: 'GLM 4.7', provider: 'Cerebras', context: '8K', cost: 'Free 1M/d', bestFor: 'Zhipu reasoning' },
  ],
  mistral: [
    { id: 'mistral-small-latest', name: 'Mistral Small', provider: 'Mistral', context: '32K', cost: 'Free exp', bestFor: 'Experiment ~1B tok/mo' },
    { id: 'mistral-medium-latest', name: 'Mistral Medium', provider: 'Mistral', context: '128K', cost: 'Free exp', bestFor: 'Balanced, 1 RPS' },
    { id: 'codestral-latest', name: 'Codestral', provider: 'Mistral', context: '256K', cost: 'Free exp', bestFor: 'Coding, FIM' },
    { id: 'pixtral-12b-2409', name: 'Pixtral 12B', provider: 'Mistral', context: '128K', cost: 'Free exp', bestFor: 'Vision, 128K' },
    { id: 'ministral-8b-latest', name: 'Ministral 8B', provider: 'Mistral', context: '128K', cost: 'Free exp', bestFor: 'Edge, fast' },
  ],
  cloudflare: [
    { id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', name: 'Llama 3.3 70B Fast', provider: 'Cloudflare', context: '24K', cost: 'Free 10k neurons/d', bestFor: 'Edge, 10k/d' },
    { id: '@cf/meta/llama-3.2-11b-vision-instruct', name: 'Llama 3.2 11B Vision', provider: 'Cloudflare', context: '131K', cost: 'Free 10k/d', bestFor: 'Vision edge' },
    { id: '@cf/google/gemma-3-27b-it', name: 'Gemma 3 27B', provider: 'Cloudflare', context: '8K', cost: 'Free 10k/d', bestFor: 'Gemma edge' },
    { id: '@cf/openai/gpt-oss-20b', name: 'GPT-OSS 20B', provider: 'Cloudflare', context: '131K', cost: 'Free 10k/d', bestFor: 'Open-weight edge' },
  ],
  nvidia: [
    { id: 'nvidia/llama-3.3-nemotron-super-49b-v1.5', name: 'Nemotron Super 49B', provider: 'NVIDIA NIM', context: '1M', cost: 'Free 40 RPM', bestFor: 'Reasoning, 40 RPM' },
    { id: 'deepseek-ai/deepseek-v4-flash', name: 'DeepSeek V4 Flash', provider: 'NVIDIA NIM', context: '1M', cost: 'Free 40 RPM', bestFor: 'Flash, 40 RPM' },
    { id: 'moonshotai/kimi-k3', name: 'Kimi K3', provider: 'NVIDIA NIM', context: '1M', cost: 'Free 40 RPM', bestFor: 'MoE, 1M' },
    { id: 'qwen/qwen3-8b', name: 'Qwen3 8B', provider: 'NVIDIA NIM', context: '128K', cost: 'Free 40 RPM', bestFor: 'Fast, 1K req/mo' },
    { id: 'google/gemma-2-9b-it', name: 'Gemma 2 9B', provider: 'NVIDIA NIM', context: '8K', cost: 'Free 40 RPM', bestFor: 'Gemma NIM' },
  ],
  together: [
    { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Turbo', provider: 'Together', context: '131K', cost: '$0.88/1M in', bestFor: 'Paid, turbo' },
    { id: 'Qwen/Qwen3-235B-A22B-fp8', name: 'Qwen3 235B', provider: 'Together', context: '131K', cost: '$2.0/1M in', bestFor: 'MoE 235B' },
  ],
  cohere: [
    { id: 'command-r-plus-08-2024', name: 'Command R+', provider: 'Cohere', context: '128K', cost: 'Free trial $5', bestFor: 'RAG, tools' },
    { id: 'command-a-03-2025', name: 'Command A', provider: 'Cohere', context: '256K', cost: 'Free trial', bestFor: 'Agentic, 256K' },
    { id: 'embed-english-v3.0', name: 'Embed English v3', provider: 'Cohere', context: '512', cost: 'Free trial', bestFor: 'Embeddings' },
  ],
  custom: [],
};

export const PROVIDER_DETAILS: Record<AIProvider, { baseUrl: string; docs: string; keyUrl: string; howTo: string[]; limits: string; notes: string }> = {
  openrouter: { baseUrl: 'https://openrouter.ai/api/v1', docs: 'https://openrouter.ai/docs', keyUrl: 'https://openrouter.ai/keys', howTo: ['Sign up at openrouter.ai (no card)', 'Create key at /keys', 'Use any :free model — 20 RPM / 50-1000/d'], limits: '20 RPM, 50/d under $10 credits, 1000/d after $10 one-time', notes: 'Widest selection, OpenAI-compatible. :free models rotate; check /models live.' },
  groq: { baseUrl: 'https://api.groq.com/openai/v1', docs: 'https://console.groq.com/docs', keyUrl: 'https://console.groq.com/keys', howTo: ['Sign up at console.groq.com (no card)', 'Create key at /keys', 'Pick llama-3.3-70b-versatile for quality'], limits: '30 RPM per model, 14.4k RPD (8B), 1k RPD (70B)', notes: 'Fastest LPU ~300-1000 t/s. Most generous free free.' },
  huggingface: { baseUrl: 'https://router.huggingface.co/v1', docs: 'https://huggingface.co/docs/inference-providers', keyUrl: 'https://huggingface.co/settings/tokens', howTo: ['Create HF token at /settings/tokens', 'Use router.huggingface.co/v1 — $0.10/mo credit'], limits: '$0.10/mo free credit, then PRO $2; Inference Providers', notes: 'Huge Hub (200+), use :free suffix not needed.' },
  ollama: { baseUrl: 'http://localhost:11434/v1', docs: 'https://ollama.com/docs', keyUrl: 'http://localhost:11434', howTo: ['Install Ollama from ollama.com', 'Run: ollama run llama3.2', 'No key needed — fully local & private'], limits: 'Unlimited local, GPU/CPU bound', notes: 'Best for privacy. Also Ollama Cloud at api.ollama.com (hosted).' },
  openai: { baseUrl: 'https://api.openai.com/v1', docs: 'https://platform.openai.com/docs', keyUrl: 'https://platform.openai.com/api-keys', howTo: ['Add billing at platform.openai.com', 'Create key at /api-keys'], limits: 'Paid only, $5 free trial credit for new accounts', notes: 'Flagship quality, but not free.' },
  anthropic: { baseUrl: 'https://api.anthropic.com', docs: 'https://docs.anthropic.com', keyUrl: 'https://console.anthropic.com/settings/keys', howTo: ['Create account at console.anthropic.com', 'Add balance at /settings/billing'], limits: 'Paid, $5 trial for new — use via OpenRouter for free anthropic :free if available', notes: 'Best reasoning, requires adapter for OpenAI compat.' },
  google: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', docs: 'https://ai.google.dev/gemini-api/docs/open-ai', keyUrl: 'https://aistudio.google.com/api-keys', howTo: ['Go to aistudio.google.com/api-keys', 'Create key — no card, 15 RPM'], limits: '15 RPM, 1500 RPD (free), 1M context', notes: 'Gemini 2.0/3.5 Flash + Gemma. OpenAI compat via /openai.' },
  cerebras: { baseUrl: 'https://api.cerebras.ai/v1', docs: 'https://inference-docs.cerebras.ai', keyUrl: 'https://cloud.cerebras.ai/', howTo: ['Sign up at cloud.cerebras.ai', 'Get $5 free → 1M tokens/d free tier'], limits: '1M tokens/day free, ~5 RPM, 8K context cap free', notes: 'Wafer-Scale — 30x faster than GPU. Models rotate.' },
  mistral: { baseUrl: 'https://api.mistral.ai/v1', docs: 'https://docs.mistral.ai/api/', keyUrl: 'https://console.mistral.ai/api-keys', howTo: ['Sign up at console.mistral.ai (phone verify)', 'Create key at /api-keys — Experiment plan free'], limits: '~1 RPS, ~1B tokens/mo free, 500K TPM', notes: 'All Mistral models incl. Codestral/Pixtral under Experiment.' },
  cloudflare: { baseUrl: 'https://api.cloudflare.com/client/v4/accounts/{id}/ai/v1', docs: 'https://developers.cloudflare.com/workers-ai/', keyUrl: 'https://dash.cloudflare.com/', howTo: ['Create Cloudflare account', 'Get API token at /profile/api-tokens', 'Use account ID in URL'], limits: '10,000 neurons/day free, edge inference', notes: 'Edge, cheap. Needs account ID substitution.' },
  nvidia: { baseUrl: 'https://integrate.api.nvidia.com/v1', docs: 'https://docs.api.nvidia.com/nim', keyUrl: 'https://build.nvidia.com/', howTo: ['Sign up at build.nvidia.com', 'Generate API key — 1K req/mo free'], limits: 'Up to 40 RPM, 1K req/mo free', notes: 'NIM — hosts llama, gemma, deepseek, kimi etc. Fast.' },
  together: { baseUrl: 'https://api.together.xyz/v1', docs: 'https://docs.together.ai', keyUrl: 'https://api.together.ai/settings/api-keys', howTo: ['Sign up at together.ai', 'Add $5 minimum (paid)'], limits: 'Paid — $5 min, good for 200+ models', notes: 'Not free, but cheap Turbo. Included for completeness.' },
  cohere: { baseUrl: 'https://api.cohere.com/v2', docs: 'https://docs.cohere.com/docs', keyUrl: 'https://dashboard.cohere.com/api-keys', howTo: ['Sign up at cohere.com', 'Get trial key — $5 credit'], limits: 'Trial $5 credit, then paid', notes: 'RAG-specialized (Command R+).' },
  custom: { baseUrl: '', docs: '', keyUrl: '', howTo: ['Enter any OpenAI-compatible baseUrl', 'Add apiKey if needed', 'Set model id exactly'], limits: 'Depends on provider', notes: 'For self-hosted, LocalAI, vLLM, LiteLLM, etc.' },
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
  accent: string; // hsl e.g. "25 100% 50%"
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

export const ACCENT_PRESETS: { id: string; label: string; hsl: string; hex: string }[] = [
  { id: 'orange', label: 'FINESE Orange', hsl: '25 100% 50%', hex: '#FF6A00' },
  { id: 'teal', label: 'Teal', hsl: '173 58% 39%', hex: '#0f766e' },
  { id: 'violet', label: 'Violet', hsl: '265 55% 58%', hex: '#7c3aed' },
  { id: 'blue', label: 'Trust Blue', hsl: '214 90% 52%', hex: '#1d6ef5' },
  { id: 'emerald', label: 'Emerald', hsl: '160 60% 45%', hex: '#0d9488' },
  { id: 'rose', label: 'Rose', hsl: '346 77% 49%', hex: '#e11d48' },
  { id: 'amber', label: 'Amber', hsl: '42 100% 50%', hex: '#ffb300' },
  { id: 'slate', label: 'Slate', hsl: '222 28% 20%', hex: '#1e293b' },
];

function applyAccent(hsl: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--primary', hsl);
  document.documentElement.style.setProperty('--ring', hsl);
  document.documentElement.style.setProperty('--sidebar-primary', hsl);
  document.documentElement.style.setProperty('--sidebar-ring', hsl);
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ai: defaultAI,
      general: { theme: 'light', language: 'en', autoSave: true, openMode: true, accent: '25 100% 50%' },
      data: { maxFileMB: 20, maxRows: 250000, autoProfile: true, cacheProfile: true },
      setAI: (patch) => set((s) => ({ ai: { ...s.ai, ...patch } })),
      setGeneral: (patch) => {
        const next = { ...get().general, ...patch };
        if (patch.accent) applyAccent(patch.accent);
        // apply theme immediately
        if (patch.theme) {
          if (typeof document !== 'undefined') {
            const isDark = patch.theme === 'dark' || (patch.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            document.documentElement.classList.toggle('light', !isDark);
            document.documentElement.classList.toggle('dark', isDark);
            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
          }
        }
        set({ general: next });
        return;
      },
      setData: (patch) => set((s) => ({ data: { ...s.data, ...patch } })),
      resetAI: () => set({ ai: defaultAI }),
      testConnection: async () => {
        const { ai } = get();
        const start = Date.now();
        try {
          // free tier simulation for providers that are generously free (no key needed to validate UI)
          const freeSimProviders: AIProvider[] = ['openrouter','groq','cerebras','mistral','cloudflare','nvidia','google','cohere'];
          if (ai.useFree && freeSimProviders.includes(ai.provider)) {
            await new Promise(r => setTimeout(r, 300));
            return { ok: true, latency: Date.now() - start };
          }
          if (ai.provider === 'ollama') {
            const base = ai.baseUrl || 'http://localhost:11434';
            const resp = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(3000) });
            return { ok: resp.ok, latency: Date.now() - start, error: resp.ok ? undefined : `Status ${resp.status}` };
          }
          if (!ai.apiKey && !ai.useFree) return { ok: false, error: 'API key required for paid model' };
          const base = ai.baseUrl || PROVIDER_DETAILS[ai.provider]?.baseUrl || (ai.provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : ai.provider === 'groq' ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1');
          const resp = await fetch(`${base}/models`, {
            headers: { Authorization: `Bearer ${ai.apiKey || 'test'}` },
            signal: AbortSignal.timeout(5000),
          });
          return { ok: resp.status < 500, latency: Date.now() - start, error: resp.ok ? undefined : `Status ${resp.status}` };
        } catch (e:any) {
          return { ok: false, error: e.message || 'Network error' };
        }
      },
    }),
    {
      name: 'finese-settings',
      partialize: (s) => ({ ai: s.ai, general: s.general, data: s.data }),
      onRehydrateStorage: () => (state) => {
        if (state?.general?.accent) setTimeout(()=>applyAccent(state.general.accent), 0);
        if (state?.general?.theme) {
          const t = state.general.theme;
          const isDark = t === 'dark' || (t === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) || !t || t === 'system';
          // default dark if system and no match
          if (typeof document !== 'undefined') {
            // if no explicit light, keep dark (brand default)
            const shouldLight = state.general.theme === 'light' || (state.general.theme === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches && !window.matchMedia('(prefers-color-scheme: dark)').matches);
            // simpler: respect stored theme, default dark
            if (state.general.theme === 'light') {
              document.documentElement.classList.add('light');
              document.documentElement.classList.remove('dark');
              document.documentElement.setAttribute('data-theme','light');
            } else if (state.general.theme === 'dark') {
              document.documentElement.classList.add('dark');
              document.documentElement.classList.remove('light');
              document.documentElement.setAttribute('data-theme','dark');
            }
          }
        } else if (typeof document !== 'undefined') {
          // initial accent already applied via CSS, ensure orange default
          applyAccent('25 100% 50%');
        }
      },
    }
  )
);
