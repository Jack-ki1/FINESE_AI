import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    // TODO: send to observability sink once one exists
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground p-6 text-center">
            <p className="font-display text-xl font-semibold">Something broke on our end.</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Your data and session are safe — this screen is just a rendering error. Reloading usually fixes it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium"
            >
              Reload
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export function RouteSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-3 p-6">
        <div className="h-6 w-2/3 rounded-md bg-surface animate-pulse" />
        <div className="h-4 w-full rounded-md bg-muted animate-pulse" />
        <div className="h-4 w-5/6 rounded-md bg-muted animate-pulse" />
        <div className="h-32 w-full rounded-xl bg-surface animate-pulse" />
      </div>
    </div>
  );
}
