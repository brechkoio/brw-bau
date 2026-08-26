<template>
  <q-page class="q-pa-md">
    <q-banner class="bg-grey-2">
      {{ t('reports.general.placeholder') }}
    </q-banner>
  </q-page>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
