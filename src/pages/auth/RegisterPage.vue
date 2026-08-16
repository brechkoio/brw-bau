<template>
  <q-form v-if="!submitted" class="column q-gutter-md" @submit.prevent="onSubmit">
    <q-input
      v-model="firstName"
      label="Ім'я"
      :rules="[(val) => !!val || 'Введіть ім\'я']"
      lazy-rules
    />

    <q-input
      v-model="lastName"
      label="Прізвище"
      :rules="[(val) => !!val || 'Введіть прізвище']"
      lazy-rules
    />

    <q-input
      v-model="email"
      type="email"
      label="Email"
      autocomplete="email"
      :rules="[(val) => !!val || 'Введіть email']"
      lazy-rules
    />

    <q-input
      v-model="password"
      :type="showPassword ? 'text' : 'password'"
      label="Пароль"
      autocomplete="new-password"
      hint="Щонайменше 6 символів"
      :rules="[(val) => (val && val.length >= 6) || 'Мінімум 6 символів']"
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

    <q-btn type="submit" color="primary" label="Зареєструватися" :loading="loading" unelevated />

    <div class="text-center text-caption">
      Вже є акаунт?
      <router-link to="/login">Увійти</router-link>
    </div>
  </q-form>

  <div v-else class="column q-gutter-md text-center">
    <q-icon name="mark_email_read" size="48px" color="primary" class="q-mx-auto" />
    <div>
      Лист із підтвердженням надіслано на <strong>{{ email }}</strong
      >. Перейдіть за посиланням у листі, щоб активувати акаунт.
    </div>
    <q-btn flat color="primary" label="До входу" to="/login" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from '@/stores/auth-store';

const $q = useQuasar();
const auth = useAuthStore();

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
      message: err instanceof Error ? err.message : 'Не вдалося зареєструватися',
    });
  } finally {
    loading.value = false;
  }
}
</script>
