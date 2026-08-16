<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">Звіт за місяць</div>

    <q-select
      v-model="month"
      :options="monthOptions"
      label="Місяць"
      style="max-width: 250px"
      class="q-mb-md"
    />

    <q-banner class="bg-grey-2">
      Розрахунок годин і зарплати за обраний місяць з'явиться після впровадження Етапу 9 (розрахунки
      зарплати та страхових внесків).
    </q-banner>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const monthNames = [
  'Січень',
  'Лютий',
  'Березень',
  'Квітень',
  'Травень',
  'Червень',
  'Липень',
  'Серпень',
  'Вересень',
  'Жовтень',
  'Листопад',
  'Грудень',
];

const now = new Date();
const monthOptions = monthNames.map((label, i) => ({
  label: `${label} ${now.getFullYear()}`,
  value: `${now.getFullYear()}-${String(i + 1).padStart(2, '0')}`,
}));

const month = ref(monthOptions[now.getMonth()]);
</script>
