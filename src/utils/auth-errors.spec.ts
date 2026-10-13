import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthApiError, AuthRetryableFetchError, AuthUnknownError } from '@supabase/supabase-js';
import { authErrorMessage, authErrorReason, authReasonMessageKey } from './auth-errors';

const t = (key: string) => key;

function setOnline(value: boolean) {
  vi.stubGlobal('navigator', { onLine: value });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('authErrorReason', () => {
  it('keeps a known Supabase error code', () => {
    setOnline(true);
    expect(authErrorReason(new AuthApiError('Invalid', 400, 'invalid_credentials'))).toBe(
      'invalid_credentials',
    );
  });

  it('classifies a fetch that never reached the server as a network failure', () => {
    setOnline(true);
    expect(authErrorReason(new AuthRetryableFetchError('Failed to fetch', 0))).toBe('network');
  });

  it('classifies a 5xx from the server as server unavailable', () => {
    setOnline(true);
    expect(authErrorReason(new AuthRetryableFetchError('Bad Gateway', 502))).toBe(
      'server_unavailable',
    );
  });

  it('reports offline when the browser knows it has no connection', () => {
    setOnline(false);
    expect(authErrorReason(new AuthRetryableFetchError('Failed to fetch', 0))).toBe('offline');
  });

  it('returns null for an error it cannot explain', () => {
    setOnline(true);
    expect(authErrorReason(new AuthUnknownError('weird', null))).toBeNull();
    expect(authErrorReason(new AuthApiError('?', 400, 'some_new_code'))).toBeNull();
  });
});

describe('authErrorMessage', () => {
  it('no longer hides a network failure behind the generic fallback', () => {
    setOnline(true);
    expect(
      authErrorMessage(
        new AuthRetryableFetchError('Failed to fetch', 0),
        t,
        'auth.login.errorFallback',
      ),
    ).toBe('auth.errors.network');
  });

  it('still falls back for unexplained errors', () => {
    setOnline(true);
    expect(authErrorMessage(new Error('boom'), t, 'auth.login.errorFallback')).toBe(
      'auth.login.errorFallback',
    );
  });
});

describe('authReasonMessageKey', () => {
  it('maps stored reasons back to messages and ignores unknown ones', () => {
    expect(authReasonMessageKey('user_banned')).toBe('auth.errors.userBanned');
    expect(authReasonMessageKey('server_unavailable')).toBe('auth.errors.serverUnavailable');
    expect(authReasonMessageKey('AuthUnknownError')).toBeNull();
    expect(authReasonMessageKey(null)).toBeNull();
  });
});
