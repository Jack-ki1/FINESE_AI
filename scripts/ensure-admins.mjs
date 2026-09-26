// Provision the two admin accounts in Supabase Auth.
//
// Why this exists: sign-in is Supabase-only (no local fallback, no hardcoded
// passwords in the bundle). If the accounts were never created in Auth — or
// the project was recreated/paused — no credential pair can log in. This
// script creates them properly: real Auth users, email confirmed,
// user_metadata.is_admin = true (which useAuth + requireAdmin recognize).
//
// Passwords are NEVER stored here. Pass them via env vars:
//   SUPABASE_URL=https://<project>.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=<service_role key> \
//   ADMIN1_PASSWORD='<password for finese_admin@gmail.com>' \
//   ADMIN2_PASSWORD='<password for admin@finese.ai>' \
//   node scripts/ensure-admins.mjs
//
// Or: npm run admin:ensure  (reads the same env vars)

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMINS = [
  { email: 'finese_admin@gmail.com', password: process.env.ADMIN1_PASSWORD || '' },
  { email: 'admin@finese.ai', password: process.env.ADMIN2_PASSWORD || '' },
];

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}
const missing = ADMINS.filter((a) => !a.password);
if (missing.length) {
  console.error(`Missing passwords for: ${missing.map((a) => a.email).join(', ')}. Set ADMIN1_PASSWORD / ADMIN2_PASSWORD env vars.`);
  process.exit(1);
}

async function adminFetch(path, opts = {}) {
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/admin${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      ...(opts.headers || {}),
    },
  });
  const text = await resp.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-JSON */ }
  return { resp, json, text };
}

let failed = 0;
for (const { email, password } of ADMINS) {
  // 1. Does the user already exist? List and filter (admin list is paginated).
  let existing = null;
  try {
    const { resp, json } = await adminFetch('/users?per_page=1000');
    if (!resp.ok) throw new Error(`list users -> ${resp.status}: ${JSON.stringify(json)}`);
    const users = json?.users || json || [];
    existing = users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
  } catch (e) {
    console.error(`[${email}] could not list users: ${e.message}`);
    failed++;
    continue;
  }

  if (existing) {
    // 2a. Exists — confirm email + grant admin + reset password to the provided one.
    const { resp, json, text } = await adminFetch(`/users/${existing.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        email_confirm: true,
        password,
        user_metadata: { ...(existing.user_metadata || {}), is_admin: true },
      }),
    });
    if (!resp.ok) {
      console.error(`[${email}] update failed (${resp.status}): ${text.slice(0, 300)}`);
      failed++;
    } else {
      console.log(`[${email}] exists (id ${existing.id}) — email confirmed, is_admin=true, password set. Server says: ${JSON.stringify(json?.user_metadata || json?.email_confirmed_at || 'ok')}`);
    }
  } else {
    // 2b. Create fresh, confirmed, admin.
    const { resp, json, text } = await adminFetch('/users', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { is_admin: true },
      }),
    });
    if (!resp.ok) {
      console.error(`[${email}] create failed (${resp.status}): ${text.slice(0, 300)}`);
      failed++;
    } else {
      console.log(`[${email}] created (id ${json?.id || json?.user?.id || '?'}) — confirmed, is_admin=true.`);
    }
  }
}

if (failed) {
  console.error(`\nDone with ${failed} failure(s). If you see ENOTFOUND/EAI_AGAIN, the Supabase project is paused or the URL is wrong — unpause it first.`);
  process.exit(1);
}
console.log('\nDone. Both admins can now sign in at /auth; admins land on /admin.');
