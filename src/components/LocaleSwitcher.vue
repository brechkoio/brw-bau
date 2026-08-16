<template>
  <q-btn flat dense round icon="language" color="dark" :aria-label="t('layout.languageAria')">
    <q-menu>
      <q-list>
        <q-item
          v-for="l in locales"
          :key="l.value"
          clickable
          v-close-popup
          :active="l.value === locale"
          @click="setLocale(l.value)"
        >
          <q-item-section>{{ l.label }}</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useLocale } from '@/composables/use-locale';

const { t } = useI18n();
const { locale, setLocale, locales } = useLocale();
</script>
