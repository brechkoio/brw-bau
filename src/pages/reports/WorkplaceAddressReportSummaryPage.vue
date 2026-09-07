<template>
  <q-page class="column no-wrap">
    <TableFiltersBar>
      <PeriodFilter v-model="dateRange" months-view />

      <SelectFilter
        v-model="selectedWorkplaceAddressId"
        :label="t('reports.filters.workplaceAddress')"
        :options="workplaceAddressOptions"
        :placeholder="t('reports.monthly.allWorkplaceAddresses')"
        width="300px"
      />

      <template #summary>
        <div class="column items-end">
          <div class="brw-summary-group">
            <div class="brw-summary">
              <div class="brw-summary__label">{{ t('reports.summary.totalHours') }}</div>
              <div class="brw-summary__value">{{ totalHours }}</div>
            </div>
            <div class="brw-summary">
              <div class="brw-summary__label">{{ t('reports.summary.totalEarned') }}</div>
              <div class="brw-summary__value">{{ formatMoney(totalEarned) }}</div>
            </div>
            <div class="brw-summary">
              <div class="brw-summary__label">{{ t('reports.summary.totalPeople') }}</div>
              <div class="brw-summary__value">{{ totalPeople }}</div>
            </div>
          </div>
          <div
            v-if="creditedSummary && creditedSummary.breakMinutes > 0"
            class="text-caption brw-break-caption"
          >
            {{
              t('reports.monthly.breakDeductedCaption', {
                raw: formatHoursLabel(creditedSummary.rawHours, t),
                minutes: creditedSummary.breakMinutes,
              })
            }}
          </div>
        </div>
      </template>

      <template #actions>
        <q-btn
          unelevated
          no-caps
          icon="download"
          :label="t('common.export')"
          class="brw-btn-secondary"
          @click="onExport"
        />
      </template>
    </TableFiltersBar>

    <div class="brw-page-body q-pa-md">
      <q-table
        class="brw-sticky-table"
        :rows="rows"
        :columns="columns"
        row-key="key"
        flat
        bordered
        :loading="loading"
        :rows-per-page-options="[0]"
        hide-bottom
      >
        <template #body-cell-hours="props">
          <q-td :props="props" class="brw-tabular-nums">{{ props.value }}</q-td>
        </template>

        <template #body-cell-earned="props">
          <q-td :props="props" class="brw-tabular-nums">{{ props.value }}</q-td>
        </template>

        <template #body-cell-people="props">
          <q-td :props="props" class="brw-tabular-nums">{{ props.value }}</q-td>
        </template>

        <template #no-data>
          <div class="brw-empty">
            <div class="brw-empty__text">{{ t('reports.empty.filtered') }}</div>
            <q-btn
              flat
              no-caps
              class="brw-btn-ghost"
              :label="t('common.resetFilters')"
              @click="resetFilters"
            />
          </div>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import { supabase } from '@/boot/supabase';
import TableFiltersBar from '@/components/TableFiltersBar.vue';
import SelectFilter from '@/components/SelectFilter.vue';
import PeriodFilter from '@/components/PeriodFilter.vue';
import { exportTableToXlsx } from '@/utils/export-xlsx';
import { currentMonthRange } from '@/utils/date-range';
import { formatHoursLabel } from '@/utils/format-hours';

interface EarningsRow {
  work_date: string;
  hours: number;
  earned: number;
  hourly_rate: number | null;
  workplace_address_id: string;
  workplace_address_name: string;
  user_id: string;
}

interface WorkplaceAddressMonthRow {
  key: string;
  workplace_address_name: string;
  month: string;
  hours: number;
  earned: number;
  people: number;
}

interface WorkplaceAddressOption {
  label: string;
  value: string;
}

interface CreditedSummary {
  rawHours: number;
  creditedHours: number;
  creditedEarned: number;
  breakMinutes: number;
  peopleCount: number;
}

const $q = useQuasar();
const { t } = useI18n();

const dateRange = ref<{ from: string; to: string }>(currentMonthRange());

const rawRows = ref<EarningsRow[]>([]);
const workplaceAddressOptions = ref<WorkplaceAddressOption[]>([]);
const selectedWorkplaceAddressId = ref<string | null>(null);
const loading = ref(false);

const rows = computed<WorkplaceAddressMonthRow[]>(() => {
  const grouped = new Map<
    string,
    {
      workplace_address_name: string;
      month: string;
      hours: number;
      earned: number;
      users: Set<string>;
    }
  >();
  for (const r of rawRows.value) {
    if (
      selectedWorkplaceAddressId.value &&
      r.workplace_address_id !== selectedWorkplaceAddressId.value
    )
      continue;
    const month = r.work_date.slice(0, 7); // YYYY-MM
    const key = `${r.workplace_address_id}_${month}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.hours += Number(r.hours);
      existing.earned += Number(r.earned);
      existing.users.add(r.user_id);
    } else {
      grouped.set(key, {
        workplace_address_name: r.workplace_address_name,
        month,
        hours: Number(r.hours),
        earned: Number(r.earned),
        users: new Set([r.user_id]),
      });
    }
  }
  return Array.from(grouped.entries())
    .map(([key, g]) => ({
      key,
      workplace_address_name: g.workplace_address_name,
      month: g.month,
      hours: g.hours,
      earned: g.earned,
      people: g.users.size,
    }))
    .sort(
      (a, b) =>
        a.workplace_address_name.localeCompare(b.workplace_address_name) ||
        a.month.localeCompare(b.month),
    );
});

// The row-level table stays raw (each row is exactly what was clocked) —
// only the summary total applies the lunch-break credit. Computed entirely
// server-side (work_report_credited_summary groups by user+day and sums),
// so this report never has to re-derive the rule itself.
const creditedSummary = ref<CreditedSummary | null>(null);
const totalHours = computed(() => formatHoursLabel(creditedSummary.value?.creditedHours ?? 0, t));
const totalEarned = computed(() => creditedSummary.value?.creditedEarned ?? 0);
const totalPeople = computed(() => creditedSummary.value?.peopleCount ?? 0);

async function loadCreditedSummary() {
  const { data, error } = await supabase.rpc('work_report_credited_summary', {
    p_from: dateRange.value.from,
    p_to: dateRange.value.to,
    p_workplace_address_id: selectedWorkplaceAddressId.value,
  });
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  const row = data?.[0];
  creditedSummary.value = row
    ? {
        rawHours: Number(row.raw_hours),
        creditedHours: Number(row.credited_hours),
        creditedEarned: Number(row.credited_earned),
        breakMinutes: row.break_minutes,
        peopleCount: row.people_count,
      }
    : null;
}

function formatMonthYear(yearMonth: string): string {
  const [y, m] = yearMonth.split('-');
  return `${m}/${y}`;
}

function formatMoney(value: number) {
  return `${value.toFixed(2)} ${t('common.currency')}`;
}

const columns = computed<QTableColumn<WorkplaceAddressMonthRow>[]>(() => [
  {
    name: 'workplace_address_name',
    label: t('reports.monthly.columnWorkplaceAddress'),
    field: 'workplace_address_name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'month',
    label: t('reports.monthly.columnDate'),
    field: 'month',
    format: (val: string) => formatMonthYear(val),
    align: 'left',
    sortable: true,
  },
  {
    name: 'hours',
    label: t('reports.monthly.columnHours'),
    field: 'hours',
    format: (val: number) => formatHoursLabel(val, t),
    align: 'right',
    sortable: true,
  },
  {
    name: 'earned',
    label: t('reports.monthly.columnEarned'),
    field: 'earned',
    format: (val: number) => formatMoney(val),
    align: 'right',
    sortable: true,
  },
  {
    name: 'people',
    label: t('reports.general.columnPeople'),
    field: 'people',
    align: 'right',
    sortable: true,
  },
]);

async function onExport() {
  const ok = await exportTableToXlsx(
    `workplace-address-report-summary-${dateRange.value.from.slice(0, 7)}.xlsx`,
    columns.value,
    rows.value,
  );
  if (!ok) {
    $q.notify({ type: 'negative', message: t('common.exportError') });
  }
}

function resetFilters() {
  selectedWorkplaceAddressId.value = null;
  dateRange.value = currentMonthRange();
}

async function loadWorkplaceAddresses() {
  const { data, error } = await supabase
    .from('workplace_address')
    .select('id, name')
    .eq('is_active', true)
    .order('name');
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  workplaceAddressOptions.value = (data ?? []).map((s) => ({ label: s.name, value: s.id }));
}

async function loadRows() {
  loading.value = true;
  const { data, error } = await supabase
    .from('work_report_earnings')
    .select(
      'work_date, hours, earned, hourly_rate, workplace_address_id, workplace_address_name, user_id',
    )
    .gte('work_date', dateRange.value.from)
    .lte('work_date', dateRange.value.to);
  loading.value = false;
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  rawRows.value = data ?? [];
}

watch(dateRange, () => void loadRows());
watch([dateRange, selectedWorkplaceAddressId], () => void loadCreditedSummary(), { deep: true });

void loadWorkplaceAddresses();
void loadRows();
void loadCreditedSummary();
</script>

<style lang="scss" scoped>
// Same two-row grid as a filter column: a 22px label row over a 44px
// control row — see WorkplaceAddressReportPage.vue for the full rationale, shared
// here since this panel has two summary values instead of one.
.brw-summary-group {
  display: flex;
  align-items: flex-end;
  gap: 20px;
}

.brw-summary {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.brw-summary__label {
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: $text-muted;
}

.brw-summary__value {
  display: flex;
  align-items: center;
  height: 44px;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: $dark;
  font-variant-numeric: tabular-nums;
}

.brw-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 0;
  color: $text-muted;
  font-size: 15px;
}

.brw-break-caption {
  margin-top: 4px;
  color: $text-muted;
}
</style>
