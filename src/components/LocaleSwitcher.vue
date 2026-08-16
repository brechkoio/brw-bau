<template>
  <div class="locale-switcher" :aria-label="t('layout.languageAria')" role="group">
    <q-btn
      v-for="language in locales"
      :key="language.value"
      no-caps
      unelevated
      :label="language.shortLabel"
      :aria-label="language.label"
      class="locale-switcher__button"
      :class="{ 'locale-switcher__button--active': language.value === locale }"
      @click="setLocale(language.value)"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useLocale } from '@/composables/use-locale';

const { t } = useI18n();
const { locale, setLocale, locales } = useLocale();
</script>

<style scoped>
.locale-switcher {
  display: flex;
  gap: 2px;
  padding: 4px;
  border-radius: 99px;
  background: #22272a;
}
.locale-switcher__button {
  min-height: 32px;
  min-width: 0;
  padding: 0 9px;
  border-radius: 99px;
  color: #b9bcbf;
  font-size: 12px;
  font-weight: 600;
}
.locale-switcher__button--active {
  background: #ffcf00;
  color: #161a1d;
}
</style>
