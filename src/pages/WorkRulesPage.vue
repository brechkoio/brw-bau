<template>
  <q-page class="q-pa-md flex justify-center">
    <q-card class="brw-card brw-rules-card" flat bordered>
      <q-card-section>
        <div class="brw-rules-content" v-html="renderedHtml" />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

import ukRules from '@/content/work-rules/uk.md?raw';
import ruRules from '@/content/work-rules/ru.md?raw';
import deRules from '@/content/work-rules/de.md?raw';
import enUSRules from '@/content/work-rules/en-US.md?raw';

// Static, admin-maintained content: whoever owns the rules edits the .md
// files directly (no DB table, no edit UI) — see the "work rules page"
// discussion for why this stays simple instead of DB-backed like the rest
// of the app's editable data.
const rulesByLocale: Record<string, string> = {
  uk: ukRules,
  ru: ruRules,
  de: deRules,
  'en-US': enUSRules,
};

const { locale } = useI18n();

const renderedHtml = computed(() => {
  const source = rulesByLocale[locale.value] ?? rulesByLocale.uk ?? '';
  return DOMPurify.sanitize(marked.parse(source, { async: false }));
});
</script>

<style lang="scss" scoped>
.brw-rules-card {
  max-width: 860px;
  width: 100%;
}

.brw-rules-content {
  :deep(h1) {
    font-size: 22px;
    margin: 0 0 16px;
  }

  :deep(h2) {
    font-size: 18px;
    margin: 24px 0 12px;
  }

  :deep(p) {
    margin: 0 0 12px;
    line-height: 1.6;
  }

  :deep(ul),
  :deep(ol) {
    margin: 0 0 12px;
    padding-left: 24px;
    line-height: 1.6;
  }
}
</style>
