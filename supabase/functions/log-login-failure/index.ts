// Records failed sign-in attempts queued by the client (see
// src/utils/login-failures.ts). Called without a user session — the whole
// point is that the caller couldn't sign in — so verify_jwt is off for
// this function in config.toml. Writes go through the service-role key;
// public.login_failures has no insert policy of its own.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mirrors the client's queue cap, so one request can't flood the table.
const MAX_ENTRIES = 20;
const METHODS = new Set(['password', 'google']);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function text(value: unknown, max: number): string | null {
  return typeof value === 'string' && value ? value.slice(0, max) : null;
}

function parseEntry(raw: unknown) {
  if (!raw || typeof raw !== 'object') return null;
  const e = raw as Record<string, unknown>;

  const email = text(e.email, 320);
  const method = text(e.method, 16);
  const occurredAt = text(e.occurredAt, 40);
  if (!method || !METHODS.has(method) || !occurredAt) return null;
  if (Number.isNaN(Date.parse(occurredAt))) return null;

  return {
    occurred_at: occurredAt,
    email: email?.toLowerCase() ?? null,
    method,
    error_code: text(e.code, 64),
    error_status: typeof e.status === 'number' && Number.isInteger(e.status) ? e.status : null,
    error_message: text(e.message, 500) ?? '',
    was_online: typeof e.online === 'boolean' ? e.online : null,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let body: { entries?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!Array.isArray(body.entries) || body.entries.length > MAX_ENTRIES) {
    return json({ error: `entries must be an array of at most ${MAX_ENTRIES}` }, 400);
  }

  // The request comes from the worker's device itself, so its IP and user
  // agent describe where the failed attempt happened.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
  const userAgent = text(req.headers.get('user-agent'), 500);

  const rows = body.entries
    .map(parseEntry)
    .filter((row) => row !== null)
    .map((row) => ({ ...row, ip, user_agent: userAgent }));
  if (rows.length === 0) {
    return json({ ok: true, inserted: 0 });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { error } = await admin.from('login_failures').insert(rows);
  if (error) {
    return json({ error: error.message }, 500);
  }

  return json({ ok: true, inserted: rows.length });
});
