// Local demo-account store — browser-only, never trusted by the server.
//
// SECURITY: this module must NEVER auto-create an admin account and must
// NEVER be used as a sign-in fallback. The server (_shared/auth.ts) only
// accepts real Supabase-issued JWTs via supabase.auth.getUser(token), so any
// session minted here unlocks nothing server-side — but the client shell
// (useAuth / ProtectedRoute) must not treat it as authenticated either.
// Sign-in is Supabase-only (see src/pages/Auth.tsx). This store exists only
// so a user-created *non-admin* demo account can be listed, and so legacy
// keys from the removed backdoor can be purged. No hardcoded credentials.

export interface LocalUser {
  id: string;
  email: string;
  password: string; // plaintext for demo local only
  is_admin: boolean;
  created_at: string;
}

const USERS_KEY = 'finese-local-users';
const SESSION_KEY = 'finese-local-session';
const OWNER_KEY = 'finese-local-owner';
const LEGACY_KEYS = [
  'finese-local-session',
  'finese_local_session',
  'finese_admin_mock_session',
  'finese-local-users',
];

function loadUsers(): LocalUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Belt-and-braces: strip any persisted admin flag — nothing client-side
    // may ever confer admin.
    return parsed.filter((u) => u && typeof u.email === 'string' && u.is_admin !== true);
  } catch {
    return [];
  }
}

function saveUsers(users: LocalUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getLocalUsers(): LocalUser[] {
  return loadUsers();
}

export function findLocalUser(email: string): LocalUser | undefined {
  return loadUsers().find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
}

export function createLocalUser(email: string, password: string): { user?: LocalUser; error?: string } {
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return { error: 'Invalid email' };
  if (password.length < 6) return { error: 'Password must be at least 6 characters' };
  const users = loadUsers();
  if (users.some((u) => u.email.toLowerCase() === e)) return { error: 'Email already registered — try signing in' };
  // Explicitly never admin: client-side code cannot grant admin.
  const user: LocalUser = { id: crypto.randomUUID(), email: e, password, is_admin: false, created_at: new Date().toISOString() };
  users.push(user);
  saveUsers(users);
  return { user };
}

export function validateLocalUser(email: string, password: string): LocalUser | null {
  const u = findLocalUser(email);
  if (!u) return null;
  if (u.password !== password) return null;
  return u;
}

export function createLocalSessionForUser(user: LocalUser): any {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: `local-${user.id}`,
    refresh_token: `local-${user.id}`,
    expires_in: 86400,
    expires_at: now + 86400,
    token_type: 'bearer',
    user: {
      id: user.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: user.email,
      email_confirmed_at: new Date().toISOString(),
      user_metadata: { is_admin: false, name: user.email.split('@')[0] },
      app_metadata: { provider: 'email' },
      created_at: user.created_at,
    },
  };
}

export function saveLocalSession(session: any) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadLocalSession(): any | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s.expires_at && s.expires_at * 1000 < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function clearLocalSession() {
  localStorage.removeItem(SESSION_KEY);
}

/** Purge every legacy local-auth key (including the removed seeded-admin
 *  store) so a previously-planted backdoor session cannot persist.
 *  NOTE: OWNER_KEY is intentionally NOT in this list — it is the explicit
 *  single-user local-mode session, created only by the user's own click. */
export function purgeLegacyLocalAuth() {
  for (const k of LEGACY_KEYS) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}

export function isLocalAdmin(_email: string): boolean {
  // Client-side admin grants no longer exist. Always false.
  return false;
}

// ---------------------------------------------------------------------------
// Single-user local-mode owner session (VITE_LOCAL_MODE=true only).
//
// No password: on your own machine there is nobody to authenticate against,
// so a password would be theater. Created explicitly by the "Continue
// locally" button — never silently, never seeded. The token is prefixed
// `local-owner-` so it is unmistakable, and no server trusts it (edge
// functions only accept Supabase JWTs).
// ---------------------------------------------------------------------------

export function createLocalOwnerSession(): any {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: `local-owner-${crypto.randomUUID()}`,
    refresh_token: `local-owner-${crypto.randomUUID()}`,
    expires_in: 30 * 86400,
    expires_at: now + 30 * 86400,
    token_type: 'bearer',
    user: {
      id: 'local-owner',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'owner@localhost',
      email_confirmed_at: new Date().toISOString(),
      user_metadata: { is_local_owner: true, name: 'Local Owner' },
      app_metadata: { provider: 'local' },
      created_at: new Date().toISOString(),
    },
  };
}

export function saveLocalOwner(session: any) {
  localStorage.setItem(OWNER_KEY, JSON.stringify(session));
}

export function loadLocalOwner(): any | null {
  try {
    const raw = localStorage.getItem(OWNER_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s.expires_at && s.expires_at * 1000 < Date.now()) {
      localStorage.removeItem(OWNER_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function clearLocalOwner() {
  localStorage.removeItem(OWNER_KEY);
}
