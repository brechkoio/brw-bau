import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref, computed } from 'vue';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/boot/supabase';

interface Profile {
  first_name: string;
  last_name: string;
  role: 'admin' | 'user';
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
      .select('first_name, last_name, role')
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

      supabase.auth.onAuthStateChange((_event, newSession) => {
        void applySession(newSession);
      });

      ready.value = true;
    })();

    return initPromise;
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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

  return {
    session,
    user,
    profile,
    ready,
    isAuthenticated,
    isAdmin,
    init,
    signIn,
    signUp,
    signOut,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
