import { supabase } from '@/integrations/supabase/client';

type Level = 'info' | 'warn' | 'error';

const recent = new Map<string, number>();
const DEDUPE_MS = 10_000;

/** Records an app event/error for monitoring. Never throws. */
export async function logEvent(level: Level, message: string, context?: Record<string, unknown>) {
  try {
    const key = `${level}:${message}`;
    const now = Date.now();
    if ((recent.get(key) ?? 0) > now - DEDUPE_MS) return;
    recent.set(key, now);

    if (level === 'error') console.error(message, context);

    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user?.id;
    if (!uid) return; // RLS: only signed-in users can persist logs

    await supabase.from('app_logs').insert({
      user_id: uid,
      level,
      source: 'client',
      message: message.slice(0, 2000),
      context: (context ?? null) as never,
      path: window.location.pathname,
      user_agent: navigator.userAgent.slice(0, 500),
    });
  } catch {
    /* monitoring must never break the app */
  }
}

/** Attaches global handlers for uncaught errors and unhandled promise rejections. */
export function installGlobalErrorLogging() {
  window.addEventListener('error', (e) => {
    logEvent('error', e.message || 'Uncaught error', {
      filename: e.filename, lineno: e.lineno, colno: e.colno,
    });
  });
  window.addEventListener('unhandledrejection', (e) => {
    const reason: any = e.reason;
    logEvent('error', reason?.message || String(reason) || 'Unhandled rejection', {
      stack: reason?.stack?.slice(0, 1000),
    });
  });
}