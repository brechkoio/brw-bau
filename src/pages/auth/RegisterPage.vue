<template>
  <q-form v-if="!submitted" class="column q-gutter-md" @submit.prevent="onSubmit">
    <q-input
      v-model="firstName"
      :label="t('auth.register.firstNameLabel')"
      outlined
      :rules="[(val) => !!val || t('validation.requiredFirstName')]"
      lazy-rules
    />

    <q-input
      v-model="lastName"
      :label="t('auth.register.lastNameLabel')"
      outlined
      :rules="[(val) => !!val || t('validation.requiredLastName')]"
      lazy-rules
    />

    <q-input
      v-model="email"
      type="email"
      :label="t('auth.register.emailLabel')"
      autocomplete="email"
      outlined
      :rules="[(val) => !!val || t('validation.requiredEmail')]"
      lazy-rules
    />

    <q-input
      v-model="password"
      :type="showPassword ? 'text' : 'password'"
      :label="t('auth.register.passwordLabel')"
      autocomplete="new-password"
      outlined
      :hint="t('auth.register.passwordHint')"
      :rules="[(val) => (val && val.length >= 6) || t('validation.minPassword')]"
      lazy-rules
    >
      <template #append>
        <q-icon
          :name="showPassword ? 'visibility_off' : 'visibility'"
          class="cursor-pointer"
          @click="showPassword = !showPassword"
        />
      </template>
    </q-input>

    <q-btn
      type="submit"
      color="accent"
      text-color="black"
      :label="t('auth.register.submit')"
      :loading="loading"
      unelevated
      no-caps
      class="text-weight-bold"
    />

    <div class="text-center text-caption">
      {{ t('auth.register.haveAccount') }}
      <router-link to="/login">{{ t('auth.register.loginLink') }}</router-link>
    </div>
  </q-form>

  <div v-else class="column q-gutter-md text-center">
    <q-icon name="mark_email_read" size="48px" color="accent" class="q-mx-auto" />
    <i18n-t keypath="auth.register.confirmationSent" tag="div">
      <template #email>
        <strong>{{ email }}</strong>
      </template>
    </i18n-t>
    <q-btn flat color="accent" :label="t('auth.register.backToLogin')" to="/login" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth-store';

const $q = useQuasar();
const auth = useAuthStore();
const { t } = useI18n();

const firstName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const submitted = ref(false);

async function onSubmit() {
  loading.value = true;
  try {
    await auth.signUp({
      email: email.value,
      password: password.value,
      firstName: firstName.value,
      lastName: lastName.value,
    });
    submitted.value = true;
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('auth.register.errorFallback'),
    });
  } finally {
    loading.value = false;
  }
}
</script>
