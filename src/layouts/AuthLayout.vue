<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="row items-center justify-center q-pa-md">
        <q-card class="auth-card" flat bordered>
          <q-card-section class="text-center">
            <div class="text-h5">Salary Calc</div>
          </q-card-section>

          <q-card-section>
            <router-view />
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<style scoped>
.auth-card {
  width: 100%;
  max-width: 400px;
}
</style>
