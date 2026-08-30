<template>
  <q-page class="column no-wrap">
    <TableFiltersBar>
      <PeriodFilter v-model="dateRange" months-view />

      <TableFilter v-slot="{ inputId }" :label="t('reports.filters.site')" width="300px">
        <q-select
          :for="inputId"
          v-model="selectedSiteId"
          :options="siteOptions"
          :placeholder="t('reports.monthly.allSites')"
          outlined
          clearable
          emit-value
          map-options
          popup-content-class="brw-select__menu"
          class="brw-select brw-input--dense brw-site-select"
        >
          <template #append>
            <div class="brw-site-select__divider" />
          </template>
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>{{ scope.opt.label }}</q-item-section>
              <q-item-section v-if="scope.selected" side>
                <q-icon name="check" size="18px" class="brw-select__check" />
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </TableFilter>

      <template #summary>
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
import TableFilter from '@/components/TableFilter.vue';
import PeriodFilter from '@/components/PeriodFilter.vue';
import { exportTableToXlsx } from '@/utils/export-xlsx';
import { currentMonthRange } from '@/utils/date-range';
import { formatHoursLabel } from '@/utils/format-hours';

interface EarningsRow {
  work_date: string;
  hours: number;
  earned: number;
  site_id: string;
  site_name: string;
  user_id: string;
}

interface SiteMonthRow {
  key: string;
  site_name: string;
  month: string;
  hours: number;
  earned: number;
  people: number;
}

interface SiteOption {
  label: string;
  value: string;
}

const $q = useQuasar();
const { t } = useI18n();

const dateRange = ref<{ from: string; to: string }>(currentMonthRange());

const rawRows = ref<EarningsRow[]>([]);
const siteOptions = ref<SiteOption[]>([]);
const selectedSiteId = ref<string | null>(null);
const loading = ref(false);

const rows = computed<SiteMonthRow[]>(() => {
  const grouped = new Map<
    string,
    { site_name: string; month: string; hours: number; earned: number; users: Set<string> }
  >();
  for (const r of rawRows.value) {
    if (selectedSiteId.value && r.site_id !== selectedSiteId.value) continue;
    const month = r.work_date.slice(0, 7); // YYYY-MM
    const key = `${r.site_id}_${month}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.hours += Number(r.hours);
      existing.earned += Number(r.earned);
      existing.users.add(r.user_id);
    } else {
      grouped.set(key, {
        site_name: r.site_name,
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
      site_name: g.site_name,
      month: g.month,
      hours: g.hours,
      earned: g.earned,
      people: g.users.size,
    }))
    .sort((a, b) => a.site_name.localeCompare(b.site_name) || a.month.localeCompare(b.month));
});

const totalHours = computed(() =>
  formatHoursLabel(
    rows.value.reduce((sum, r) => sum + r.hours, 0),
    t,
  ),
);
const totalEarned = computed(() => rows.value.reduce((sum, r) => sum + r.earned, 0));
const totalPeople = computed(() => {
  const ids = new Set<string>();
  for (const r of rawRows.value) {
    if (selectedSiteId.value && r.site_id !== selectedSiteId.value) continue;
    ids.add(r.user_id);
  }
  return ids.size;
});

function formatMonthYear(yearMonth: string): string {
  const [y, m] = yearMonth.split('-');
  return `${m}/${y}`;
}

function formatMoney(value: number) {
  return `${value.toFixed(2)} ${t('common.currency')}`;
}

const columns = computed<QTableColumn<SiteMonthRow>[]>(() => [
  {
    name: 'site_name',
    label: t('reports.monthly.columnSite'),
    field: 'site_name',
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
    `sites-report-summary-${dateRange.value.from.slice(0, 7)}.xlsx`,
    columns.value,
    rows.value,
  );
  if (!ok) {
    $q.notify({ type: 'negative', message: t('common.exportError') });
  }
}

function resetFilters() {
  selectedSiteId.value = null;
  dateRange.value = currentMonthRange();
}

async function loadSites() {
  const { data, error } = await supabase
    .from('sites')
    .select('id, name')
    .eq('is_active', true)
    .order('name');
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  siteOptions.value = (data ?? []).map((s) => ({ label: s.name, value: s.id }));
}

async function loadRows() {
  loading.value = true;
  const { data, error } = await supabase
    .from('work_report_earnings')
    .select('work_date, hours, earned, site_id, site_name, user_id')
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

void loadSites();
void loadRows();
</script>

<style lang="scss" scoped>
.brw-site-select__divider {
  width: 1px;
  height: 22px;
  background: $separator-color;
}

.brw-site-select :deep(.q-select__dropdown-icon) {
  color: $text-muted;
}

.brw-site-select :deep(.q-field__focusable-action) {
  color: $text-hint;
  font-size: 18px;
}

.brw-site-select :deep(.q-field__native) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

// Same two-row grid as a filter column: a 22px label row over a 44px
// control row — see SitesReportPage.vue for the full rationale, shared
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
</style>
