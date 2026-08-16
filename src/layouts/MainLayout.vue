<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>Salary Calc</q-toolbar-title>

        <div v-if="auth.profile" class="q-mr-md">
          {{ auth.profile.first_name }} {{ auth.profile.last_name }}
        </div>

        <q-btn flat dense round icon="logout" aria-label="Вийти" @click="onLogout" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth-store';

const router = useRouter();
const auth = useAuthStore();

async function onLogout() {
  await auth.signOut();
  await router.push('/login');
}
</script>
