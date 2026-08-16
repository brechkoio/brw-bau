<template>
  <q-page class="q-pa-md">
    <div class="text-h6">
      Ласкаво просимо{{ auth.profile ? `, ${auth.profile.first_name}` : '' }}!
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth-store';

const auth = useAuthStore();
</script>
