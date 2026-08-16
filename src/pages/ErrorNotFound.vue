<template>
  <div class="fullscreen brw-dark text-center q-pa-md flex flex-center">
    <div>
      <div style="font-size: 30vh">404</div>

      <div class="text-h4" style="opacity: 0.7">{{ t('errors.notFound.title') }}</div>

      <q-btn
        class="q-mt-xl text-weight-bold"
        color="accent"
        text-color="black"
        unelevated
        to="/"
        :label="t('errors.notFound.backHome')"
        no-caps
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
