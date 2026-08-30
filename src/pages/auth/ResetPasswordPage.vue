<template>
  <section v-if="!auth.isAuthenticated" class="auth-form-section">
    <h1>{{ t('auth.resetPassword.title') }}</h1>
    <q-banner role="alert" class="auth-error-banner">{{
      t('auth.resetPassword.invalidLink')
    }}</q-banner>
    <q-btn
      unelevated
      no-caps
      :label="t('auth.resetPassword.requestNewLink')"
      to="/forgot-password"
      class="brw-btn-primary brw-btn-primary--cta q-mt-md"
    />
  </section>

  <section v-else class="auth-form-section">
    <h1>{{ t('auth.resetPassword.title') }}</h1>
    <p class="auth-subtitle">{{ t('auth.resetPassword.subtitle') }}</p>
    <q-banner v-if="error" role="alert" class="auth-error-banner">{{ error }}</q-banner>

    <q-form class="auth-form" @submit.prevent="onSubmit">
      <div class="auth-field">
        <label for="reset-password">{{ t('auth.resetPassword.passwordLabel') }}</label>
        <q-input
          for="reset-password"
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="new-password"
          :placeholder="t('auth.placeholders.password')"
          outlined
          autofocus
          :disable="loading"
          lazy-rules
          hide-bottom-space
          :rules="[(val) => (val && val.length >= 6) || t('validation.minPassword')]"
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
      </div>
      <div class="auth-field">
        <label for="reset-password-confirm">{{
          t('auth.resetPassword.confirmPasswordLabel')
        }}</label>
        <q-input
          for="reset-password-confirm"
          v-model="confirmPassword"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="new-password"
          :placeholder="t('auth.placeholders.password')"
          outlined
          :disable="loading"
          lazy-rules
          hide-bottom-space
          :rules="[(val) => val === password || t('validation.passwordsMismatch')]"
          class="brw-input"
        />
      </div>
      <q-btn
        type="submit"
        :label="t('auth.resetPassword.submit')"
        :loading="loading"
        :disable="loading || !canSubmit"
        unelevated
        no-caps
        class="brw-btn-primary brw-btn-primary--cta"
      />
    </q-form>
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

const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const loading = ref(false);
const error = ref('');

const canSubmit = computed(
  () => password.value.length >= 6 && confirmPassword.value === password.value,
);

async function onSubmit() {
  if (loading.value || !canSubmit.value) return;
  loading.value = true;
  error.value = '';
  try {
    await auth.confirmPasswordReset(password.value);
    $q.notify({ type: 'positive', message: t('auth.resetPassword.successMessage') });
    await router.push('/');
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('auth.resetPassword.errorFallback');
  } finally {
    loading.value = false;
  }
}
</script>
