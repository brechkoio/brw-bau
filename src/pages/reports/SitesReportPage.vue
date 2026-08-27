<template>
  <q-page class="column no-wrap">
    <TableFiltersBar>
      <q-input
        :model-value="rangeLabel"
        :aria-label="t('reports.monthly.periodLabel')"
        outlined
        readonly
        class="brw-input cursor-pointer"
        style="min-width: 220px"
      >
        <template #append>
          <q-icon name="event" />
        </template>
        <q-popup-proxy transition-show="scale" transition-hide="scale">
          <q-date
            v-model="rawDateRange"
            mask="YYYY-MM-DD"
            range
            no-unset
            today-btn
            color="accent"
            text-color="dark"
          >
            <div class="row items-center justify-end">
              <q-btn v-close-popup flat no-caps color="dark" :label="t('common.confirm')" />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-input>

      <q-select
        v-model="selectedSiteId"
        :options="siteOptions"
        :placeholder="t('reports.monthly.allSites')"
        :aria-label="t('reports.monthly.siteLabel')"
        outlined
        clearable
        emit-value
        map-options
        popup-content-class="brw-select__menu"
        class="brw-select"
        style="min-width: 220px"
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

      <q-space />

      <q-btn
        unelevated
        no-caps
        icon="download"
        :label="t('common.export')"
        class="brw-btn-secondary"
        @click="onExport"
      />
    </TableFiltersBar>

    <div class="brw-page-body q-pa-md">
      <q-table
        class="col brw-sticky-table"
        :rows="rows"
        :columns="columns"
        row-key="key"
        flat
        bordered
        :loading="loading"
        :no-data-label="t('reports.monthly.noReports')"
        :rows-per-page-options="[0]"
        hide-bottom
      >
        <template #body-cell-hours="props">
          <q-td :props="props">{{ props.value }}</q-td>
        </template>
      </q-table>

      <div v-if="rows.length" class="q-mt-md text-subtitle1">
        {{ t('reports.monthly.totalHours') }}: <strong>{{ totalHours }}</strong>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import { supabase } from '@/boot/supabase';
import TableFiltersBar from '@/components/TableFiltersBar.vue';
import { exportTableToCsv } from '@/utils/export-csv';

interface EarningsRow {
  work_date: string;
  hours: number;
  site_id: string;
  site_name: string;
}

interface SiteDayRow {
  key: string;
  site_name: string;
  work_date: string;
  hours: number;
}

interface SiteOption {
  label: string;
  value: string;
}

const $q = useQuasar();
const { t } = useI18n();

function currentMonthRange() {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
  };
}

function formatDisplayDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

const dateRange = ref<{ from: string; to: string }>(currentMonthRange());
// q-date's range model collapses to a plain date string when both ends of
// the range land on the same day (e.g. clicking one day twice) instead of
// { from, to } — normalize it back into an object either way.
const rawDateRange = ref<string | { from: string; to: string }>(dateRange.value);
watch(rawDateRange, (val) => {
  dateRange.value = typeof val === 'string' ? { from: val, to: val } : val;
});

const rangeLabel = computed(
  () => `${formatDisplayDate(dateRange.value.from)} – ${formatDisplayDate(dateRange.value.to)}`,
);

const rawRows = ref<EarningsRow[]>([]);
const siteOptions = ref<SiteOption[]>([]);
const selectedSiteId = ref<string | null>(null);
const loading = ref(false);

const rows = computed<SiteDayRow[]>(() => {
  const grouped = new Map<string, SiteDayRow>();
  for (const r of rawRows.value) {
    if (selectedSiteId.value && r.site_id !== selectedSiteId.value) continue;
    const key = `${r.site_id}_${r.work_date}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.hours += Number(r.hours);
    } else {
      grouped.set(key, {
        key,
        site_name: r.site_name,
        work_date: r.work_date,
        hours: Number(r.hours),
      });
    }
  }
  return Array.from(grouped.values()).sort(
    (a, b) => a.site_name.localeCompare(b.site_name) || a.work_date.localeCompare(b.work_date),
  );
});

const totalHours = computed(() => rows.value.reduce((sum, r) => sum + r.hours, 0).toFixed(2));

const columns = computed<QTableColumn<SiteDayRow>[]>(() => [
  {
    name: 'site_name',
    label: t('reports.monthly.columnSite'),
    field: 'site_name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'work_date',
    label: t('reports.monthly.columnDate'),
    field: 'work_date',
    align: 'left',
    sortable: true,
  },
  {
    name: 'hours',
    label: t('reports.monthly.columnHours'),
    field: 'hours',
    format: (val: number) => val.toFixed(2),
    align: 'left',
    sortable: true,
  },
]);

function onExport() {
  const ok = exportTableToCsv('sites-report.csv', columns.value, rows.value);
  if (!ok) {
    $q.notify({ type: 'negative', message: t('common.exportError') });
  }
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
    .select('work_date, hours, site_id, site_name')
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
