<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">{{ t('reports.monthly.title') }}</div>

    <q-select
      v-model="month"
      :options="monthOptions"
      :label="t('reports.monthly.monthLabel')"
      style="max-width: 250px"
      class="q-mb-md"
    />

    <q-banner class="bg-grey-2">
      {{ t('reports.monthly.placeholder') }}
    </q-banner>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const i18n = useI18n();
const { t } = i18n;

const now = new Date();
const monthOptions = computed(() => {
  const monthNames = i18n.tm('months');
  return monthNames.map((label, i) => ({
    label: `${label} ${now.getFullYear()}`,
    value: `${now.getFullYear()}-${String(i + 1).padStart(2, '0')}`,
  }));
});

const month = ref(monthOptions.value[now.getMonth()]);
</script>
