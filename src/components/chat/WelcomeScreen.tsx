import fineseLogo from '@/assets/finese-logo.jpg';

export function WelcomeScreen({ onPrompt }: { onPrompt: (text: string) => void }) {
  const prompts = [
    { label: 'Profile my data', prompt: 'Profile all columns and summarize data quality' },
    { label: 'Find correlations', prompt: 'Find the top 5 most correlated feature pairs' },
    { label: 'Build a model', prompt: 'Build a classification model to predict the target and show confusion matrix' },
    { label: 'Forecast trend', prompt: 'Forecast the next 6 periods for my numeric series' },
  ];
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 sm:px-6 py-10 text-center">
      <div className="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center mb-4 shadow-md">
        <img src={fineseLogo} alt="F" className="w-7 h-7 rounded-full object-cover" />
      </div>
      <h2 className="text-2xl font-display font-bold tracking-tight">What are your data needs today?</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">Upload a file, ask a question, and watch it get <span className="text-verified font-medium">verified</span> — not guessed. Your numbers, with receipts.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 w-full max-w-lg">
        {prompts.map(p=>(
          <button key={p.label} onClick={()=>onPrompt(p.prompt)} className="text-left p-3 rounded-xl border bg-card hover:bg-accent hover:border-primary/20 transition-colors">
            <span className="text-xs font-medium">{p.label}</span>
            <span className="text-[11px] text-muted-foreground block truncate">{p.prompt}</span>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-4">Try <span className="font-mono">What’s driving churn?</span> or drop a CSV to start.</p>
    </div>
  );
}
