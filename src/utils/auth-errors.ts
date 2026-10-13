import { AuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';

type TranslateFn = (key: string, params?: Record<string, unknown>) => string;

// Supabase Auth errors carry a stable machine-readable `code` (see
// @supabase/auth-js's ErrorCode union) separate from `message`, which is
// always English and not meant for end users. Map the codes that can
// actually surface from this app's flows (sign in/up, password reset,
// Google OAuth) to localized text; anything unmapped falls back to the
// caller's generic per-form error message.
const CODE_KEYS: Partial<Record<string, string>> = {
  invalid_credentials: 'auth.errors.invalidCredentials',
  email_not_confirmed: 'auth.errors.emailNotConfirmed',
  user_already_exists: 'auth.errors.userAlreadyExists',
  email_exists: 'auth.errors.userAlreadyExists',
  identity_already_exists: 'auth.errors.userAlreadyExists',
  weak_password: 'auth.errors.weakPassword',
  same_password: 'auth.errors.samePassword',
  over_email_send_rate_limit: 'auth.errors.rateLimited',
  over_request_rate_limit: 'auth.errors.rateLimited',
  over_sms_send_rate_limit: 'auth.errors.rateLimited',
  signup_disabled: 'auth.errors.signupDisabled',
  email_provider_disabled: 'auth.errors.signupDisabled',
  user_banned: 'auth.errors.userBanned',
  email_address_invalid: 'auth.errors.invalidEmail',
  email_address_not_authorized: 'auth.errors.invalidEmail',
  session_expired: 'auth.errors.sessionExpired',
  refresh_token_not_found: 'auth.errors.sessionExpired',
  captcha_failed: 'auth.errors.captchaFailed',
};

// Failures that never got a real answer from Supabase carry no `code`, so
// without these they'd all collapse into the per-form "something went
// wrong" text — which reads exactly like a rejected password. auth-js wraps
// both a fetch that never reached the server (status 0) and a 5xx/Cloudflare
// infrastructure response in AuthRetryableFetchError.
const CONNECTIVITY_KEYS: Partial<Record<string, string>> = {
  offline: 'auth.errors.offline',
  network: 'auth.errors.network',
  server_unavailable: 'auth.errors.serverUnavailable',
};

function connectivityReason(err: unknown): string | null {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 'offline';
  if (isAuthRetryableFetchError(err)) {
    return err.status === 0 ? 'network' : 'server_unavailable';
  }
  if (err instanceof AuthError && err.status !== undefined && err.status >= 500) {
    return 'server_unavailable';
  }
  return null;
}

// A stable, language-independent reason for a failure: Supabase's own
// error code when it gave one we know, else a connectivity reason. Stored
// with failed-login reports so the admin view can show it localized.
export function authErrorReason(err: unknown): string | null {
  if (err instanceof AuthError && err.code && CODE_KEYS[err.code]) return err.code;
  return connectivityReason(err);
}

export function authReasonMessageKey(reason: string | null): string | null {
  if (!reason) return null;
  return CODE_KEYS[reason] ?? CONNECTIVITY_KEYS[reason] ?? null;
}

export function authErrorMessage(err: unknown, t: TranslateFn, fallbackKey: string): string {
  return t(authReasonMessageKey(authErrorReason(err)) ?? fallbackKey);
}
