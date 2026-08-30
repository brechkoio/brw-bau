<template>
  <q-page class="column no-wrap">
    <TableFiltersBar>
      <TableFilter v-slot="{ inputId }" :label="t('common.search')" width="220px">
        <q-input
          :for="inputId"
          v-model="search"
          clearable
          outlined
          class="brw-input brw-input--dense"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </TableFilter>

      <template #actions>
        <q-btn
          unelevated
          no-caps
          icon="download"
          :label="t('common.export')"
          class="brw-btn-secondary"
          @click="onExport"
        />

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
      </template>
    </TableFiltersBar>

    <div class="brw-page-body q-pa-md">
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
          <q-td :props="props">{{ props.value }}</q-td>
        </template>
      </q-table>
    </div>

    <q-dialog v-model="addDialogOpen">
      <q-card style="min-width: 320px">
        <q-card-section class="text-h6">{{ t('admin.rates.submit') }}</q-card-section>
        <q-form @submit.prevent="onSave">
          <q-card-section class="column q-gutter-md">
            <div class="brw-field">
              <label for="rate-employee">{{ t('admin.rates.employeeLabel') }}</label>
              <q-select
                for="rate-employee"
                v-model="form.employeeId"
                :options="employeeOptions"
                outlined
                emit-value
                map-options
                popup-content-class="brw-select__menu"
                class="brw-select"
                :rules="[(val) => !!val || t('validation.requiredEmployee')]"
                lazy-rules
              >
                <template #option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section>{{ scope.opt.label }}</q-item-section>
                    <q-item-section v-if="scope.selected" side>
                      <q-icon name="check" size="18px" class="brw-select__check" />
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <q-input
              v-model.number="form.hourlyRate"
              type="number"
              step="0.01"
              min="0.01"
              :label="t('admin.rates.rateLabel')"
              outlined
              class="brw-input"
              :rules="[(val) => (val && val > 0) || t('validation.requiredAmount')]"
              lazy-rules
            />

            <q-input
              v-model="form.effectiveFrom"
              :label="t('admin.rates.effectiveFromLabel')"
              outlined
              readonly
              class="cursor-pointer"
              :rules="[(val) => !!val || t('validation.requiredDate')]"
              lazy-rules
            >
              <template #append>
                <q-icon name="event" />
              </template>
              <q-popup-proxy
                ref="effectiveFromProxy"
                transition-show="scale"
                transition-hide="scale"
              >
                <q-date
                  v-model="form.effectiveFrom"
                  mask="YYYY-MM-DD"
                  today-btn
                  color="accent"
                  text-color="dark"
                  @update:model-value="() => effectiveFromProxy?.hide()"
                />
              </q-popup-proxy>
            </q-input>
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
import { useQuasar, type QTableColumn, type QPopupProxy } from 'quasar';
import { useI18n } from 'vue-i18n';
import { supabase } from '@/boot/supabase';
import TableFiltersBar from '@/components/TableFiltersBar.vue';
import TableFilter from '@/components/TableFilter.vue';
import { exportTableToXlsx } from '@/utils/export-xlsx';
import { toLocalIsoDate } from '@/utils/format-date';

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
const effectiveFromProxy = ref<QPopupProxy | null>(null);

const form = ref({
  employeeId: null as string | null,
  hourlyRate: null as number | null,
  effectiveFrom: toLocalIsoDate(new Date()),
});

const filteredRates = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return rates.value;
  return rates.value.filter((r) => r.employee_name.toLowerCase().includes(query));
});

const columns = computed<QTableColumn<RateRow>[]>(() => [
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
  {
    name: 'hourly_rate',
    label: t('admin.rates.columnRate'),
    field: 'hourly_rate',
    format: (val: number) => `${val} ${t('admin.rates.perHourSuffix')}`,
    align: 'left',
  },
]);

async function onExport() {
  const ok = await exportTableToXlsx(
    `employee-rates-${toLocalIsoDate(new Date()).slice(0, 7)}.xlsx`,
    columns.value,
    filteredRates.value,
  );
  if (!ok) {
    $q.notify({ type: 'negative', message: t('common.exportError') });
  }
}

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
      effectiveFrom: toLocalIsoDate(new Date()),
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

<style lang="scss" scoped>
.brw-field label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: $text-secondary;
}
</style>
