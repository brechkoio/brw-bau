<template>
  <q-page class="column no-wrap">
    <TableFiltersBar>
      <q-input
        v-model="search"
        :label="t('common.search')"
        dense
        clearable
        outlined
        bg-color="white"
        style="min-width: 220px"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>

      <q-space />

      <q-btn
        color="accent"
        text-color="black"
        icon="add"
        :label="t('admin.rates.submit')"
        unelevated
        no-caps
        dense
        class="text-weight-bold"
        @click="addDialogOpen = true"
      />
    </TableFiltersBar>

    <div class="brw-page-body q-pa-md">
      <div class="text-h6 q-mb-md">{{ t('admin.rates.title') }}</div>

      <q-table
        class="col brw-sticky-table"
        :rows="filteredRates"
        :columns="columns"
        row-key="id"
        flat
        bordered
        :loading="loading"
        :no-data-label="t('admin.rates.noRates')"
      >
        <template #body-cell-hourly_rate="props">
          <q-td :props="props"> {{ props.value }} {{ t('admin.rates.perHourSuffix') }} </q-td>
        </template>
      </q-table>
    </div>

    <q-dialog v-model="addDialogOpen">
      <q-card style="min-width: 320px">
        <q-card-section class="text-h6">{{ t('admin.rates.submit') }}</q-card-section>
        <q-form @submit.prevent="onSave">
          <q-card-section class="column q-gutter-md">
            <q-select
              v-model="form.employeeId"
              :options="employeeOptions"
              :label="t('admin.rates.employeeLabel')"
              color="accent"
              outlined
              emit-value
              map-options
              :rules="[(val) => !!val || t('validation.requiredEmployee')]"
              lazy-rules
            />

            <q-input
              v-model.number="form.hourlyRate"
              type="number"
              step="0.01"
              min="0.01"
              :label="t('admin.rates.rateLabel')"
              outlined
              :rules="[(val) => (val && val > 0) || t('validation.requiredAmount')]"
              lazy-rules
            />

            <q-input
              v-model="form.effectiveFrom"
              type="date"
              :label="t('admin.rates.effectiveFromLabel')"
              outlined
              :rules="[(val) => !!val || t('validation.requiredDate')]"
              lazy-rules
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat :label="t('common.cancel')" v-close-popup />
            <q-btn
              type="submit"
              color="accent"
              text-color="black"
              unelevated
              no-caps
              :label="t('common.save')"
              :loading="saving"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import { supabase } from '@/boot/supabase';
import TableFiltersBar from '@/components/TableFiltersBar.vue';

interface EmployeeOption {
  label: string;
  value: string;
}

interface RateRow {
  id: string;
  hourly_rate: number;
  effective_from: string;
  employee_name: string;
}

const $q = useQuasar();
const { t } = useI18n();

const employeeOptions = ref<EmployeeOption[]>([]);
const rates = ref<RateRow[]>([]);
const search = ref('');
const loading = ref(false);
const saving = ref(false);
const addDialogOpen = ref(false);

const form = ref({
  employeeId: null as string | null,
  hourlyRate: null as number | null,
  effectiveFrom: new Date().toISOString().slice(0, 10),
});

const filteredRates = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return rates.value;
  return rates.value.filter((r) => r.employee_name.toLowerCase().includes(query));
});

const columns = computed<QTableColumn[]>(() => [
  {
    name: 'employee_name',
    label: t('admin.rates.columnEmployee'),
    field: 'employee_name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'effective_from',
    label: t('admin.rates.columnEffectiveFrom'),
    field: 'effective_from',
    align: 'left',
    sortable: true,
  },
  { name: 'hourly_rate', label: t('admin.rates.columnRate'), field: 'hourly_rate', align: 'left' },
]);

async function loadEmployees() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .order('first_name');
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  employeeOptions.value = (data ?? []).map((p) => ({
    label: `${p.first_name} ${p.last_name} (${p.email})`,
    value: p.id,
  }));
}

async function loadRates() {
  loading.value = true;
  const { data, error } = await supabase
    .from('employee_rates')
    .select('id, hourly_rate, effective_from, profiles(first_name, last_name)')
    .order('effective_from', { ascending: false });
  loading.value = false;
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  rates.value = (data ?? []).map((r) => {
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    return {
      id: r.id,
      hourly_rate: r.hourly_rate,
      effective_from: r.effective_from,
      employee_name: profile ? `${profile.first_name} ${profile.last_name}` : '',
    };
  });
}

async function onSave() {
  if (!form.value.employeeId || !form.value.hourlyRate) return;
  saving.value = true;
  try {
    const { error } = await supabase.from('employee_rates').insert({
      user_id: form.value.employeeId,
      hourly_rate: form.value.hourlyRate,
      effective_from: form.value.effectiveFrom,
    });
    if (error) throw error;
    $q.notify({ type: 'positive', message: t('admin.rates.successMessage') });
    addDialogOpen.value = false;
    form.value = {
      employeeId: null,
      hourlyRate: null,
      effectiveFrom: new Date().toISOString().slice(0, 10),
    };
    await loadRates();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('admin.rates.errorFallback'),
    });
  } finally {
    saving.value = false;
  }
}

void loadEmployees();
void loadRates();
</script>
