<template>
  <q-page class="q-pa-md">
    <div class="text-h6">
      {{
        auth.profile
          ? t('home.welcomeNamed', { name: auth.profile.first_name })
          : t('home.welcomeGeneric')
      }}
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth-store';

const auth = useAuthStore();
const { t } = useI18n();
</script>
