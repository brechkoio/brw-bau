<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Меню"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />

        <q-toolbar-title>BRW-BAU</q-toolbar-title>

        <div v-if="auth.profile" class="q-mr-md">
          {{ auth.profile.first_name }} {{ auth.profile.last_name }}
        </div>

        <q-btn flat dense round icon="logout" aria-label="Вийти" @click="onLogout" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item to="/" exact clickable v-ripple>
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>Головна</q-item-section>
        </q-item>

        <q-item to="/reports/monthly" clickable v-ripple>
          <q-item-section avatar>
            <q-icon name="calendar_month" />
          </q-item-section>
          <q-item-section>Звіт за місяць</q-item-section>
        </q-item>

        <q-item v-if="auth.isAdmin" to="/reports/general" clickable v-ripple>
          <q-item-section avatar>
            <q-icon name="summarize" />
          </q-item-section>
          <q-item-section>Загальний звіт</q-item-section>
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
import { useAuthStore } from '@/stores/auth-store';

const router = useRouter();
const auth = useAuthStore();
const leftDrawerOpen = ref(false);

async function onLogout() {
  await auth.signOut();
  await router.push('/login');
}
</script>
