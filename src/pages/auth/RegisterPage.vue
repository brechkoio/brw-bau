<template>
  <section v-if="!submitted" class="auth-form-section">
    <h1>{{ t('auth.register.title') }}</h1>
    <p class="auth-subtitle">{{ t('auth.register.subtitle') }}</p>
    <q-banner v-if="error" role="alert" class="auth-error-banner">{{ error }}</q-banner>

    <q-form class="auth-form" @submit.prevent="onSubmit">
      <div class="auth-name-row">
        <div class="auth-field">
          <label for="register-first-name">{{ t('auth.register.firstNameLabel') }}</label
          ><q-input
            for="register-first-name"
            v-model="firstName"
            outlined
            autocomplete="given-name"
            :autofocus="autofocusFirst"
            :placeholder="t('auth.placeholders.firstName')"
            :disable="loading"
            lazy-rules
            hide-bottom-space
            :rules="[(val) => !!val || t('validation.requiredFirstName')]"
            class="auth-input"
          />
        </div>
        <div class="auth-field">
          <label for="register-last-name">{{ t('auth.register.lastNameLabel') }}</label
          ><q-input
            for="register-last-name"
            v-model="lastName"
            outlined
            autocomplete="family-name"
            :placeholder="t('auth.placeholders.lastName')"
            :disable="loading"
            lazy-rules
            hide-bottom-space
            :rules="[(val) => !!val || t('validation.requiredLastName')]"
            class="auth-input"
          />
        </div>
      </div>
      <div class="auth-field">
        <label for="register-email">{{ t('auth.register.emailLabel') }}</label
        ><q-input
          for="register-email"
          v-model="email"
          type="email"
          autocomplete="email"
          outlined
          :placeholder="t('auth.placeholders.email')"
          :disable="loading"
          lazy-rules
          hide-bottom-space
          :rules="[(val) => !!val || t('validation.requiredEmail')]"
          class="auth-input"
        />
      </div>
      <div class="auth-field">
        <label for="register-password">{{ t('auth.register.passwordLabel') }}</label>
        <q-input
          for="register-password"
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="new-password"
          outlined
          :placeholder="t('auth.placeholders.password')"
          :disable="loading"
          lazy-rules
          :hint="t('auth.register.passwordHint')"
          :rules="[(val) => (val && val.length >= 6) || t('validation.minPassword')]"
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
      </div>
      <q-btn
        type="submit"
        :label="t('auth.register.submit')"
        :loading="loading"
        :disable="loading || !canSubmit"
        unelevated
        no-caps
        class="auth-submit"
      />
    </q-form>
    <p class="auth-switch">
      {{ t('auth.register.haveAccount') }}
      <router-link to="/login">{{ t('auth.register.loginLink') }}</router-link>
    </p>
  </section>

  <section v-else class="auth-success">
    <div class="auth-success__icon"><q-icon name="mark_email_read" size="48px" /></div>
    <h1>{{ t('auth.register.successTitle') }}</h1>
    <p>
      <i18n-t keypath="auth.register.confirmationSent"
        ><template #email
          ><strong>{{ email }}</strong></template
        ></i18n-t
      >
    </p>
    <q-btn
      outline
      no-caps
      :label="t('auth.register.backToLogin')"
      to="/login"
      class="auth-secondary-btn"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useAuthStore } from '@/stores/auth-store';

const auth = useAuthStore();
const { t } = useI18n();
const $q = useQuasar();
const firstName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const submitted = ref(false);
const error = ref('');

const canSubmit = computed(
  () => !!firstName.value && !!lastName.value && !!email.value && password.value.length >= 6,
);
const autofocusFirst = computed(() => $q.screen.gt.xs);

async function onSubmit() {
  if (loading.value) return;
  loading.value = true;
  error.value = '';
  try {
    await auth.signUp({
      email: email.value,
      password: password.value,
      firstName: firstName.value,
      lastName: lastName.value,
    });
    submitted.value = true;
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('auth.register.errorFallback');
  } finally {
    loading.value = false;
  }
}
</script>
