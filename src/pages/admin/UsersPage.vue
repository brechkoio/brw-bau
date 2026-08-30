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
        :rows="filteredUsers"
        :columns="columns"
        row-key="id"
        flat
        bordered
        :loading="loading"
        :no-data-label="t('admin.users.noUsers')"
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

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

const $q = useQuasar();
const { t } = useI18n();

const users = ref<UserRow[]>([]);
const search = ref('');
const loading = ref(false);

const filteredUsers = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return users.value;
  return users.value.filter(
    (u) => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query),
  );
});

const columns = computed<QTableColumn<UserRow>[]>(() => [
  {
    name: 'name',
    label: t('admin.users.columnName'),
    field: 'name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'email',
    label: t('admin.users.columnEmail'),
    field: 'email',
    align: 'left',
    sortable: true,
  },
  {
    name: 'role',
    label: t('admin.users.columnRole'),
    field: 'role',
    format: (val: UserRow['role']) =>
      val === 'admin' ? t('layout.roleAdmin') : t('layout.roleWorker'),
    align: 'left',
    sortable: true,
  },
  {
    name: 'created_at',
    label: t('admin.users.columnRegistered'),
    field: 'created_at',
    format: (val: string) => val.slice(0, 10),
    align: 'left',
    sortable: true,
  },
]);

async function onExport() {
  const ok = await exportTableToXlsx(
    `users-${toLocalIsoDate(new Date()).slice(0, 7)}.xlsx`,
    columns.value,
    filteredUsers.value,
  );
  if (!ok) {
    $q.notify({ type: 'negative', message: t('common.exportError') });
  }
}

async function loadUsers() {
  loading.value = true;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, role, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  loading.value = false;
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  users.value = (data ?? []).map((u) => ({
    id: u.id,
    name: `${u.first_name} ${u.last_name}`,
    email: u.email,
    role: u.role,
    created_at: u.created_at,
  }));
}

void loadUsers();
</script>
