<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-black">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          :aria-label="t('layout.menuAria')"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />

        <q-toolbar-title>
          <span class="text-weight-bold text-accent">BRW</span>
          <span class="text-weight-regular"> Bau</span>
        </q-toolbar-title>

        <LocaleSwitcher />

        <span v-if="auth.profile" class="q-mx-md">
          {{ auth.profile.last_name }} {{ auth.profile.first_name }}
        </span>

        <q-btn
          flat
          dense
          round
          icon="logout"
          :aria-label="t('layout.logoutAria')"
          @click="onLogout"
        />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <div class="column fit">
        <q-scroll-area class="col">
          <q-list>
            <q-item to="/" exact clickable v-ripple active-class="text-accent">
              <q-item-section avatar>
                <q-icon name="home" />
              </q-item-section>
              <q-item-section>{{ t('layout.navHome') }}</q-item-section>
            </q-item>

            <q-item to="/reports/monthly" clickable v-ripple active-class="text-accent">
              <q-item-section avatar>
                <q-icon name="calendar_month" />
              </q-item-section>
              <q-item-section>{{ t('layout.navMonthlyReport') }}</q-item-section>
            </q-item>

            <q-item
              v-if="auth.isAdmin"
              to="/reports/general"
              clickable
              v-ripple
              active-class="text-accent"
            >
              <q-item-section avatar>
                <q-icon name="summarize" />
              </q-item-section>
              <q-item-section>{{ t('layout.navGeneralReport') }}</q-item-section>
            </q-item>

            <q-item
              v-if="auth.isAdmin"
              to="/admin/rates"
              clickable
              v-ripple
              active-class="text-accent"
            >
              <q-item-section avatar>
                <q-icon name="payments" />
              </q-item-section>
              <q-item-section>{{ t('layout.navEmployeeRates') }}</q-item-section>
            </q-item>

            <q-item
              v-if="auth.isAdmin"
              to="/admin/sites"
              clickable
              v-ripple
              active-class="text-accent"
            >
              <q-item-section avatar>
                <q-icon name="location_city" />
              </q-item-section>
              <q-item-section>{{ t('layout.navSites') }}</q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>

        <q-separator />
        <q-list>
          <q-item to="/settings" clickable v-ripple active-class="text-accent">
            <q-item-section avatar>
              <q-icon name="settings" />
            </q-item-section>
            <q-item-section>{{ t('layout.navSettings') }}</q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth-store';
import LocaleSwitcher from '@/components/LocaleSwitcher.vue';

const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();
const leftDrawerOpen = ref(false);

async function onLogout() {
  await auth.signOut();
  await router.push('/login');
}
</script>

<style lang="scss" scoped>
.q-drawer :deep(.q-item:hover) {
  color: $accent;
}
</style>
