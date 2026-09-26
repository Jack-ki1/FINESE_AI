// src/pages/Index.tsx
import { useState, type MouseEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, BarChart3, Brain, Database, ArrowRight, Play, Github,
} from 'lucide-react';
import { useDocumentHead } from '@/hooks/useDocumentHead';

const NAV_LINKS = [
  { href: '#how', label: 'How it works' },
  { href: '#proof', label: 'Verified compute' },
  { href: '#tools', label: 'Tools' },
];

function smoothScroll(e: MouseEvent<HTMLAnchorElement>, href: string) {
  e.preventDefault();
  const el = document.querySelector(href);
  if (!el) return;
  const doTransition = () => el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // @ts-expect-error — not yet in TS lib.dom types everywhere, safe to feature-detect
  if (document.startViewTransition) document.startViewTransition(doTransition);
  else doTransition();
}

export default function Index() {
  const [videoFailed, setVideoFailed] = useState(false);

  useDocumentHead(
    'FINESE AI — Verified data analysis, not guesses',
    'Upload a dataset, ask a question in plain English, get an answer backed by real, server-executed computation — not a language model estimating a number.'
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      {/* NAV */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[image:var(--gradient-brand)] flex items-center justify-center text-primary-foreground font-display font-bold text-sm">
              F
            </div>
            <span className="font-display font-bold tracking-tight">FINESE AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={(e) => smoothScroll(e, l.href)} className="hover:text-foreground transition-colors">
                {l.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline">
              Sign in
            </Link>
            <Link
              to="/auth?mode=signup"
              className="text-sm font-medium px-4 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full bg-verified/10 text-verified border border-verified/20">
            <ShieldCheck className="w-3.5 h-3.5" /> Server-verified compute
          </span>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl leading-[1.1] mt-5 tracking-tight">
            Ask your data a question.<br />
            Get a real answer —<br />
            <span className="bg-[image:var(--gradient-brand)] bg-clip-text text-transparent">not a guess.</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mt-5 max-w-md">
            Upload a spreadsheet, ask in plain English, and watch every number resolve from an estimate to a badge you can actually trust — because it was computed, not imagined.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-8">
            <Link
              to="/auth?mode=signup"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Start free <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#proof"
              onClick={(e) => smoothScroll(e, '#proof')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-border text-sm font-medium hover:bg-secondary transition-colors"
            >
              <Play className="w-4 h-4" /> See it work
            </a>
          </div>
        </div>

        {/* Real product demo video, with a designed fallback if not present yet */}
        <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl aspect-video bg-surface">
          {!videoFailed ? (
            <video
              className="w-full h-full object-cover"
              autoPlay muted loop playsInline
              poster="/media/hero-poster.jpg"
              onError={() => setVideoFailed(true)}
            >
              <source src="/media/hero-demo.mp4" type="video/mp4" />
            </video>
          ) : (
            <FallbackProductMockup />
          )}
        </div>
      </section>

      {/* PROOF SECTION — the actual differentiator, shown, not claimed */}
      <section id="proof" className="border-y border-border bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 rounded-2xl overflow-hidden border border-border aspect-video bg-background">
            <video className="w-full h-full object-cover" muted loop playsInline poster="/media/verify-poster.jpg">
              <source src="/media/verify-demo.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="font-display font-bold text-2xl md:text-3xl tracking-tight">Every number shows its work.</h2>
            <p className="text-muted-foreground mt-4">
              Behind every chat answer is an actual function call against your real, uploaded data — correlation, regression, a t-test, a trained model. If the sample&apos;s too small or the correlation&apos;s too weak to mean much, you&apos;re told that too, before you act on it.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                'Verified — computed server-side against your real data',
                'Estimated — a model\u2019s best guess, always labeled as such',
                'Flagged — verified, but with a caveat worth reading',
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-verified mt-2 shrink-0" />
                  <span className="text-muted-foreground">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FEATURES — asymmetric, restrained, not a generic 3-col icon grid */}
      <section id="tools" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="font-display font-bold text-2xl md:text-3xl tracking-tight max-w-lg">
          17 real analysis tools. No SQL required, and the SQL is real too.
        </h2>
        <div className="grid md:grid-cols-6 gap-4 mt-10">
          <FeatureCard
            className="md:col-span-4"
            icon={<BarChart3 className="w-5 h-5" />}
            title="Statistics that hold up"
            desc="Correlation, t-tests, ANOVA, regression, forecasting, PCA, and clustering — run against your actual file, with sample-size and significance checked automatically."
          />
          <FeatureCard
            className="md:col-span-2"
            icon={<Database className="w-5 h-5" />}
            title="Real SQL Lab"
            desc="DuckDB running in your browser — query your file directly."
          />
          <FeatureCard
            className="md:col-span-2"
            icon={<Brain className="w-5 h-5" />}
            title="A second opinion"
            desc="A verifier pass checks the model's own conclusions against the raw numbers before you see them."
          />
          <FeatureCard
            className="md:col-span-4"
            icon={<ShieldCheck className="w-5 h-5" />}
            title="Your data stays yours"
            desc="Bring your own model key, or run entirely on a free/local model — nothing requires your data to leave a system you control."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="font-display font-bold text-3xl tracking-tight">Stop trusting a chart because it looks right.</h2>
          <p className="text-muted-foreground mt-4">Free to start. Bring your own data.</p>
          <Link
            to="/auth?mode=signup"
            className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Start free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} FINESE AI · <Link to="/free-models" className="hover:text-foreground underline underline-offset-4">Free models — no pricing page, ever</Link></span>
          <a href="https://github.com" className="inline-flex items-center gap-1.5 hover:text-foreground">
            <Github className="w-4 h-4" /> GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

/** Coded fallback hero visual — used only if /media/hero-demo.mp4 hasn't been added yet.
 *  Deliberately looks like the real product (a chat turn resolving to Verified),
 *  not a generic illustration, so the page never looks unfinished. */
function FallbackProductMockup() {
  return (
    <div className="w-full h-full flex items-center justify-center p-8 bg-[image:var(--gradient-brand)]">
      <div className="w-full max-w-sm rounded-xl bg-background border border-border shadow-xl p-4 space-y-3">
        <div className="text-xs text-muted-foreground">&quot;What&apos;s driving the drop in Q3 retention?&quot;</div>
        <div className="rounded-lg bg-secondary p-3 text-sm">
          Retention fell 6.2% in Q3, concentrated in the 18–24 segment (n=1,842).
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-verified">
          <ShieldCheck className="w-3.5 h-3.5" /> Verified — group_by_aggregate, n=1,842
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, className = '' }: { icon: ReactNode; title: string; desc: string; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-6 ${className}`}>
      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
      <h3 className="font-display font-semibold mt-4">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
    </div>
  );
}
