<template>
  <section v-if="!submitted" class="auth-form-section">
    <h1>{{ t('auth.forgotPassword.title') }}</h1>
    <p class="auth-subtitle">{{ t('auth.forgotPassword.subtitle') }}</p>
    <q-banner v-if="error" role="alert" class="auth-error-banner">{{ error }}</q-banner>

    <q-form class="auth-form" @submit.prevent="onSubmit">
      <div class="auth-field">
        <label for="forgot-email">{{ t('auth.forgotPassword.emailLabel') }}</label>
        <q-input
          for="forgot-email"
          v-model="email"
          type="email"
          autocomplete="email"
          :placeholder="t('auth.placeholders.email')"
          outlined
          autofocus
          :disable="loading"
          lazy-rules="ondemand"
          hide-bottom-space
          :rules="[(val) => !!val || t('validation.requiredEmail')]"
          class="brw-input"
        />
      </div>
      <q-btn
        type="submit"
        :label="t('auth.forgotPassword.submit')"
        :loading="loading"
        :disable="loading || !email"
        unelevated
        no-caps
        class="brw-btn-primary brw-btn-primary--cta"
      />
    </q-form>

    <p class="auth-switch">
      <router-link to="/login">{{ t('auth.forgotPassword.backToLogin') }}</router-link>
    </p>
  </section>

  <section v-else class="auth-success">
    <div class="auth-success__icon"><q-icon name="mark_email_read" size="48px" /></div>
    <h1>{{ t('auth.forgotPassword.successTitle') }}</h1>
    <p>
      <i18n-t keypath="auth.forgotPassword.confirmationSent"
        ><template #email
          ><strong>{{ email }}</strong></template
        ></i18n-t
      >
    </p>
    <q-btn
      unelevated
      no-caps
      :label="t('auth.forgotPassword.backToLogin')"
      to="/login"
      class="brw-btn-secondary brw-btn-secondary--lg"
    />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth-store';
import { authErrorMessage } from '@/utils/auth-errors';

const auth = useAuthStore();
const { t } = useI18n();
const email = ref('');
const loading = ref(false);
const submitted = ref(false);
const error = ref('');

async function onSubmit() {
  if (loading.value || !email.value) return;
  loading.value = true;
  error.value = '';
  try {
    await auth.requestPasswordReset(email.value.trim());
    submitted.value = true;
  } catch (err) {
    error.value = authErrorMessage(err, t, 'auth.forgotPassword.errorFallback');
  } finally {
    loading.value = false;
  }
}
</script>
