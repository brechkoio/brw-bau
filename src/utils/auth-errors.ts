import { AuthError } from '@supabase/supabase-js';

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

export function authErrorMessage(err: unknown, t: TranslateFn, fallbackKey: string): string {
  if (err instanceof AuthError && err.code) {
    const key = CODE_KEYS[err.code];
    if (key) return t(key);
  }
  return t(fallbackKey);
}
