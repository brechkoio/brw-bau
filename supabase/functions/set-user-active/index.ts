// Activates/deactivates a user account. Runs under the service-role key
// because `auth.admin.updateUserById` isn't reachable from the browser
// client. The real lockout is Supabase Auth's own ban mechanism — a banned
// user can never obtain a session, so they can't read their own reports or
// rate either; profiles.is_active only mirrors that status for the admin
// users table.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// GoTrue accepts a duration string, not "forever" — 100 years is the
// documented idiom for an effectively permanent ban. 'none' lifts it.
const BAN_DURATION = '876000h';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'Missing Authorization header' }, 401);
  }

  let body: { userId?: unknown; isActive?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  const { userId, isActive } = body;
  if (typeof userId !== 'string' || !userId || typeof isActive !== 'boolean') {
    return json({ error: 'userId (string) and isActive (boolean) are required' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user: caller },
    error: callerError,
  } = await callerClient.auth.getUser();
  if (callerError || !caller) {
    return json({ error: 'Invalid session' }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: callerProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single();
  if (callerProfile?.role !== 'admin') {
    return json({ error: 'Admins only' }, 403);
  }

  if (userId === caller.id) {
    return json({ error: 'Cannot deactivate your own account' }, 400);
  }

  const { error: banError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: isActive ? 'none' : BAN_DURATION,
  });
  if (banError) {
    return json({ error: banError.message }, 500);
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId);
  if (profileError) {
    return json({ error: profileError.message }, 500);
  }

  return json({ ok: true });
});
