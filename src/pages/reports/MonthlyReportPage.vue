<template>
  <q-page class="column no-wrap">
    <TableFiltersBar>
      <PeriodFilter v-model="dateRange" width="320px" :disable="!auth.isAdmin" />

      <template #actions>
        <div v-if="activeShift" class="brw-shift-status">
          <q-icon name="schedule" size="18px" />
          <span class="ellipsis">{{ activeShift.site_name }} · {{ elapsedLabel }}</span>
        </div>

        <q-btn
          v-if="!activeShift"
          unelevated
          no-caps
          icon="play_arrow"
          :label="t('home.startShift')"
          class="brw-btn-primary"
          @click="startShiftDialogOpen = true"
        />
        <q-btn
          v-else
          unelevated
          no-caps
          icon="stop_circle"
          :label="t('home.endShift')"
          class="brw-btn-primary"
          :loading="shiftBusy"
          @click="endShift"
        />

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

    <q-dialog v-model="startShiftDialogOpen">
      <q-card style="min-width: 320px">
        <q-card-section class="text-h6">{{ t('home.startShiftTitle') }}</q-card-section>
        <q-card-section>
          <div class="brw-field">
            <label for="start-shift-site">{{ t('reports.monthly.siteLabel') }}</label>
            <q-select
              for="start-shift-site"
              v-model="selectedSiteId"
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
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="t('common.cancel')" v-close-popup />
          <q-btn
            unelevated
            no-caps
            class="brw-btn-primary"
            :label="t('home.startShift')"
            :disable="!selectedSiteId"
            :loading="shiftBusy"
            @click="startShift"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

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

      <div v-if="filteredRows.length" class="column q-mt-md">
        <div class="row q-col-gutter-xl text-subtitle1">
          <div>
            {{ t('reports.summary.totalHours') }}: <strong>{{ totalHours }}</strong>
          </div>
          <div>
            {{ t('reports.monthly.totalEarned') }}: <strong>{{ formatMoney(totalEarned) }}</strong>
          </div>
        </div>
        <div v-if="creditedTotals.breakMinutes > 0" class="text-caption brw-break-caption q-mt-xs">
          {{
            t('reports.monthly.breakDeductedCaption', {
              raw: formatHoursLabel(creditedTotals.rawHours, t),
              minutes: creditedTotals.breakMinutes,
            })
          }}
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
              class="brw-input cursor-pointer"
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useQuasar, type QTableColumn, type QPopupProxy } from 'quasar';
import { useI18n } from 'vue-i18n';
import { supabase } from '@/boot/supabase';
import { useAuthStore } from '@/stores/auth-store';
import TableFiltersBar from '@/components/TableFiltersBar.vue';
import PeriodFilter from '@/components/PeriodFilter.vue';
import { exportTableToXlsx } from '@/utils/export-xlsx';
import { formatDisplayDate, toLocalIsoDate } from '@/utils/format-date';
import { currentMonthRange } from '@/utils/date-range';
import { aggregateCreditedHours } from '@/utils/work-hours';
import { formatHoursLabel } from '@/utils/format-hours';
import { getCurrentCoords } from '@/utils/geolocation';

interface ReportRow {
  id: string;
  work_date: string;
  start_time: string;
  end_time: string | null;
  hours: number | null;
  earned: number | null;
  hourly_rate: number | null;
  site_id: string;
  site_name: string;
}

interface SiteOption {
  label: string;
  value: string;
}

interface ActiveShift {
  id: string;
  site_name: string;
  start_time: string;
}

const $q = useQuasar();
const i18n = useI18n();
const { t } = i18n;
const auth = useAuthStore();

const dateRange = ref<{ from: string; to: string }>(currentMonthRange());

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

const creditedTotals = computed(() => aggregateCreditedHours(filteredRows.value));
const totalHours = computed(() => formatHoursLabel(creditedTotals.value.creditedHours, t));
const totalEarned = computed(() => creditedTotals.value.creditedEarned);

const columns = computed<QTableColumn<ReportRow>[]>(() => {
  const cols: QTableColumn<ReportRow>[] = [
    {
      name: 'work_date',
      label: t('reports.monthly.columnDate'),
      field: 'work_date',
      format: (val: string) => formatDisplayDate(val),
      align: 'left',
      sortable: true,
    },
    {
      name: 'weekday',
      label: t('reports.monthly.columnWeekday'),
      field: 'work_date',
      format: (val: string) => weekdayLabel(val),
      align: 'left',
      sortable: true,
    },
    {
      name: 'site_name',
      label: t('reports.monthly.columnSite'),
      field: 'site_name',
      align: 'left',
      sortable: true,
    },
    {
      name: 'time',
      label: t('reports.monthly.columnTime'),
      field: 'start_time',
      format: (val: string, row) =>
        `${formatTime(val)}–${row.end_time ? formatTime(row.end_time) : t('common.inProgress')}`,
      align: 'left',
      sortable: true,
    },
    {
      name: 'hours',
      label: t('reports.monthly.columnHours'),
      field: 'hours',
      format: (val: number | null) => formatHoursLabel(val ?? 0, t),
      align: 'left',
      sortable: true,
    },
    {
      name: 'earned',
      label: t('reports.monthly.columnEarned'),
      field: 'earned',
      format: (val: number) => formatMoney(val),
      align: 'left',
      sortable: true,
    },
  ];
  if (auth.isAdmin) {
    cols.push({
      name: 'actions',
      label: t('reports.monthly.columnActions'),
      field: 'id',
      align: 'left',
    });
  }
  return cols;
});

const exportColumns = computed(() => columns.value.filter((col) => col.name !== 'actions'));

async function onExport() {
  const ok = await exportTableToXlsx(
    `monthly-report-${dateRange.value.from.slice(0, 7)}.xlsx`,
    exportColumns.value,
    filteredRows.value,
  );
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

// ---- Clock-in / clock-out (duplicated from HomePage.vue) ----

const selectedSiteId = ref<string | null>(null);
const activeShift = ref<ActiveShift | null>(null);
const shiftBusy = ref(false);
const startShiftDialogOpen = ref(false);

const elapsedNow = ref(Date.now());
let elapsedTick: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  elapsedTick = setInterval(() => (elapsedNow.value = Date.now()), 60_000);
});
onUnmounted(() => clearInterval(elapsedTick));

const elapsedLabel = computed(() => {
  if (!activeShift.value) return '';
  const [h, m] = activeShift.value.start_time.split(':').map(Number);
  const start = new Date(elapsedNow.value);
  start.setHours(h ?? 0, m ?? 0, 0, 0);
  const mins = Math.max(0, Math.round((elapsedNow.value - start.getTime()) / 60_000));
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`;
});

function nowTime() {
  return new Date().toTimeString().slice(0, 8);
}

async function loadActiveShift() {
  if (!auth.user) return;
  const { data } = await supabase
    .from('work_report_earnings')
    .select('id, site_name, start_time')
    .eq('user_id', auth.user.id)
    .is('end_time', null)
    .maybeSingle();
  activeShift.value = data
    ? { id: data.id, site_name: data.site_name, start_time: data.start_time }
    : null;
}

async function startShift() {
  if (!auth.user || !selectedSiteId.value) return;
  shiftBusy.value = true;
  try {
    const geo = await getCurrentCoords();
    const { error } = await supabase.from('work_reports').insert({
      user_id: auth.user.id,
      site_id: selectedSiteId.value,
      work_date: toLocalIsoDate(new Date()),
      start_time: nowTime(),
      start_lat: geo?.lat ?? null,
      start_lng: geo?.lng ?? null,
    });
    if (error) throw error;
    $q.notify({ type: 'positive', message: t('home.shiftStarted') });
    selectedSiteId.value = null;
    startShiftDialogOpen.value = false;
    await Promise.all([loadActiveShift(), loadReports()]);
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('home.errorFallback'),
    });
  } finally {
    shiftBusy.value = false;
  }
}

async function endShift() {
  if (!activeShift.value) return;
  shiftBusy.value = true;
  try {
    const { error } = await supabase
      .from('work_reports')
      .update({ end_time: nowTime() })
      .eq('id', activeShift.value.id);
    if (error) throw error;
    $q.notify({ type: 'positive', message: t('home.shiftEnded') });
    await Promise.all([loadActiveShift(), loadReports()]);
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('home.errorFallback'),
    });
  } finally {
    shiftBusy.value = false;
  }
}

async function loadReports() {
  if (!auth.user) return;
  loading.value = true;
  const { data, error } = await supabase
    .from('work_report_earnings')
    .select('id, work_date, start_time, end_time, hours, earned, hourly_rate, site_id, site_name')
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
void loadActiveShift();
</script>

<style lang="scss" scoped>
.brw-field label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: $text-secondary;
}

.brw-break-caption {
  color: $text-muted;
}

.brw-shift-status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: $text-secondary;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}
</style>
