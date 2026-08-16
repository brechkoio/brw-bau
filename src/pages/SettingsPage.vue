<template>
  <q-page class="q-pa-md flex flex-center">
    <q-card style="width: 100%; max-width: 480px">
      <q-card-section class="column items-center q-gutter-sm">
        <div class="text-h6">Налаштування профілю</div>

        <q-avatar size="100px">
          <img v-if="avatarPreview" :src="avatarPreview" />
          <q-icon v-else name="person" size="60px" />
        </q-avatar>

        <q-btn flat dense label="Змінити аватар" color="primary" @click="fileInput?.pickFiles()" />
        <q-file
          ref="fileInput"
          v-model="avatarFile"
          accept="image/*"
          class="hidden"
          @update:model-value="onAvatarSelected"
        />
      </q-card-section>

      <q-card-section>
        <q-form class="column q-gutter-md" @submit.prevent="onSave">
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

          <q-btn type="submit" color="primary" label="Зберегти" :loading="saving" unelevated />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue';
import { useQuasar, type QFile } from 'quasar';
import { useAuthStore } from '@/stores/auth-store';

const $q = useQuasar();
const auth = useAuthStore();

const firstName = ref(auth.profile?.first_name ?? '');
const lastName = ref(auth.profile?.last_name ?? '');
const avatarFile = ref<File | null>(null);
const avatarPreview = ref<string | null>(auth.profile?.avatar_url ?? null);
const saving = ref(false);
const fileInput = ref<QFile | null>(null);

let objectUrl: string | null = null;

function onAvatarSelected(file: File | null) {
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  if (file) {
    objectUrl = URL.createObjectURL(file);
    avatarPreview.value = objectUrl;
  }
}

onBeforeUnmount(() => {
  if (objectUrl) URL.revokeObjectURL(objectUrl);
});

async function onSave() {
  saving.value = true;
  try {
    await auth.updateProfile({
      firstName: firstName.value,
      lastName: lastName.value,
      avatarFile: avatarFile.value,
    });
    avatarFile.value = null;
    $q.notify({ type: 'positive', message: 'Профіль оновлено' });
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Не вдалося зберегти зміни',
    });
  } finally {
    saving.value = false;
  }
}
</script>
