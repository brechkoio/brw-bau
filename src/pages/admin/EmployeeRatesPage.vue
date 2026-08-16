<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">Ставки співробітників</div>

    <q-select
      v-model="selectedEmployeeId"
      :options="employeeOptions"
      label="Співробітник"
      emit-value
      map-options
      style="max-width: 350px"
      class="q-mb-md"
      @update:model-value="loadRates"
    />

    <template v-if="selectedEmployeeId">
      <q-form class="row items-start q-col-gutter-md q-mb-lg" @submit.prevent="onSave">
        <q-input
          v-model.number="hourlyRate"
          type="number"
          step="0.01"
          min="0.01"
          label="Ставка, грн/год"
          style="max-width: 200px"
          :rules="[(val) => (val && val > 0) || 'Введіть суму більше 0']"
          lazy-rules
        />

        <q-input
          v-model="effectiveFrom"
          type="date"
          label="Діє з"
          style="max-width: 200px"
          :rules="[(val) => !!val || 'Оберіть дату']"
          lazy-rules
        />

        <q-btn
          type="submit"
          color="primary"
          text-color="black"
          label="Зберегти ставку"
          :loading="saving"
          unelevated
          no-caps
          rounded
          class="text-weight-bold q-mt-sm"
        />
      </q-form>

      <div class="text-subtitle2 q-mb-sm">Історія ставок</div>
      <q-table :rows="rates" :columns="columns" row-key="id" flat bordered :loading="loading">
        <template #body-cell-hourly_rate="props">
          <q-td :props="props"> {{ props.value }} грн/год </q-td>
        </template>
      </q-table>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import { supabase } from '@/boot/supabase';

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
    label: 'Діє з',
    field: 'effective_from',
    align: 'left',
    sortable: true,
  },
  { name: 'hourly_rate', label: 'Ставка', field: 'hourly_rate', align: 'left' },
]);

async function loadEmployees() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .order('first_name');
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  employeeOptions.value = (data ?? []).map((p) => ({
    label: `${p.first_name} ${p.last_name}`,
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
    $q.notify({ type: 'positive', message: 'Ставку збережено' });
    hourlyRate.value = null;
    await loadRates();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : 'Не вдалося зберегти ставку',
    });
  } finally {
    saving.value = false;
  }
}

void loadEmployees();
</script>
