import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useDocumentHead } from "@/hooks/useDocumentHead";

const NotFound = () => {
  const location = useLocation();

  useDocumentHead('Page not found — FINESE AI', 'The link you followed is stale or mistyped.');

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground p-6 text-center">
      <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full bg-verified/10 text-verified border border-verified/20">
        <ShieldCheck className="w-3.5 h-3.5" /> 404 — stale link
      </span>
      <h1 className="font-display font-extrabold text-4xl tracking-tight">
        This page doesn&apos;t exist<span className="bg-[image:var(--gradient-brand)] bg-clip-text text-transparent">.</span>
      </h1>
      <p className="text-sm text-muted-foreground max-w-sm">
        The link you followed (<span className="font-mono">{location.pathname}</span>) is stale or mistyped.
        Your data and session are safe.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Back home <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/chat"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-sm font-medium hover:bg-secondary transition-colors"
        >
          Open chat
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
