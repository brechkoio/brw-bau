<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="row items-center justify-center q-pa-md brw-dark">
        <q-card class="auth-card" flat bordered>
          <q-card-section class="text-center">
            <img :src="logo" alt="BRW-BAU" class="auth-logo" />
          </q-card-section>

          <q-card-section>
            <router-view />
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import logo from '@/assets/logo.png';
</script>

<style scoped>
.auth-card {
  width: 100%;
  max-width: 400px;
  background: white;
}

.auth-logo {
  width: 96px;
  height: 96px;
}
</style>
