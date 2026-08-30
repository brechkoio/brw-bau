<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="auth-page brw-dark">
        <main class="auth-shell">
          <header class="auth-brand-row">
            <div class="auth-brand">
              <img :src="logo" alt="BRW Bau" class="auth-brand-logo" />
              <span><strong>BRW</strong> Bau</span>
            </div>
            <LocaleSwitcher />
          </header>

          <q-card class="auth-card" flat>
            <nav v-if="showTabs" class="auth-tabs" :aria-label="t('auth.tabsAria')">
              <q-btn
                to="/login"
                no-caps
                unelevated
                :label="t('auth.tabLogin')"
                class="auth-tab"
                :class="{ 'auth-tab--active': route.path === '/login' }"
                :aria-current="route.path === '/login' ? 'page' : undefined"
              />
              <q-btn
                to="/register"
                no-caps
                unelevated
                :label="t('auth.tabRegister')"
                class="auth-tab"
                :class="{ 'auth-tab--active': route.path === '/register' }"
                :aria-current="route.path === '/register' ? 'page' : undefined"
              />
            </nav>
            <router-view />
          </q-card>

          <footer class="auth-footer">{{ t('auth.footerNote') }}</footer>
        </main>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import logo from '@/assets/logo.png';
import LocaleSwitcher from '@/components/LocaleSwitcher.vue';

const route = useRoute();
const { t } = useI18n();
const showTabs = computed(() => route.path === '/login' || route.path === '/register');
</script>

<style scoped lang="scss">
.auth-page {
  min-height: 100dvh;
  padding: 24px 16px;
}
.auth-shell {
  width: 100%;
  max-width: 420px;
  margin: auto;
}
.auth-brand-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}
.auth-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
  font-size: 19px;
  white-space: nowrap;
}
.auth-brand strong {
  color: $accent;
  font-weight: 700;
}
.auth-brand-logo {
  display: block;
  width: 38px;
  height: 38px;
  border-radius: 9px;
}
.auth-card {
  padding: 26px 26px 22px;
  border: 0;
  border-radius: 18px;
  background: white;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);
}
.auth-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 12px;
  background: $secondary;
}
.auth-tab {
  flex: 1;
  min-height: 44px;
  border-radius: 9px;
  color: $dark;
  font-size: 14px;
  font-weight: 400;
}
.auth-tab--active {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.14);
  font-weight: 600;
}
.auth-footer {
  margin-top: 16px;
  color: $drawer-muted;
  font-size: 12px;
  text-align: center;
}
@media (min-width: 600px) {
  .auth-page {
    display: flex;
    align-items: center;
  }
}
@media (max-width: 599px) {
  .auth-page {
    padding: 32px 16px calc(20px + env(safe-area-inset-bottom));
  }
  .auth-card {
    padding: 20px;
    border-radius: 16px;
  }
}
</style>
