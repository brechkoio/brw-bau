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
            lazy-rules="ondemand"
            hide-bottom-space
            :rules="[(val) => !!val || t('validation.requiredFirstName')]"
            class="brw-input"
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
            class="brw-input"
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
          class="brw-input"
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
      <q-btn
        type="submit"
        :label="t('auth.register.submit')"
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
      unelevated
      no-caps
      :label="t('auth.register.backToLogin')"
      to="/login"
      class="brw-btn-secondary brw-btn-secondary--lg"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useAuthStore } from '@/stores/auth-store';
import { authErrorMessage } from '@/utils/auth-errors';

const auth = useAuthStore();
const { t } = useI18n();
const $q = useQuasar();
const firstName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const googleLoading = ref(false);
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
    error.value = authErrorMessage(err, t, 'auth.register.errorFallback');
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
