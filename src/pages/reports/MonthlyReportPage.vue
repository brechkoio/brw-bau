<template>
  <q-page class="column no-wrap">
    <TableFiltersBar>
      <q-select
        v-model="month"
        :options="monthOptions"
        :label="t('reports.monthly.monthLabel')"
        color="accent"
        bg-color="white"
        dense
        outlined
        style="min-width: 200px"
      />

      <q-space />

      <q-btn
        color="accent"
        text-color="black"
        icon="add"
        :label="t('reports.monthly.submit')"
        unelevated
        no-caps
        dense
        class="text-weight-bold"
        @click="openAdd"
      />
    </TableFiltersBar>

    <div class="brw-page-body q-pa-md">
      <div class="text-h6 q-mb-md">{{ t('reports.monthly.title') }}</div>

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
          <q-td :props="props">{{ weekdayLabel(props.row.work_date) }}</q-td>
        </template>

        <template #body-cell-time="props">
          <q-td :props="props">
            {{ formatTime(props.row.start_time) }}–{{ formatTime(props.row.end_time) }}
          </q-td>
        </template>

        <template #body-cell-earned="props">
          <q-td :props="props">{{ formatMoney(props.row.earned) }}</q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn flat dense round icon="edit" size="sm" @click="openEdit(props.row)" />
            <q-btn flat dense round icon="delete" size="sm" @click="confirmDelete(props.row)" />
          </q-td>
        </template>
      </q-table>

      <div v-if="filteredRows.length" class="row q-col-gutter-xl q-mt-md text-subtitle1">
        <div>
          {{ t('reports.monthly.totalHours') }}: <strong>{{ totalHours }}</strong>
        </div>
        <div>
          {{ t('reports.monthly.totalEarned') }}: <strong>{{ formatMoney(totalEarned) }}</strong>
        </div>
      </div>

      <q-dialog v-model="editDialogOpen">
        <q-card style="min-width: 320px">
          <q-card-section class="text-h6">{{ t('common.edit') }}</q-card-section>
          <q-card-section class="column q-gutter-md">
            <q-select
              v-model="editForm.siteId"
              :options="siteOptions"
              :label="t('reports.monthly.siteLabel')"
              color="accent"
              outlined
              emit-value
              map-options
            />
            <q-input
              v-model="editForm.workDate"
              type="date"
              :label="t('reports.monthly.dateLabel')"
              outlined
            />
            <q-input
              v-model="editForm.startTime"
              type="time"
              :label="t('reports.monthly.startTimeLabel')"
              outlined
            />
            <q-input
              v-model="editForm.endTime"
              type="time"
              :label="t('reports.monthly.endTimeLabel')"
              outlined
            />
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

      <AddWorkReportDialog v-model="addDialogOpen" @saved="loadReports" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import { supabase } from '@/boot/supabase';
import { useAuthStore } from '@/stores/auth-store';
import TableFiltersBar from '@/components/TableFiltersBar.vue';
import AddWorkReportDialog from '@/components/AddWorkReportDialog.vue';

interface ReportRow {
  id: string;
  work_date: string;
  start_time: string;
  end_time: string;
  hours: number;
  earned: number;
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

const now = new Date();
const monthOptions = computed(() => {
  const monthNames = i18n.tm('months');
  return monthNames.map((label, idx) => ({
    label: `${label} ${now.getFullYear()}`,
    value: `${now.getFullYear()}-${String(idx + 1).padStart(2, '0')}`,
  }));
});
const month = ref(monthOptions.value[now.getMonth()]!);

const rows = ref<ReportRow[]>([]);
const siteOptions = ref<SiteOption[]>([]);
const loading = ref(false);
const saving = ref(false);

const addDialogOpen = ref(false);

function openAdd() {
  addDialogOpen.value = true;
}

const filteredRows = computed(() => {
  const prefix = month.value.value;
  return rows.value
    .filter((r) => r.work_date.startsWith(prefix))
    .sort((a, b) => a.work_date.localeCompare(b.work_date));
});

const totalHours = computed(() =>
  filteredRows.value.reduce((sum, r) => sum + Number(r.hours), 0).toFixed(2),
);
const totalEarned = computed(() =>
  filteredRows.value.reduce((sum, r) => sum + Number(r.earned), 0),
);

const columns = computed<QTableColumn[]>(() => [
  { name: 'work_date', label: t('reports.monthly.columnDate'), field: 'work_date', align: 'left' },
  { name: 'weekday', label: t('reports.monthly.columnWeekday'), field: 'work_date', align: 'left' },
  { name: 'site_name', label: t('reports.monthly.columnSite'), field: 'site_name', align: 'left' },
  { name: 'time', label: t('reports.monthly.columnTime'), field: 'start_time', align: 'left' },
  { name: 'hours', label: t('reports.monthly.columnHours'), field: 'hours', align: 'left' },
  { name: 'earned', label: t('reports.monthly.columnEarned'), field: 'earned', align: 'left' },
  { name: 'actions', label: t('reports.monthly.columnActions'), field: 'id', align: 'left' },
]);

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

function formatTime(value: string) {
  return value.slice(0, 5);
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
        end_time: editForm.value.endTime,
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
