<template>
  <q-page class="q-pa-md flex flex-center">
    <q-card style="width: 100%; max-width: 480px">
      <q-card-section class="column items-center q-gutter-sm">
        <div class="text-h6">{{ t('settings.title') }}</div>

        <q-avatar size="100px">
          <img v-if="avatarPreview" :src="avatarPreview" />
          <q-icon v-else name="person" size="60px" />
        </q-avatar>

        <q-btn
          flat
          dense
          :label="t('settings.changeAvatar')"
          color="accent"
          @click="fileInput?.pickFiles()"
        />
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
            :label="t('settings.firstNameLabel')"
            outlined
            :rules="[(val) => !!val || t('validation.requiredFirstName')]"
            lazy-rules
          />

          <q-input
            v-model="lastName"
            :label="t('settings.lastNameLabel')"
            outlined
            :rules="[(val) => !!val || t('validation.requiredLastName')]"
            lazy-rules
          />

          <q-btn
            type="submit"
            color="accent"
            text-color="black"
            :label="t('settings.submit')"
            :loading="saving"
            unelevated
            no-caps
            class="text-weight-bold"
          />
        </q-form>
      </q-card-section>

      <q-card-section v-if="showSettingsAction">
        <q-btn
          unelevated
          no-caps
          color="accent"
          text-color="black"
          icon="install_mobile"
          class="full-width text-weight-bold"
          :label="t('settings.installApp')"
          @click="onInstallApp"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue';
import { useQuasar, type QFile } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth-store';
import { usePwaInstall } from '@/composables/use-pwa-install';

const $q = useQuasar();
const auth = useAuthStore();
const { t } = useI18n();
const { showSettingsAction, canNativeInstall, install } = usePwaInstall();

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

async function onInstallApp() {
  if (canNativeInstall.value) {
    await install();
    return;
  }
  $q.dialog({
    title: t('settings.iosInstallTitle'),
    message: t('pwa.iosHint'),
    ok: t('common.confirm'),
  });
}

async function onSave() {
  saving.value = true;
  try {
    await auth.updateProfile({
      firstName: firstName.value,
      lastName: lastName.value,
      avatarFile: avatarFile.value,
    });
    avatarFile.value = null;
    $q.notify({ type: 'positive', message: t('settings.successMessage') });
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('settings.errorFallback'),
    });
  } finally {
    saving.value = false;
  }
}
</script>
