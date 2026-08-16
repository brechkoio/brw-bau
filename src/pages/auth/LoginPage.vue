<template>
  <q-form class="column q-gutter-md" @submit.prevent="onSubmit">
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
      autocomplete="current-password"
      :rules="[(val) => !!val || 'Введіть пароль']"
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
      color="primary"
      text-color="black"
      label="Увійти"
      :loading="loading"
      unelevated
      no-caps
      rounded
      class="text-weight-bold"
    />

    <div class="text-center text-caption">
      Немає акаунту?
      <router-link to="/register">Зареєструватися</router-link>
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from '@/stores/auth-store';

const router = useRouter();
const $q = useQuasar();
const auth = useAuthStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);

async function onSubmit() {
  loading.value = true;
  try {
    await auth.signIn(email.value, password.value);
    await router.push('/');
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Не вдалося увійти',
    });
  } finally {
    loading.value = false;
  }
}
</script>
