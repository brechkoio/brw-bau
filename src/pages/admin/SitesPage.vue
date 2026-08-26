<template>
  <q-page class="column no-wrap">
    <TableFiltersBar>
      <q-input
        v-model="search"
        :label="t('common.search')"
        dense
        clearable
        outlined
        bg-color="white"
        style="min-width: 220px"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>

      <q-space />

      <q-btn
        unelevated
        no-caps
        icon="download"
        :label="t('common.export')"
        class="brw-btn-secondary"
        @click="onExport"
      />

      <q-btn
        color="accent"
        text-color="black"
        icon="add"
        :label="t('admin.sites.add')"
        unelevated
        no-caps
        dense
        class="text-weight-bold"
        @click="addDialogOpen = true"
      />
    </TableFiltersBar>

    <div class="brw-page-body q-pa-md">
      <q-table
        class="col brw-sticky-table"
        :rows="filteredSites"
        :columns="columns"
        row-key="id"
        flat
        bordered
        :loading="loading"
        :no-data-label="t('admin.sites.noSites')"
      >
        <template #body-cell-is_active="props">
          <q-td :props="props">
            <q-toggle :model-value="props.value" @update:model-value="toggleActive(props.row)" />
          </q-td>
        </template>
      </q-table>
    </div>

    <q-dialog v-model="addDialogOpen">
      <q-card style="min-width: 320px">
        <q-card-section class="text-h6">{{ t('admin.sites.add') }}</q-card-section>
        <q-form @submit.prevent="onAdd">
          <q-card-section>
            <q-input
              v-model="newSiteName"
              :label="t('admin.sites.nameLabel')"
              outlined
              :rules="[(val) => !!val || t('validation.requiredSiteName')]"
              lazy-rules
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat :label="t('common.cancel')" v-close-popup />
            <q-btn
              type="submit"
              color="accent"
              text-color="black"
              unelevated
              no-caps
              :label="t('common.save')"
              :loading="adding"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import { supabase } from '@/boot/supabase';
import TableFiltersBar from '@/components/TableFiltersBar.vue';
import { exportTableToCsv } from '@/utils/export-csv';

interface Site {
  id: string;
  name: string;
  is_active: boolean;
}

const $q = useQuasar();
const { t } = useI18n();

const sites = ref<Site[]>([]);
const search = ref('');
const newSiteName = ref('');
const loading = ref(false);
const adding = ref(false);
const addDialogOpen = ref(false);

const filteredSites = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return sites.value;
  return sites.value.filter((s) => s.name.toLowerCase().includes(query));
});

const columns = computed<QTableColumn<Site>[]>(() => [
  {
    name: 'name',
    label: t('admin.sites.columnName'),
    field: 'name',
    align: 'left',
    sortable: true,
  },
  { name: 'is_active', label: t('admin.sites.columnActive'), field: 'is_active', align: 'left' },
]);

function onExport() {
  const ok = exportTableToCsv('sites.csv', columns.value, filteredSites.value);
  if (!ok) {
    $q.notify({ type: 'negative', message: t('common.exportError') });
  }
}

async function loadSites() {
  loading.value = true;
  const { data, error } = await supabase.from('sites').select('id, name, is_active').order('name');
  loading.value = false;
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  sites.value = data ?? [];
}

async function onAdd() {
  if (!newSiteName.value) return;
  adding.value = true;
  try {
    const { error } = await supabase.from('sites').insert({ name: newSiteName.value });
    if (error) throw error;
    newSiteName.value = '';
    addDialogOpen.value = false;
    await loadSites();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('admin.sites.errorFallback'),
    });
  } finally {
    adding.value = false;
  }
}

async function toggleActive(site: Site) {
  const { error } = await supabase
    .from('sites')
    .update({ is_active: !site.is_active })
    .eq('id', site.id);
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  await loadSites();
}

void loadSites();
</script>
