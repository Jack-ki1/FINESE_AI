// Single-user local mode — explicit opt-in via VITE_LOCAL_MODE=true.
//
// This exists for one situation only: you, on your own machine, with no
// Supabase project (paused, deleted, or never created). When enabled:
//  - sign-in is a single explicit "Continue locally" button — no password
//    (there is nobody to keep out of your own laptop), no seeded accounts,
//    nothing that could ever authenticate anyone on a shared deployment;
//  - uploads, compute, and chat run against localStorage + in-browser stats
//    instead of edge functions;
//  - the server still rejects these local tokens (it only accepts real
//    Supabase JWTs), so nothing here weakens a hosted deployment.
//
// NEVER enable this in production/preview hosting. It defaults to false, and
// the UI shows a permanent "Local · single-user" pill while it is on so a
// misconfigured deploy is obvious.

export function isLocalMode(): boolean {
  try {
    return (import.meta as any).env?.VITE_LOCAL_MODE === 'true';
  } catch {
    return false;
  }
}

if (isLocalMode() && typeof console !== 'undefined') {
  console.warn(
    '[FINESE] VITE_LOCAL_MODE=true — single-user local operation, no real authentication. ' +
    'NEVER deploy a build with this flag set.'
  );
}
