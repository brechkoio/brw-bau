<template>
  <q-page class="column no-wrap">
    <TableFiltersBar>
      <PeriodFilter v-model="dateRange" width="280px" />

      <SelectFilter
        v-model="selectedUserId"
        :label="t('reports.filters.employee')"
        :options="userOptions"
        :placeholder="t('reports.general.allEmployees')"
        width="260px"
      />

      <template #summary>
        <div class="brw-summary">
          <div class="brw-summary__label">
            {{ t('reports.monthly.columnHours') }} &gt; {{ THRESHOLD_HOURS }}
          </div>
          <div class="brw-summary__value">{{ longShiftsCount }}</div>
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
        class="col brw-sticky-table"
        :rows="rows"
        :columns="columns"
        row-key="id"
        flat
        bordered
        :loading="loading"
        :no-data-label="t('reports.general.noResults')"
        :rows-per-page-options="[25, 50, 100, 0]"
        :pagination="{ rowsPerPage: 25 }"
      >
        <template #body-cell-hours="props">
          <q-td
            :props="props"
            :class="{ 'text-negative text-weight-bold': (props.row.hours ?? 0) > THRESHOLD_HOURS }"
          >
            {{ props.value }}
          </q-td>
        </template>

        <template #body-cell-location="props">
          <q-td :props="props">
            <div class="row items-center no-wrap q-gutter-x-sm">
              <q-icon
                :name="locationIcon(props.row.start_location_status)"
                :color="locationColor(props.row.start_location_status)"
                size="20px"
              >
                <q-tooltip>{{
                  t('reports.general.locationStartTooltip', {
                    status: locationStatusLabel(props.row.start_location_status),
                  })
                }}</q-tooltip>
              </q-icon>
              <q-icon
                :name="locationIcon(props.row.end_location_status)"
                :color="locationColor(props.row.end_location_status)"
                size="20px"
              >
                <q-tooltip>{{
                  t('reports.general.locationEndTooltip', {
                    status: locationStatusLabel(props.row.end_location_status),
                  })
                }}</q-tooltip>
              </q-icon>
            </div>
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
    </div>

    <q-dialog v-model="editDialogOpen">
      <q-card style="min-width: 320px">
        <q-card-section class="text-h6">{{ t('common.edit') }}</q-card-section>
        <q-card-section class="column q-gutter-md">
          <div class="brw-field">
            <label for="edit-general-workplace-address">{{
              t('reports.monthly.workplaceAddressLabel')
            }}</label>
            <q-select
              for="edit-general-workplace-address"
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
            <q-popup-proxy ref="editWorkDateProxy" transition-show="scale" transition-hide="scale">
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
            <label for="edit-general-start">{{ t('reports.monthly.startTimeLabel') }}</label>
            <q-input
              for="edit-general-start"
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
            <label for="edit-general-end">{{ t('reports.monthly.endTimeLabel') }}</label>
            <q-input
              for="edit-general-end"
              v-model="editForm.endTime"
              outlined
              readonly
              class="brw-input cursor-pointer"
            >
              <template #append>
                <q-icon name="schedule" />
              </template>
              <q-popup-proxy ref="editEndTimeProxy" transition-show="scale" transition-hide="scale">
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
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar, type QTableColumn, type QPopupProxy } from 'quasar';
import { useI18n } from 'vue-i18n';
import { supabase } from '@/boot/supabase';
import TableFiltersBar from '@/components/TableFiltersBar.vue';
import PeriodFilter from '@/components/PeriodFilter.vue';
import SelectFilter from '@/components/SelectFilter.vue';
import { exportTableToXlsx } from '@/utils/export-xlsx';
import { formatDisplayDate } from '@/utils/format-date';
import { currentMonthRange } from '@/utils/date-range';
import { formatHoursLabel } from '@/utils/format-hours';

const THRESHOLD_HOURS = 8;

type LocationStatus = 'in_range' | 'out_of_range' | 'unknown' | null;

interface ReportRow {
  id: string;
  work_date: string;
  start_time: string;
  end_time: string | null;
  hours: number | null;
  earned: number | null;
  workplace_address_id: string;
  workplace_address_name: string;
  user_id: string | null;
  worker_name: string;
  start_location_status: LocationStatus;
  end_location_status: LocationStatus;
}

interface WorkplaceAddressOption {
  label: string;
  value: string;
}

interface UserOption {
  label: string;
  value: string;
}

const $q = useQuasar();
const { t } = useI18n();

const dateRange = ref(currentMonthRange());
const rawRows = ref<ReportRow[]>([]);
const workplaceAddressOptions = ref<WorkplaceAddressOption[]>([]);
const userOptions = ref<UserOption[]>([]);
const selectedUserId = ref<string | null>(null);
const loading = ref(false);
const saving = ref(false);

const rows = computed(() =>
  [...rawRows.value].sort((a, b) => b.work_date.localeCompare(a.work_date)),
);

const longShiftsCount = computed(
  () => rows.value.filter((r) => (r.hours ?? 0) > THRESHOLD_HOURS).length,
);

function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : '';
}

function formatMoney(value: number) {
  return `${Number(value).toFixed(2)} ${t('common.currency')}`;
}

function locationStatusLabel(status: LocationStatus) {
  switch (status) {
    case 'in_range':
      return t('reports.general.locationInRange');
    case 'out_of_range':
      return t('reports.general.locationOutOfRange');
    default:
      return t('reports.general.locationUnknown');
  }
}

function locationIcon(status: LocationStatus) {
  switch (status) {
    case 'in_range':
      return 'check_circle';
    case 'out_of_range':
      return 'warning';
    default:
      return 'help_outline';
  }
}

function locationColor(status: LocationStatus) {
  switch (status) {
    case 'in_range':
      return 'positive';
    case 'out_of_range':
      return 'negative';
    default:
      return 'grey-6';
  }
}

const columns = computed<QTableColumn<ReportRow>[]>(() => [
  {
    name: 'work_date',
    label: t('reports.monthly.columnDate'),
    field: 'work_date',
    format: (val: string) => formatDisplayDate(val),
    align: 'left',
    sortable: true,
  },
  {
    name: 'worker_name',
    label: t('admin.rates.columnEmployee'),
    field: 'worker_name',
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
    name: 'earned',
    label: t('reports.monthly.columnEarned'),
    field: 'earned',
    format: (val: number | null) => formatMoney(val ?? 0),
    align: 'left',
    sortable: true,
  },
  {
    name: 'location',
    label: t('reports.general.columnLocation'),
    field: (row) =>
      `${locationStatusLabel(row.start_location_status)} / ${locationStatusLabel(row.end_location_status)}`,
    align: 'left',
  },
  { name: 'actions', label: t('reports.monthly.columnActions'), field: 'id', align: 'left' },
]);

const exportColumns = computed(() => columns.value.filter((col) => col.name !== 'actions'));

async function onExport() {
  const ok = await exportTableToXlsx(
    `long-shifts-${dateRange.value.from.slice(0, 7)}.xlsx`,
    exportColumns.value,
    rows.value,
  );
  if (!ok) {
    $q.notify({ type: 'negative', message: t('common.exportError') });
  }
}

async function loadWorkplaceAddresses() {
  const { data, error } = await supabase
    .from('workplace_address')
    .select('id, name')
    .eq('is_active', true)
    .order('name');
  if (error) return;
  workplaceAddressOptions.value = (data ?? []).map((s) => ({ label: s.name, value: s.id }));
}

async function loadUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .order('first_name');
  if (error) return;
  userOptions.value = (data ?? []).map((p) => ({
    label: `${p.first_name} ${p.last_name}`,
    value: p.id,
  }));
}

async function loadRows() {
  loading.value = true;
  let query = supabase
    .from('work_report_earnings')
    .select(
      'id, work_date, start_time, end_time, hours, earned, workplace_address_id, workplace_address_name, user_id, start_location_status, end_location_status',
    )
    .gte('work_date', dateRange.value.from)
    .lte('work_date', dateRange.value.to);
  if (selectedUserId.value) {
    query = query.eq('user_id', selectedUserId.value);
  }
  const [{ data, error }, { data: profiles }] = await Promise.all([
    query,
    supabase.from('profiles').select('id, first_name, last_name'),
  ]);
  loading.value = false;
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  const nameById = new Map((profiles ?? []).map((p) => [p.id, `${p.first_name} ${p.last_name}`]));
  rawRows.value = (data ?? []).map((r) => ({
    ...r,
    worker_name: r.user_id
      ? (nameById.get(r.user_id) ?? t('reports.deletedEmployee'))
      : t('reports.deletedEmployee'),
  }));
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
    await loadRows();
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
  await loadRows();
}

watch([dateRange, selectedUserId], () => void loadRows());

void loadWorkplaceAddresses();
void loadUsers();
void loadRows();
</script>

<style lang="scss" scoped>
.brw-field label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: $text-secondary;
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
</style>
