<template>
  <q-page class="column no-wrap">
    <TableFiltersBar>
      <PeriodFilter v-model="dateRange" width="280px" />

      <template #summary>
        <div class="brw-summary">
          <div class="brw-summary__label">
            {{ t('reports.monthly.columnHours') }} &gt; {{ THRESHOLD_HOURS }}
          </div>
          <div class="brw-summary__value">{{ rows.length }}</div>
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

    <q-banner class="brw-hint q-mx-md q-mt-md">
      {{ t('reports.general.longShiftsHint', { hours: THRESHOLD_HOURS }) }}
    </q-banner>

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
      >
        <template #body-cell-hours="props">
          <q-td :props="props" class="text-negative text-weight-bold">{{ props.value }}</q-td>
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
            <label for="edit-general-site">{{ t('reports.monthly.siteLabel') }}</label>
            <q-select
              for="edit-general-site"
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
            @click="onSaveEdit"
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
import { exportTableToXlsx } from '@/utils/export-xlsx';
import { formatDisplayDate } from '@/utils/format-date';
import { currentMonthRange } from '@/utils/date-range';
import { formatHoursLabel } from '@/utils/format-hours';

const THRESHOLD_HOURS = 8;

interface ReportRow {
  id: string;
  work_date: string;
  start_time: string;
  end_time: string | null;
  hours: number;
  earned: number;
  site_id: string;
  site_name: string;
  user_id: string | null;
  worker_name: string;
}

interface SiteOption {
  label: string;
  value: string;
}

const $q = useQuasar();
const { t } = useI18n();

const dateRange = ref(currentMonthRange());
const rawRows = ref<ReportRow[]>([]);
const siteOptions = ref<SiteOption[]>([]);
const loading = ref(false);
const saving = ref(false);

const rows = computed(() =>
  [...rawRows.value].sort((a, b) => b.work_date.localeCompare(a.work_date)),
);

function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : '';
}

function formatMoney(value: number) {
  return `${Number(value).toFixed(2)} ${t('common.currency')}`;
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
    format: (val: string, row) => `${formatTime(val)}–${formatTime(row.end_time)}`,
    align: 'left',
    sortable: true,
  },
  {
    name: 'hours',
    label: t('reports.monthly.columnHours'),
    field: 'hours',
    format: (val: number) => formatHoursLabel(val, t),
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

async function loadSites() {
  const { data, error } = await supabase
    .from('sites')
    .select('id, name')
    .eq('is_active', true)
    .order('name');
  if (error) return;
  siteOptions.value = (data ?? []).map((s) => ({ label: s.name, value: s.id }));
}

async function loadRows() {
  loading.value = true;
  const [{ data, error }, { data: profiles }] = await Promise.all([
    supabase
      .from('work_report_earnings')
      .select('id, work_date, start_time, end_time, hours, earned, site_id, site_name, user_id')
      .gt('hours', THRESHOLD_HOURS)
      .gte('work_date', dateRange.value.from)
      .lte('work_date', dateRange.value.to),
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

watch(dateRange, () => void loadRows());

void loadSites();
void loadRows();
</script>

<style lang="scss" scoped>
.brw-field label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: $text-secondary;
}

.brw-hint {
  border-radius: 12px;
  background: $accent-soft;
  border: 1px solid $accent-soft-border;
  color: $accent-ink;
  font-size: 13px;
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
