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
      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mb-4">
        <img src={fineseLogo} alt="F" className="w-6 h-6 rounded-full object-cover" />
      </div>
      <h1 className="text-[26px] sm:text-[30px] font-bold tracking-tight text-center leading-tight">
        Ask a question. <span className="text-verified">Watch it get verified.</span>
      </h1>
      <p className="text-[14px] text-muted-foreground text-center max-w-lg mt-2 mb-3">
        Every number here is computed from your data — not guessed. Verified <span className="inline-flex items-center gap-1 font-mono text-verified bg-verified/10 border border-verified/20 px-1.5 py-0 rounded text-[11px]">● Verified</span> vs estimated <span className="inline-flex items-center gap-1 font-mono text-estimated bg-estimated/10 border border-estimated/20 border-dashed px-1.5 py-0 rounded text-[11px]">◐ Estimated</span> is visible in every answer and in the <span className="font-medium text-foreground">Evidence Rail</span> →
      </p>
      <p className="text-[12px] text-muted-foreground text-center max-w-md mb-8">
        Drop a file or pick a sample — then ask anything. Real charts, real stats, real SQL.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[640px] w-full mb-8">
        {starters.slice(0,4).map(s => (
          <button key={s.title} onClick={() => onPrompt(s.prompt)}
            className="group text-left p-4 rounded-2xl border border-border bg-card hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-sm font-medium">{s.title}</span>
            </div>
            <span className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{s.desc}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="text-xs text-muted-foreground">Try a sample dataset — 100×5 benchmark available in Data Viewer</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {samples.map(s => (
            <button key={s.name} onClick={() => ingest(s.data, s.name)}
              className="px-3 py-1.5 rounded-full border border-border bg-card text-xs hover:bg-muted transition-colors">
              {s.label}
            </button>
          ))}
          <button onClick={() => ingest(benchmarkData, 'benchmark_100x5.json')}
            className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:opacity-90">
            100×5 Benchmark
          </button>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground mt-10 text-center max-w-md">
        Numbers marked <span className="text-verified font-mono">Verified</span> came from server-side compute on your rows. <span className="text-estimated font-mono">Estimated</span> is AI-generated scaffolding — run it in your infra before you trust it.
      </p>
    </div>
  );
}
