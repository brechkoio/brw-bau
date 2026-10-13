import { AuthError } from '@supabase/supabase-js';
import { supabase } from '@/boot/supabase';
import { authErrorReason } from '@/utils/auth-errors';

// Failed sign-in attempts are reported to the log-login-failure edge
// function so an admin can see them (public.login_failures). They're
// queued in localStorage first rather than sent directly: the failure
// worth knowing about most is "the phone couldn't reach the server", and
// at that moment the report can't reach it either. The queue is flushed
// right away, again on every app start, and whenever the browser comes
// back online.

const QUEUE_KEY = 'brw.loginFailures';
// Same cap as the edge function's per-request limit; oldest entries are
// dropped first if a device keeps failing while offline.
const MAX_QUEUE = 20;

export interface LoginFailure {
  occurredAt: string;
  email: string | null;
  method: 'password' | 'google';
  code: string | null;
  status: number | null;
  message: string;
  online: boolean;
}

function readQueue(): LoginFailure[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as LoginFailure[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: LoginFailure[]) {
  try {
    if (queue.length) localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    else localStorage.removeItem(QUEUE_KEY);
  } catch {
    // private mode / quota: the report is lost, sign-in itself is unaffected
  }
}

let flushing: Promise<void> | null = null;

export function flushLoginFailures(): Promise<void> {
  flushing ??= (async () => {
    try {
      const batch = readQueue();
      if (!batch.length) return;
      const { error } = await supabase.functions.invoke('log-login-failure', {
        body: { entries: batch },
      });
      if (error) return;
      // Entries recorded while the request was in flight stay queued.
      writeQueue(readQueue().slice(batch.length));
    } catch {
      // still unreachable — keep the queue for the next attempt
    } finally {
      flushing = null;
    }
  })();
  return flushing;
}

export function recordLoginFailure(params: {
  email: string;
  method: LoginFailure['method'];
  error: unknown;
}) {
  const { error } = params;
  const entry: LoginFailure = {
    occurredAt: new Date().toISOString(),
    email: params.email.trim().toLowerCase() || null,
    method: params.method,
    code:
      authErrorReason(error) ?? (error instanceof AuthError ? (error.code ?? error.name) : null),
    status: error instanceof AuthError && error.status !== undefined ? error.status : null,
    message: error instanceof Error ? error.message : String(error),
    online: navigator.onLine,
  };
  writeQueue([...readQueue(), entry].slice(-MAX_QUEUE));
  void flushLoginFailures();
}
