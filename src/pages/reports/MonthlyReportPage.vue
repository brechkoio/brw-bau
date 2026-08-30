<template>
  <q-page class="column no-wrap">
    <TableFiltersBar>
      <TableFilter v-slot="{ inputId }" :label="t('reports.filters.period')" width="320px">
        <q-input
          :for="inputId"
          :model-value="rangeLabel"
          outlined
          readonly
          class="brw-input brw-input--dense cursor-pointer"
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
      </template>
    </TableFiltersBar>

    <div class="brw-page-body q-pa-md">
      <q-table
        class="col brw-sticky-table"
        :rows="filteredRows"
        :columns="columns"
        row-key="id"
        flat
        bordered
        :loading="loading"
        :no-data-label="t('reports.monthly.noReports')"
        :rows-per-page-options="[0]"
        hide-bottom
        :row-class="rowClass"
      >
        <template #body-cell-weekday="props">
          <q-td :props="props">{{ props.value }}</q-td>
        </template>

        <template #body-cell-time="props">
          <q-td :props="props">{{ props.value }}</q-td>
        </template>

        <template #body-cell-earned="props">
          <q-td :props="props">{{ props.value }}</q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn flat icon="edit" class="brw-table-icon-btn" @click="openEdit(props.row)" />
            <q-btn
              flat
              icon="delete"
              class="brw-table-icon-btn"
              @click="confirmDelete(props.row)"
            />
          </q-td>
        </template>
      </q-table>

      <div v-if="filteredRows.length" class="row q-col-gutter-xl q-mt-md text-subtitle1">
        <div>
          {{ t('reports.summary.totalHours') }}: <strong>{{ totalHours }}</strong>
        </div>
        <div>
          {{ t('reports.monthly.totalEarned') }}: <strong>{{ formatMoney(totalEarned) }}</strong>
        </div>
      </div>

      <q-dialog v-model="editDialogOpen">
        <q-card style="min-width: 320px">
          <q-card-section class="text-h6">{{ t('common.edit') }}</q-card-section>
          <q-card-section class="column q-gutter-md">
            <div class="brw-field">
              <label for="edit-report-site">{{ t('reports.monthly.siteLabel') }}</label>
              <q-select
                for="edit-report-site"
                v-model="editForm.siteId"
                :options="siteOptions"
                :placeholder="t('reports.monthly.sitePlaceholder')"
                outlined
                emit-value
                map-options
                popup-content-class="brw-select__menu"
                class="brw-select"
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
              v-model="editForm.workDate"
              :label="t('reports.monthly.dateLabel')"
              outlined
              readonly
              class="cursor-pointer"
            >
              <template #append>
                <q-icon name="event" />
              </template>
              <q-popup-proxy
                ref="editWorkDateProxy"
                transition-show="scale"
                transition-hide="scale"
              >
                <q-date
                  v-model="editForm.workDate"
                  mask="YYYY-MM-DD"
                  today-btn
                  color="accent"
                  text-color="dark"
                  class="brw-picker"
                  @update:model-value="() => editWorkDateProxy?.hide()"
                />
              </q-popup-proxy>
            </q-input>
            <div class="brw-field">
              <label for="edit-report-start">{{ t('reports.monthly.startTimeLabel') }}</label>
              <q-input
                for="edit-report-start"
                v-model="editForm.startTime"
                outlined
                readonly
                class="brw-input cursor-pointer"
              >
                <template #append>
                  <q-icon name="schedule" />
                </template>
                <q-popup-proxy
                  ref="editStartTimeProxy"
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <q-time
                    v-model="editForm.startTime"
                    mask="HH:mm"
                    format24h
                    :minute-options="[0, 15, 30, 45]"
                    color="accent"
                    text-color="dark"
                    class="brw-picker"
                  >
                    <div class="row items-center justify-end q-gutter-sm">
                      <q-btn
                        v-close-popup
                        flat
                        no-caps
                        class="brw-btn-ghost"
                        :label="t('common.cancel')"
                      />
                      <q-btn
                        v-close-popup
                        unelevated
                        no-caps
                        class="brw-btn-dark"
                        :label="t('common.done')"
                      />
                    </div>
                  </q-time>
                </q-popup-proxy>
              </q-input>
            </div>
            <div class="brw-field">
              <label for="edit-report-end">{{ t('reports.monthly.endTimeLabel') }}</label>
              <q-input
                for="edit-report-end"
                v-model="editForm.endTime"
                outlined
                readonly
                class="brw-input cursor-pointer"
              >
                <template #append>
                  <q-icon name="schedule" />
                </template>
                <q-popup-proxy
                  ref="editEndTimeProxy"
                  transition-show="scale"
                  transition-hide="scale"
                >
                  <q-time
                    v-model="editForm.endTime"
                    mask="HH:mm"
                    format24h
                    :minute-options="[0, 15, 30, 45]"
                    color="accent"
                    text-color="dark"
                    class="brw-picker"
                  >
                    <div class="row items-center justify-end q-gutter-sm">
                      <q-btn
                        v-close-popup
                        flat
                        no-caps
                        class="brw-btn-ghost"
                        :label="t('common.cancel')"
                      />
                      <q-btn
                        v-close-popup
                        unelevated
                        no-caps
                        class="brw-btn-dark"
                        :label="t('common.done')"
                      />
                    </div>
                  </q-time>
                </q-popup-proxy>
              </q-input>
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat :label="t('common.cancel')" v-close-popup />
            <q-btn
              color="accent"
              text-color="black"
              unelevated
              no-caps
              :label="t('common.save')"
              :loading="saving"
              @click="onSaveEdit"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar, type QTableColumn, type QPopupProxy } from 'quasar';
import { useI18n } from 'vue-i18n';
import { supabase } from '@/boot/supabase';
import { useAuthStore } from '@/stores/auth-store';
import TableFiltersBar from '@/components/TableFiltersBar.vue';
import TableFilter from '@/components/TableFilter.vue';
import { exportTableToCsv } from '@/utils/export-csv';
import { formatDisplayDate } from '@/utils/format-date';

interface ReportRow {
  id: string;
  work_date: string;
  start_time: string;
  end_time: string | null;
  hours: number | null;
  earned: number | null;
  site_id: string;
  site_name: string;
}

interface SiteOption {
  label: string;
  value: string;
}

const $q = useQuasar();
const i18n = useI18n();
const { t } = i18n;
const auth = useAuthStore();

function currentMonthRange() {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
  };
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

const rows = ref<ReportRow[]>([]);
const siteOptions = ref<SiteOption[]>([]);
const loading = ref(false);
const saving = ref(false);

const filteredRows = computed(() => {
  const { from, to } = dateRange.value;
  return rows.value
    .filter((r) => r.work_date >= from && r.work_date <= to)
    .sort((a, b) => a.work_date.localeCompare(b.work_date));
});

const totalHours = computed(() =>
  filteredRows.value.reduce((sum, r) => sum + Number(r.hours), 0).toFixed(2),
);
const totalEarned = computed(() =>
  filteredRows.value.reduce((sum, r) => sum + Number(r.earned), 0),
);

const columns = computed<QTableColumn<ReportRow>[]>(() => [
  {
    name: 'work_date',
    label: t('reports.monthly.columnDate'),
    field: 'work_date',
    format: (val: string) => formatDisplayDate(val),
    align: 'left',
  },
  {
    name: 'weekday',
    label: t('reports.monthly.columnWeekday'),
    field: 'work_date',
    format: (val: string) => weekdayLabel(val),
    align: 'left',
  },
  { name: 'site_name', label: t('reports.monthly.columnSite'), field: 'site_name', align: 'left' },
  {
    name: 'time',
    label: t('reports.monthly.columnTime'),
    field: 'start_time',
    format: (val: string, row) =>
      `${formatTime(val)}–${row.end_time ? formatTime(row.end_time) : t('common.inProgress')}`,
    align: 'left',
  },
  { name: 'hours', label: t('reports.monthly.columnHours'), field: 'hours', align: 'left' },
  {
    name: 'earned',
    label: t('reports.monthly.columnEarned'),
    field: 'earned',
    format: (val: number) => formatMoney(val),
    align: 'left',
  },
  { name: 'actions', label: t('reports.monthly.columnActions'), field: 'id', align: 'left' },
]);

const exportColumns = computed(() => columns.value.filter((col) => col.name !== 'actions'));

function onExport() {
  const ok = exportTableToCsv('monthly-report.csv', exportColumns.value, filteredRows.value);
  if (!ok) {
    $q.notify({ type: 'negative', message: t('common.exportError') });
  }
}

function getLocalWeekday(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d).getDay();
}

function weekdayLabel(dateStr: string): string {
  const names = i18n.tm('weekdaysShort');
  return names[getLocalWeekday(dateStr)] ?? '';
}

function rowClass(row: ReportRow) {
  const day = getLocalWeekday(row.work_date);
  return day === 0 || day === 6 ? 'bg-grey-2' : '';
}

function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : '';
}

function formatMoney(value: number) {
  return `${Number(value).toFixed(2)} ${t('common.currency')}`;
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

async function loadReports() {
  if (!auth.user) return;
  loading.value = true;
  const { data, error } = await supabase
    .from('work_report_earnings')
    .select('id, work_date, start_time, end_time, hours, earned, site_id, site_name')
    .eq('user_id', auth.user.id)
    .order('work_date', { ascending: false });
  loading.value = false;
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  rows.value = data ?? [];
}

const editDialogOpen = ref(false);
const editingId = ref<string | null>(null);
const editWorkDateProxy = ref<QPopupProxy | null>(null);
const editStartTimeProxy = ref<QPopupProxy | null>(null);
const editEndTimeProxy = ref<QPopupProxy | null>(null);
const editForm = ref({
  siteId: null as string | null,
  workDate: '',
  startTime: '',
  endTime: '',
});

function openEdit(row: ReportRow) {
  editingId.value = row.id;
  editForm.value = {
    siteId: row.site_id,
    workDate: row.work_date,
    startTime: formatTime(row.start_time),
    endTime: formatTime(row.end_time),
  };
  editDialogOpen.value = true;
}

async function onSaveEdit() {
  if (!editingId.value) return;
  saving.value = true;
  try {
    const { error } = await supabase
      .from('work_reports')
      .update({
        site_id: editForm.value.siteId,
        work_date: editForm.value.workDate,
        start_time: editForm.value.startTime,
        end_time: editForm.value.endTime || null,
      })
      .eq('id', editingId.value);
    if (error) throw error;
    $q.notify({ type: 'positive', message: t('reports.monthly.successUpdated') });
    editDialogOpen.value = false;
    await loadReports();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('reports.monthly.errorFallback'),
    });
  } finally {
    saving.value = false;
  }
}

function confirmDelete(row: ReportRow) {
  $q.dialog({
    title: t('reports.monthly.deleteConfirmTitle'),
    message: t('reports.monthly.deleteConfirmMessage'),
    cancel: { label: t('common.cancel'), flat: true },
    ok: { label: t('common.delete'), color: 'negative', unelevated: true },
  }).onOk(() => void onDelete(row));
}

async function onDelete(row: ReportRow) {
  const { error } = await supabase.from('work_reports').delete().eq('id', row.id);
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  $q.notify({ type: 'positive', message: t('reports.monthly.successDeleted') });
  await loadReports();
}

void loadSites();
void loadReports();
</script>

<style lang="scss" scoped>
.brw-field label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: $text-secondary;
}
</style>
