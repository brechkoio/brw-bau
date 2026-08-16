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

        <q-avatar size="32px" class="q-mr-sm">
          <img :src="logo" alt="BRW-BAU" />
        </q-avatar>
        <q-toolbar-title>BRW-BAU</q-toolbar-title>

        <LocaleSwitcher class="q-mr-md" />

        <div v-if="auth.profile" class="row items-center q-gutter-sm q-mr-md">
          <span>{{ auth.profile.first_name }} {{ auth.profile.last_name }}</span>
          <q-avatar size="32px">
            <img v-if="auth.profile.avatar_url" :src="auth.profile.avatar_url" />
            <q-icon v-else name="person" />
          </q-avatar>
        </div>

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
      <q-list>
        <q-item to="/" exact clickable v-ripple>
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>{{ t('layout.navHome') }}</q-item-section>
        </q-item>

        <q-item to="/settings" clickable v-ripple>
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
          <q-item-section>{{ t('layout.navSettings') }}</q-item-section>
        </q-item>

        <q-item to="/reports/monthly" clickable v-ripple>
          <q-item-section avatar>
            <q-icon name="calendar_month" />
          </q-item-section>
          <q-item-section>{{ t('layout.navMonthlyReport') }}</q-item-section>
        </q-item>

        <q-item v-if="auth.isAdmin" to="/reports/general" clickable v-ripple>
          <q-item-section avatar>
            <q-icon name="summarize" />
          </q-item-section>
          <q-item-section>{{ t('layout.navGeneralReport') }}</q-item-section>
        </q-item>

        <q-item v-if="auth.isAdmin" to="/admin/rates" clickable v-ripple>
          <q-item-section avatar>
            <q-icon name="payments" />
          </q-item-section>
          <q-item-section>{{ t('layout.navEmployeeRates') }}</q-item-section>
        </q-item>
      </q-list>
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
import logo from '@/assets/logo.png';
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
