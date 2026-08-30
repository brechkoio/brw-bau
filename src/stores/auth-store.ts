import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/boot/supabase';

interface Profile {
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'user';
  avatar_url: string | null;
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null);
  const user = ref<User | null>(null);
  const profile = ref<Profile | null>(null);
  const ready = ref(false);

  const isAuthenticated = computed(() => session.value !== null);
  const isAdmin = computed(() => profile.value?.role === 'admin');

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('email, first_name, last_name, role, avatar_url')
      .eq('id', userId)
      .single();
    profile.value = data;
  }

  async function applySession(newSession: Session | null) {
    session.value = newSession;
    user.value = newSession?.user ?? null;
    if (newSession?.user) {
      await loadProfile(newSession.user.id);
    } else {
      profile.value = null;
    }
  }

  let initPromise: Promise<void> | null = null;

  function init() {
    initPromise ??= (async () => {
      const { data } = await supabase.auth.getSession();
      await applySession(data.session);

      supabase.auth.onAuthStateChange((event, newSession) => {
        void applySession(newSession);
        // The recovery link's redirectTo points at the plain app root (the
        // only URL guaranteed to already be on Supabase's redirect
        // allow-list — a version with a `#/reset-password` suffix isn't
        // necessarily whitelisted and Supabase would silently fall back to
        // the default site URL instead of erroring). So instead of relying
        // on the link landing on a specific route, react to the recovery
        // session itself and navigate there client-side.
        if (event === 'PASSWORD_RECOVERY') {
          window.location.hash = '#/reset-password';
        }
      });

      ready.value = true;
    })();

    return initPromise;
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${window.location.pathname}`,
      },
    });
    if (error) throw error;
  }

  async function signUp(params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const { error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
        data: {
          first_name: params.firstName,
          last_name: params.lastName,
        },
      },
    });
    if (error) throw error;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  async function signOutEverywhere() {
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (error) throw error;
  }

  async function requestPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${window.location.pathname}`,
    });
    if (error) throw error;
  }

  async function confirmPasswordReset(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    if (!user.value?.email) throw new Error('Not authenticated');

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.value.email,
      password: currentPassword,
    });
    if (reauthError) throw reauthError;

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  async function deleteAccount() {
    const { error } = await supabase.functions.invoke('delete-account');
    if (error) throw error;
  }

  async function updateProfile(params: {
    firstName: string;
    lastName: string;
    avatarFile?: File | null;
  }) {
    if (!user.value) throw new Error('Not authenticated');

    let avatarUrl = profile.value?.avatar_url ?? null;

    if (params.avatarFile) {
      const ext = params.avatarFile.name.split('.').pop() ?? 'jpg';
      const path = `${user.value.id}/avatar-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, params.avatarFile);
      if (uploadError) throw uploadError;

      avatarUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: params.firstName,
        last_name: params.lastName,
        avatar_url: avatarUrl,
      })
      .eq('id', user.value.id);
    if (error) throw error;

    await loadProfile(user.value.id);
  }

  return {
    session,
    user,
    profile,
    ready,
    isAuthenticated,
    isAdmin,
    init,
    signIn,
    signInWithGoogle,
    requestPasswordReset,
    confirmPasswordReset,
    signUp,
    signOut,
    signOutEverywhere,
    changePassword,
    deleteAccount,
    updateProfile,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
