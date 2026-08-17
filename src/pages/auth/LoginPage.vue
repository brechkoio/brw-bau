<template>
  <section class="auth-form-section">
    <h1>{{ t('auth.login.title') }}</h1>
    <p class="auth-subtitle">{{ t('auth.login.subtitle') }}</p>

    <q-banner v-if="error" role="alert" class="auth-error-banner">{{ error }}</q-banner>
    <q-banner v-if="notice" role="status" class="auth-notice-banner">{{ notice }}</q-banner>

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
          lazy-rules
          hide-bottom-space
          :rules="[(val) => !!val || t('validation.requiredEmail')]"
          class="auth-input"
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
          class="auth-input"
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
          <a href="#" @click.prevent="showForgotPassword">{{ t('auth.login.forgotPassword') }}</a>
        </div>
      </div>
      <q-btn
        type="submit"
        :label="t('auth.login.submit')"
        :loading="loading"
        :disable="loading || !canSubmit"
        unelevated
        no-caps
        class="auth-submit"
      />
    </q-form>

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

const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();
const $q = useQuasar();
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const error = ref('');
const notice = ref('');

const canSubmit = computed(() => !!email.value && !!password.value);
const autofocusFirst = computed(() => $q.screen.gt.xs);

function showForgotPassword() {
  error.value = '';
  notice.value = t('auth.login.forgotPasswordNotice');
}
async function onSubmit() {
  if (loading.value) return;
  loading.value = true;
  error.value = '';
  notice.value = '';
  try {
    await auth.signIn(email.value, password.value);
    await router.push('/');
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('auth.login.errorFallback');
  } finally {
    loading.value = false;
  }
}
</script>
