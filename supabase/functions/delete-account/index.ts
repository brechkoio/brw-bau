// Deletes the calling user's account. Runs under the service-role key
// because `auth.admin.deleteUser` isn't reachable from the browser client.
// The caller is identified from their own JWT — never from a client-
// supplied id — so this can only ever delete the account making the call.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser();
  if (userError || !user) {
    return json({ error: 'Invalid session' }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: profile } = await admin
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .single();

  if (profile?.avatar_url) {
    const marker = '/avatars/';
    const idx = (profile.avatar_url as string).indexOf(marker);
    if (idx !== -1) {
      const path = (profile.avatar_url as string).slice(idx + marker.length);
      await admin.storage.from('avatars').remove([path]);
    }
  }

  await admin
    .from('profiles')
    .update({
      first_name: '',
      last_name: '',
      avatar_url: null,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return json({ error: deleteError.message }, 500);
  }

  return json({ ok: true });
});
