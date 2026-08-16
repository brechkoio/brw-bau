<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">
      {{
        auth.profile
          ? t('home.welcomeNamed', { name: auth.profile.first_name })
          : t('home.welcomeGeneric')
      }}
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-sm-6 col-md-4">
        <q-card class="brw-card q-pa-md" flat bordered>
          <div class="row items-center q-gutter-sm text-grey-8">
            <q-icon name="schedule" size="20px" />
            <div class="text-body2">{{ t('home.totalHoursLabel') }}</div>
          </div>
          <div class="text-h4 text-weight-bold q-mt-sm">{{ formattedHours }}</div>
          <div class="text-caption text-grey-7">
            {{ t('home.daysApprox', { days: daysApprox }) }}
          </div>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-4">
        <q-card class="brw-card q-pa-md" flat bordered>
          <div class="row items-center q-gutter-sm text-grey-8">
            <q-icon name="payments" size="20px" />
            <div class="text-body2">{{ t('home.expectedSalaryLabel') }}</div>
          </div>
          <div class="text-h4 text-weight-bold q-mt-sm">{{ formattedSalary }}</div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/boot/supabase';

const auth = useAuthStore();
const { t } = useI18n();

const totalHours = ref(0);
const totalEarned = ref(0);

const WORKDAY_HOURS = 8;

const formattedHours = computed(() => totalHours.value.toFixed(2));
const daysApprox = computed(() => (totalHours.value / WORKDAY_HOURS).toFixed(1));
const formattedSalary = computed(() => `${totalEarned.value.toFixed(2)} ${t('common.currency')}`);

async function loadMonthSummary() {
  if (!auth.user) return;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('work_report_earnings')
    .select('hours, earned, work_date')
    .eq('user_id', auth.user.id)
    .gte('work_date', toIsoDate(monthStart))
    .lt('work_date', toIsoDate(nextMonthStart));

  if (error || !data) return;
  totalHours.value = data.reduce((sum, r) => sum + Number(r.hours), 0);
  totalEarned.value = data.reduce((sum, r) => sum + Number(r.earned), 0);
}

void loadMonthSummary();
</script>
