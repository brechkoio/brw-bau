<template>
  <section class="auth-form-section">
    <h1>{{ t('auth.login.title') }}</h1>
    <p class="auth-subtitle">{{ t('auth.login.subtitle') }}</p>

    <q-banner v-if="error" role="alert" class="auth-error-banner">{{ error }}</q-banner>

    <q-form class="auth-form" @submit.prevent="onSubmit">
      <div class="auth-field">
        <label for="login-email">{{ t('auth.login.emailLabel') }}</label>
        <q-input
          for="login-email"
          v-model="email"
          type="email"
          autocomplete="email"
          :placeholder="t('auth.placeholders.email')"
          outlined
          :autofocus="autofocusFirst"
          :disable="loading"
          lazy-rules="ondemand"
          hide-bottom-space
          :rules="[(val) => !!val || t('validation.requiredEmail')]"
          class="brw-input"
        />
      </div>
      <div class="auth-field">
        <label for="login-password">{{ t('auth.login.passwordLabel') }}</label>
        <q-input
          for="login-password"
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="current-password"
          :placeholder="t('auth.placeholders.password')"
          outlined
          :disable="loading"
          lazy-rules
          hide-bottom-space
          :rules="[(val) => !!val || t('validation.requiredPassword')]"
          class="brw-input"
        >
          <template #append
            ><q-btn
              flat
              round
              dense
              :icon="showPassword ? 'visibility_off' : 'visibility'"
              :aria-label="t('auth.passwordToggleAria')"
              :disable="loading"
              @click="showPassword = !showPassword"
          /></template>
        </q-input>
        <div class="auth-forgot">
          <router-link to="/forgot-password">{{ t('auth.login.forgotPassword') }}</router-link>
        </div>
      </div>
      <q-btn
        type="submit"
        :label="t('auth.login.submit')"
        :loading="loading"
        :disable="loading || googleLoading || !canSubmit"
        unelevated
        no-caps
        class="brw-btn-primary brw-btn-primary--cta"
      />
    </q-form>

    <div class="auth-divider">{{ t('auth.googleDivider') }}</div>

    <q-btn
      no-caps
      unelevated
      class="brw-btn-google"
      :loading="googleLoading"
      :disable="loading || googleLoading"
      @click="onGoogleSignIn"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        />
        <path
          fill="#FBBC05"
          d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58Z"
        />
      </svg>
      <span>{{ t('auth.googleButton') }}</span>
    </q-btn>

    <p class="auth-switch">
      {{ t('auth.login.noAccount') }}
      <router-link to="/register">{{ t('auth.login.registerLink') }}</router-link>
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useAuthStore } from '@/stores/auth-store';
import { authErrorMessage } from '@/utils/auth-errors';

const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();
const $q = useQuasar();
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const googleLoading = ref(false);
const error = ref('');

const canSubmit = computed(() => !!email.value && !!password.value);
const autofocusFirst = computed(() => $q.screen.gt.xs);

async function onSubmit() {
  if (loading.value) return;
  loading.value = true;
  error.value = '';
  try {
    await auth.signIn(email.value.trim(), password.value.trim());
    await router.push('/');
  } catch (err) {
    error.value = authErrorMessage(err, t, 'auth.login.errorFallback');
  } finally {
    loading.value = false;
  }
}

async function onGoogleSignIn() {
  if (googleLoading.value) return;
  googleLoading.value = true;
  error.value = '';
  try {
    await auth.signInWithGoogle();
  } catch (err) {
    error.value = authErrorMessage(err, t, 'auth.googleErrorFallback');
    googleLoading.value = false;
  }
}
</script>
