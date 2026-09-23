import { useDatumStore } from '@/store/datum.store';
import { salesData, hrData, stockData, benchmarkData } from '@/lib/sample-datasets';
import { BarChart3, Search, Sparkles, Brain, Bug, FlaskConical, GraduationCap, FileText, Blocks, BookOpen } from 'lucide-react';
import fineseLogo from '@/assets/finese-logo.jpg';

const starters = [
  { icon: Sparkles, title: 'Analyze my data', desc: 'Comprehensive analysis with charts & stats', prompt: 'Run a comprehensive analysis on this data — key findings, distributions, and visualizations', color: 'text-primary' },
  { icon: Brain, title: 'Build a model', desc: 'ML pipeline with full evaluation', prompt: 'Suggest and build the best ML model for this data with evaluation metrics', color: 'text-datum-violet' },
  { icon: Bug, title: 'Debug an error', desc: 'Paste error for root cause diagnosis', prompt: 'I have an error to debug — paste your error message or traceback', color: 'text-datum-red' },
  { icon: FlaskConical, title: 'Design experiment', desc: 'A/B test, power analysis, metrics', prompt: 'Help me design an experiment — A/B test setup, metric selection, and power analysis', color: 'text-datum-cyan' },
  { icon: GraduationCap, title: 'Explain a concept', desc: 'Learn any data topic with examples', prompt: 'Explain a data science concept — pick any topic and I will explain it with examples and intuition', color: 'text-datum-amber' },
  { icon: FileText, title: 'Generate documentation', desc: 'Docs, data dictionaries, READMEs', prompt: 'Generate documentation for this dataset — data dictionary, column descriptions, and usage notes', color: 'text-datum-green' },
  { icon: Blocks, title: 'System design', desc: 'Pipelines, architecture, monitoring', prompt: 'Help me design a data system architecture — pipelines, storage, processing, and monitoring', color: 'text-datum-violet' },
  { icon: BookOpen, title: 'Tell the data story', desc: 'Executive summary for stakeholders', prompt: 'Create an executive summary and data story for stakeholders — key findings, impact, and recommendations', color: 'text-primary' },
];

const samples = [
  { label: '📦 Sales Data', data: salesData, name: 'sales_data.csv' },
  { label: '👥 HR Data', data: hrData, name: 'hr_data.csv' },
  { label: '📈 Stock Data', data: stockData, name: 'stock_data.csv' },
];

export function WelcomeScreen({ onPrompt }: { onPrompt: (text: string) => void }) {
  const { ingest } = useDatumStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 sm:px-6 py-12">
      {/* ChatGPT style hero — centered, minimal */}
      <div className="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center mb-4">
        <img src={fineseLogo} alt="F" className="w-6 h-6 rounded-full object-cover" />
      </div>
      <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-center mb-2">
        What can I help with?
      </h1>
      <p className="text-[15px] text-black/50 dark:text-white/50 text-center max-w-md mb-10">
        Data intelligence for professionals — upload, analyze, or just chat.
      </p>

      {/* ChatGPT style 4 cards — 2x2 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[640px] w-full mb-8">
        {starters.slice(0,4).map(s => (
          <button key={s.title} onClick={() => onPrompt(s.prompt)}
            className="group text-left p-4 rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-white/[0.03] hover:bg-black/[0.02] dark:hover:bg-white/[0.06] transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-sm font-medium">{s.title}</span>
            </div>
            <span className="text-xs text-black/50 dark:text-white/50 leading-relaxed line-clamp-2">{s.desc}</span>
          </button>
        ))}
      </div>

      {/* Sample datasets — ChatGPT style pills */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-xs text-black/40 dark:text-white/40">Try a sample dataset — 100×5 benchmark available in Data Viewer</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {samples.map(s => (
            <button key={s.name} onClick={() => ingest(s.data, s.name)}
              className="px-3 py-1.5 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-xs hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
              {s.label}
            </button>
          ))}
          <button onClick={() => ingest(benchmarkData, 'benchmark_100x5.json')}
            className="px-3 py-1.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-medium hover:opacity-90">
            100×5 Benchmark
          </button>
        </div>
      </div>

      <p className="text-[11px] text-black/30 dark:text-white/30 mt-10 text-center max-w-md">
        FINESE AI can make mistakes. Verify important info. Your data stays private.
      </p>
    </div>
  );
}
