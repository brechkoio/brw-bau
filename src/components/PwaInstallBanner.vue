<template>
  <div v-if="showBanner" class="pwa-install" role="dialog" :aria-label="t('pwa.bannerAria')">
    <img :src="logo" alt="" class="pwa-install__logo" width="40" height="40" />
    <div class="pwa-install__copy">
      <div class="pwa-install__title">{{ t('pwa.title') }}</div>
      <div class="pwa-install__text">
        {{ iosSafari ? t('pwa.iosHint') : t('pwa.androidHint') }}
      </div>
    </div>
    <q-btn
      v-if="canNativeInstall"
      unelevated
      no-caps
      color="accent"
      text-color="black"
      class="pwa-install__cta"
      :label="t('pwa.install')"
      @click="onInstall"
    />
    <q-btn
      flat
      round
      dense
      icon="close"
      class="pwa-install__close"
      :aria-label="t('pwa.dismissAria')"
      @click="dismiss"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { usePwaInstall } from '@/composables/use-pwa-install';
import logo from '@/assets/logo.png';

const { t } = useI18n();
const { showBanner, canNativeInstall, iosSafari, install, dismiss } = usePwaInstall();

async function onInstall() {
  await install();
}
</script>

<style lang="scss" scoped>
.pwa-install {
  position: fixed;
  z-index: 7000;
  right: 12px;
  bottom: calc(12px + env(safe-area-inset-bottom));
  left: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 480px;
  margin: 0 auto;
  padding: 12px 8px 12px 12px;
  border-radius: 12px;
  background: $dark;
  color: #fff;
}
.pwa-install__logo {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 8px;
}
.pwa-install__copy {
  min-width: 0;
  flex: 1;
}
.pwa-install__title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
}
.pwa-install__text {
  margin-top: 2px;
  color: #c8ccce;
  font-size: 12px;
  line-height: 1.35;
}
.pwa-install__cta {
  flex-shrink: 0;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  font-weight: 600;
}
.pwa-install__close {
  color: #8b9195;
}
</style>
