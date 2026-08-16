<template>
  <q-select
    :model-value="locale"
    :options="locales"
    dense
    borderless
    emit-value
    map-options
    options-dense
    style="min-width: 130px"
    @update:model-value="setLocale"
  />
</template>

<script setup lang="ts">
import { useLocale } from '@/composables/use-locale';

const { locale, setLocale, locales } = useLocale();
</script>
