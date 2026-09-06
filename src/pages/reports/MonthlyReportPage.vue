<template>
  <q-page class="column no-wrap">
    <TableFiltersBar>
      <PeriodFilter v-model="dateRange" width="320px" :disable="!auth.isAdmin" />

      <template #actions>
        <div v-if="activeShift" class="brw-shift-status">
          <q-icon name="schedule" size="18px" />
          <span class="ellipsis"
            >{{ activeShift.workplace_address_name }} · {{ elapsedLabel }}</span
          >
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
          v-if="auth.isAdmin"
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
            <label for="start-shift-workplace-address">{{
              t('reports.monthly.workplaceAddressLabel')
            }}</label>
            <q-select
              for="start-shift-workplace-address"
              v-model="selectedWorkplaceAddressId"
              :options="workplaceAddressOptions"
              :placeholder="t('reports.monthly.workplaceAddressPlaceholder')"
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
            :disable="!selectedWorkplaceAddressId"
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

        <template #body-cell-tooShort="props">
          <q-td :props="props" :class="{ 'text-warning text-weight-bold': props.row.is_too_short }">
            {{ props.value }}
          </q-td>
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
        <div
          v-if="creditedSummary && creditedSummary.breakMinutes > 0"
          class="text-caption brw-break-caption q-mt-xs"
        >
          {{
            t('reports.monthly.breakDeductedCaption', {
              raw: formatHoursLabel(creditedSummary.rawHours, t),
              minutes: creditedSummary.breakMinutes,
            })
          }}
        </div>
      </div>

      <q-dialog v-model="editDialogOpen">
        <q-card style="min-width: 320px">
          <q-card-section class="text-h6">{{ t('common.edit') }}</q-card-section>
          <q-card-section class="column q-gutter-md">
            <div class="brw-field">
              <label for="edit-report-workplace-address">{{
                t('reports.monthly.workplaceAddressLabel')
              }}</label>
              <q-select
                for="edit-report-workplace-address"
                v-model="editForm.workplaceAddressId"
                :options="workplaceAddressOptions"
                :placeholder="t('reports.monthly.workplaceAddressPlaceholder')"
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
              unelevated
              no-caps
              class="brw-btn-primary"
              :label="t('common.save')"
              :loading="saving"
              @click="confirmSaveEdit"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useQuasar, type QTableColumn, type QPopupProxy } from 'quasar';
import { useI18n } from 'vue-i18n';
import { supabase } from '@/boot/supabase';
import { useAuthStore } from '@/stores/auth-store';
import TableFiltersBar from '@/components/TableFiltersBar.vue';
import PeriodFilter from '@/components/PeriodFilter.vue';
import { exportTableToXlsx } from '@/utils/export-xlsx';
import { formatDisplayDate, toLocalIsoDate } from '@/utils/format-date';
import { currentMonthRange } from '@/utils/date-range';
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
  workplace_address_id: string;
  workplace_address_name: string;
  day_break_minutes: number | null;
  is_too_short: boolean | null;
}

interface CreditedSummary {
  rawHours: number;
  creditedHours: number;
  creditedEarned: number;
  breakMinutes: number;
}

interface WorkplaceAddressOption {
  label: string;
  value: string;
}

interface ActiveShift {
  id: string;
  workplace_address_name: string;
  start_time: string;
}

const $q = useQuasar();
const i18n = useI18n();
const { t } = i18n;
const auth = useAuthStore();

const dateRange = ref<{ from: string; to: string }>(currentMonthRange());

const rows = ref<ReportRow[]>([]);
const workplaceAddressOptions = ref<WorkplaceAddressOption[]>([]);
const loading = ref(false);
const saving = ref(false);

const filteredRows = computed(() => {
  const { from, to } = dateRange.value;
  return rows.value
    .filter((r) => r.work_date >= from && r.work_date <= to)
    .sort((a, b) => a.work_date.localeCompare(b.work_date));
});

const creditedSummary = ref<CreditedSummary | null>(null);
const totalHours = computed(() => formatHoursLabel(creditedSummary.value?.creditedHours ?? 0, t));
const totalEarned = computed(() => creditedSummary.value?.creditedEarned ?? 0);

async function loadCreditedSummary() {
  if (!auth.user) return;
  const { data, error } = await supabase.rpc('work_report_credited_summary', {
    p_from: dateRange.value.from,
    p_to: dateRange.value.to,
    p_user_id: auth.user.id,
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
      }
    : null;
}

watch(dateRange, () => void loadCreditedSummary(), { deep: true });

function breakLabel(row: ReportRow): string {
  const minutes = row.day_break_minutes ?? 0;
  if (minutes <= 0) return t('reports.monthly.breakNotDeducted');
  return t('reports.monthly.breakDeductedShort', { minutes });
}

function tooShortLabel(row: ReportRow): string {
  return row.is_too_short ? t('reports.monthly.tooShortNote') : '';
}

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
      name: 'workplace_address_name',
      label: t('reports.monthly.columnWorkplaceAddress'),
      field: 'workplace_address_name',
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
      name: 'breakDeducted',
      label: t('reports.monthly.columnBreak'),
      field: 'work_date',
      format: (_val: string, row: ReportRow) => breakLabel(row),
      align: 'left',
    },
    {
      name: 'tooShort',
      label: t('reports.monthly.columnTooShort'),
      field: 'work_date',
      format: (_val: string, row: ReportRow) => tooShortLabel(row),
      align: 'left',
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
  if (!auth.isAdmin) return;
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

// ---- Clock-in / clock-out (duplicated from HomePage.vue) ----

const selectedWorkplaceAddressId = ref<string | null>(null);
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
    .select('id, workplace_address_name, start_time')
    .eq('user_id', auth.user.id)
    .is('end_time', null)
    .maybeSingle();
  activeShift.value = data
    ? {
        id: data.id,
        workplace_address_name: data.workplace_address_name,
        start_time: data.start_time,
      }
    : null;
}

async function startShift() {
  if (!auth.user || !selectedWorkplaceAddressId.value) return;
  shiftBusy.value = true;
  try {
    const geo = await getCurrentCoords();
    const { error } = await supabase.from('work_reports').insert({
      user_id: auth.user.id,
      workplace_address_id: selectedWorkplaceAddressId.value,
      work_date: toLocalIsoDate(new Date()),
      start_time: nowTime(),
      start_lat: geo?.lat ?? null,
      start_lng: geo?.lng ?? null,
    });
    if (error) throw error;
    $q.notify({ type: 'positive', message: t('home.shiftStarted') });
    selectedWorkplaceAddressId.value = null;
    startShiftDialogOpen.value = false;
    await Promise.all([loadActiveShift(), loadReports(), loadCreditedSummary()]);
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
    await Promise.all([loadActiveShift(), loadReports(), loadCreditedSummary()]);
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
    .select(
      'id, work_date, start_time, end_time, hours, earned, hourly_rate, workplace_address_id, workplace_address_name, day_break_minutes, is_too_short',
    )
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
  workplaceAddressId: null as string | null,
  workDate: '',
  startTime: '',
  endTime: '',
});

function openEdit(row: ReportRow) {
  editingId.value = row.id;
  editForm.value = {
    workplaceAddressId: row.workplace_address_id,
    workDate: row.work_date,
    startTime: formatTime(row.start_time),
    endTime: formatTime(row.end_time),
  };
  editDialogOpen.value = true;
}

function confirmSaveEdit() {
  $q.dialog({
    title: t('common.saveConfirmTitle'),
    message: t('common.saveConfirmMessage'),
    cancel: { label: t('common.cancel'), flat: true, noCaps: true },
    ok: { label: t('common.save'), unelevated: true, noCaps: true, class: 'brw-btn-primary' },
  }).onOk(() => void onSaveEdit());
}

async function onSaveEdit() {
  if (!editingId.value) return;
  saving.value = true;
  try {
    const { error } = await supabase
      .from('work_reports')
      .update({
        workplace_address_id: editForm.value.workplaceAddressId,
        work_date: editForm.value.workDate,
        start_time: editForm.value.startTime,
        end_time: editForm.value.endTime || null,
      })
      .eq('id', editingId.value);
    if (error) throw error;
    $q.notify({ type: 'positive', message: t('reports.monthly.successUpdated') });
    editDialogOpen.value = false;
    await Promise.all([loadReports(), loadCreditedSummary()]);
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
  await Promise.all([loadReports(), loadCreditedSummary()]);
}

void loadWorkplaceAddresses();
void loadReports();
void loadActiveShift();
void loadCreditedSummary();
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
