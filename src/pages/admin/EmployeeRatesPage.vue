<template>
  <q-page>
    <TableFiltersBar>
      <q-select
        v-model="selectedEmployeeId"
        :options="employeeOptions"
        :label="t('admin.rates.employeeLabel')"
        color="accent"
        bg-color="white"
        emit-value
        map-options
        dense
        outlined
        style="min-width: 280px"
        @update:model-value="loadRates"
      />
    </TableFiltersBar>

    <div class="q-pa-md">
      <div class="text-h6 q-mb-md">{{ t('admin.rates.title') }}</div>

      <template v-if="selectedEmployeeId">
        <q-form class="row items-start q-col-gutter-md q-mb-lg" @submit.prevent="onSave">
          <q-input
            v-model.number="hourlyRate"
            type="number"
            step="0.01"
            min="0.01"
            :label="t('admin.rates.rateLabel')"
            style="max-width: 200px"
            :rules="[(val) => (val && val > 0) || t('validation.requiredAmount')]"
            lazy-rules
          />

          <q-input
            v-model="effectiveFrom"
            type="date"
            :label="t('admin.rates.effectiveFromLabel')"
            style="max-width: 200px"
            :rules="[(val) => !!val || t('validation.requiredDate')]"
            lazy-rules
          />

          <q-btn
            type="submit"
            color="accent"
            text-color="black"
            :label="t('admin.rates.submit')"
            :loading="saving"
            unelevated
            no-caps
            class="text-weight-bold q-mt-sm"
          />
        </q-form>
      </template>

      <div class="text-subtitle2 q-mb-sm">{{ t('admin.rates.historyTitle') }}</div>
      <q-table
        :rows="rates"
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
  created_at: string;
}

const $q = useQuasar();
const { t } = useI18n();

const employeeOptions = ref<EmployeeOption[]>([]);
const selectedEmployeeId = ref<string | null>(null);
const rates = ref<RateRow[]>([]);
const hourlyRate = ref<number | null>(null);
const effectiveFrom = ref(new Date().toISOString().slice(0, 10));
const loading = ref(false);
const saving = ref(false);

const columns = computed<QTableColumn[]>(() => [
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
  if (!selectedEmployeeId.value) return;
  loading.value = true;
  const { data, error } = await supabase
    .from('employee_rates')
    .select('id, hourly_rate, effective_from, created_at')
    .eq('user_id', selectedEmployeeId.value)
    .order('effective_from', { ascending: false });
  loading.value = false;
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  rates.value = data ?? [];
}

async function onSave() {
  if (!selectedEmployeeId.value || !hourlyRate.value) return;
  saving.value = true;
  try {
    const { error } = await supabase.from('employee_rates').insert({
      user_id: selectedEmployeeId.value,
      hourly_rate: hourlyRate.value,
      effective_from: effectiveFrom.value,
    });
    if (error) throw error;
    $q.notify({ type: 'positive', message: t('admin.rates.successMessage') });
    hourlyRate.value = null;
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
</script>
