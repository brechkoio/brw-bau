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
        :no-data-label="t('admin.loginFailures.noRows')"
        :rows-per-page-options="[25, 50, 100, 0]"
        :pagination="{ rowsPerPage: 25 }"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import { supabase } from '@/boot/supabase';
import TableFiltersBar from '@/components/TableFiltersBar.vue';
import TableFilter from '@/components/TableFilter.vue';
import { exportTableToXlsx } from '@/utils/export-xlsx';
import { toLocalIsoDate } from '@/utils/format-date';
import { authReasonMessageKey } from '@/utils/auth-errors';

// Newest first; older attempts are rarely what anyone is asking about.
const ROW_LIMIT = 1000;

interface FailureRow {
  id: number;
  occurred_at: string;
  email: string;
  name: string;
  method: 'password' | 'google';
  reason: string;
  device: string;
  ip: string;
}

const $q = useQuasar();
const { t } = useI18n();

const rows = ref<FailureRow[]>([]);
const search = ref('');
const loading = ref(false);

const filteredRows = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return rows.value;
  return rows.value.filter(
    (r) =>
      r.email.toLowerCase().includes(query) ||
      r.name.toLowerCase().includes(query) ||
      r.ip.includes(query),
  );
});

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString('de-DE', { hour12: false });
  const [y, m, day] = toLocalIsoDate(d).split('-');
  return `${day}.${m}.${y} ${time}`;
}

// Full user agents are unreadable in a table cell; the OS and browser are
// what tells an admin "it was their phone" vs. "it was the office PC".
function describeDevice(ua: string | null): string {
  if (!ua) return '';
  const os =
    ua.match(/Android [\d.]+/)?.[0] ??
    ua
      .match(/iPhone OS [\d_]+/)?.[0]
      ?.replace(/_/g, '.')
      .replace('iPhone OS', 'iOS') ??
    (/Windows/.test(ua)
      ? 'Windows'
      : /Mac OS X/.test(ua)
        ? 'macOS'
        : /Linux/.test(ua)
          ? 'Linux'
          : '');
  const browser =
    ua.match(/(Edg|OPR|SamsungBrowser|Firefox|CriOS|Chrome)\/[\d]+/)?.[0] ??
    (/Safari\//.test(ua) ? 'Safari' : '');
  return [os, browser].filter(Boolean).join(' · ') || ua.slice(0, 60);
}

const columns = computed<QTableColumn<FailureRow>[]>(() => [
  {
    name: 'occurred_at',
    label: t('admin.loginFailures.columnTime'),
    field: 'occurred_at',
    format: (val: string) => formatDateTime(val),
    align: 'left',
    sortable: true,
  },
  {
    name: 'email',
    label: t('admin.loginFailures.columnEmail'),
    field: 'email',
    align: 'left',
    sortable: true,
  },
  {
    name: 'name',
    label: t('admin.loginFailures.columnName'),
    field: 'name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'method',
    label: t('admin.loginFailures.columnMethod'),
    field: 'method',
    format: (val: FailureRow['method']) =>
      val === 'google'
        ? t('admin.loginFailures.methodGoogle')
        : t('admin.loginFailures.methodPassword'),
    align: 'left',
    sortable: true,
  },
  {
    name: 'reason',
    label: t('admin.loginFailures.columnReason'),
    field: 'reason',
    align: 'left',
    sortable: true,
  },
  {
    name: 'device',
    label: t('admin.loginFailures.columnDevice'),
    field: 'device',
    align: 'left',
  },
  {
    name: 'ip',
    label: t('admin.loginFailures.columnIp'),
    field: 'ip',
    align: 'left',
  },
]);

async function onExport() {
  const ok = await exportTableToXlsx(
    `login-failures-${toLocalIsoDate(new Date())}.xlsx`,
    columns.value,
    filteredRows.value,
  );
  if (!ok) {
    $q.notify({ type: 'negative', message: t('common.exportError') });
  }
}

async function loadRows() {
  loading.value = true;
  const [failures, profiles] = await Promise.all([
    supabase
      .from('login_failures')
      .select('id, occurred_at, email, method, error_code, error_message, ip, user_agent')
      .order('occurred_at', { ascending: false })
      .limit(ROW_LIMIT),
    supabase.from('profiles').select('email, first_name, last_name'),
  ]);
  loading.value = false;
  const error = failures.error ?? profiles.error;
  if (error) {
    $q.notify({
      type: 'negative',
      message: error.message || t('admin.loginFailures.errorFallback'),
    });
    return;
  }

  const nameByEmail = new Map(
    (profiles.data ?? []).map((p) => [p.email.toLowerCase(), `${p.first_name} ${p.last_name}`]),
  );
  rows.value = (failures.data ?? []).map((f) => {
    const reasonKey = authReasonMessageKey(f.error_code);
    return {
      id: f.id,
      occurred_at: f.occurred_at,
      email: f.email ?? '',
      // Not every attempt is a known user — a typo in the email is one of
      // the commonest reasons a login fails.
      name: (f.email && nameByEmail.get(f.email)) || t('admin.loginFailures.unknownUser'),
      method: f.method,
      reason: reasonKey ? t(reasonKey) : f.error_message,
      device: describeDevice(f.user_agent),
      ip: f.ip ?? '',
    };
  });
}

void loadRows();
</script>
