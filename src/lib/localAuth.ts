export interface LocalUser {
  id: string;
  email: string;
  password: string; // plaintext for demo local only
  is_admin: boolean;
  created_at: string;
}

const USERS_KEY = 'finese-local-users';
const SESSION_KEY = 'finese-local-session';

function loadUsers(): LocalUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return ensureDefaultAdmin([]);
    return ensureDefaultAdmin(JSON.parse(raw));
  } catch { return ensureDefaultAdmin([]); }
}

function saveUsers(users: LocalUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function ensureDefaultAdmin(users: LocalUser[]): LocalUser[] {
  const defaults: LocalUser[] = [
    { id: '00000000-0000-4000-a000-0000000000a1', email: 'finese_admin@gmail.com', password: 'finese_admin1', is_admin: true, created_at: new Date().toISOString() },
    { id: '00000000-0000-4000-a000-0000000000a2', email: 'admin@finese.ai', password: 'Admin123!', is_admin: true, created_at: new Date().toISOString() },
  ];
  let changed = false;
  for (const d of defaults) {
    if (!users.some(u => u.email.toLowerCase() === d.email.toLowerCase())) {
      users.push(d); changed = true;
    }
  }
  if (changed) saveUsers(users);
  return users;
}

export function getLocalUsers(): LocalUser[] { return loadUsers(); }

export function findLocalUser(email: string): LocalUser | undefined {
  return loadUsers().find(u => u.email.toLowerCase() === email.toLowerCase().trim());
}

export function createLocalUser(email: string, password: string): { user?: LocalUser; error?: string } {
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return { error: 'Invalid email' };
  if (password.length < 6) return { error: 'Password must be at least 6 characters' };
  const users = loadUsers();
  if (users.some(u => u.email.toLowerCase() === e)) return { error: 'Email already registered — try signing in' };
  const user: LocalUser = { id: crypto.randomUUID(), email: e, password, is_admin: false, created_at: new Date().toISOString() };
  users.push(user); saveUsers(users);
  return { user };
}

export function validateLocalUser(email: string, password: string): LocalUser | null {
  const u = findLocalUser(email);
  if (!u) return null;
  if (u.password !== password) return null;
  return u;
}

export function createLocalSessionForUser(user: LocalUser): any {
  const now = Math.floor(Date.now()/1000);
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
      user_metadata: { is_admin: user.is_admin, name: user.email.split('@')[0] },
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
  } catch { return null; }
}

export function clearLocalSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function isLocalAdmin(email: string): boolean {
  const u = findLocalUser(email);
  return !!u?.is_admin;
}
