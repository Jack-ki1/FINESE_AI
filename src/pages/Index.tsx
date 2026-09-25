import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Sparkles, ShieldCheck, Database } from 'lucide-react';

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">FINESE AI — verified compute, not guessed numbers</h1>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">Every number marked <span className="font-mono text-verified">● Verified</span> was computed server-side on your data. Free forever with local Ollama — your data never has to leave your machine.</p>
          <div className="flex justify-center gap-2">
            <Link to="/chat"><Button>Open Chat</Button></Link>
            <Link to="/gallery"><Button variant="outline">Public Gallery</Button></Link>
            <Link to="/settings"><Button variant="outline">Free tier → Settings</Button></Link>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-verified"/> Verified</CardTitle><CardDescription className="text-xs">Correlation, t-test, regression, K-Means, PCA, forecast, Random Forest — all with receipts.</CardDescription></CardHeader><CardContent><Link to="/chat"><Button size="sm" variant="outline">Try wizards</Button></Link></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><Database className="w-4 h-4 text-primary"/> Connect</CardTitle><CardDescription className="text-xs">Upload CSV/JSON or import a Google Sheet read-only. Join two datasets on a key.</CardDescription></CardHeader><CardContent><Link to="/data/upload"><Button size="sm" variant="outline">Upload / Sheets</Button></Link></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary"/> Team</CardTitle><CardDescription className="text-xs">Workspaces, semantic metrics defined once, comments on artifacts, report export with verified stamp.</CardDescription></CardHeader></Card>
        </div>
        <div className="rounded-xl border bg-card p-4 text-xs space-y-2">
          <p className="font-semibold">Free forever pitch</p>
          <p className="text-muted-foreground">OpenRouter free (50/d), Groq (14k/d), Hugging Face ($0.10/mo), or local Ollama (unlimited) — pick in Settings → AI. Most competitors cap free at 5 msgs/month. Here the free tier is the product, not a trial.</p>
        </div>
      </div>
    </div>
  );
}
