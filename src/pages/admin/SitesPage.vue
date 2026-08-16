<template>
  <q-page>
    <TableFiltersBar>
      <q-input
        v-model="search"
        :label="t('common.search')"
        dense
        clearable
        standout="bg-white text-dark"
        style="min-width: 220px"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </TableFiltersBar>

    <div class="q-pa-md">
      <div class="text-h6 q-mb-md">{{ t('admin.sites.title') }}</div>

      <q-form class="row items-start q-col-gutter-md q-mb-lg" @submit.prevent="onAdd">
        <q-input
          v-model="newSiteName"
          :label="t('admin.sites.nameLabel')"
          style="max-width: 300px"
          :rules="[(val) => !!val || t('validation.requiredSiteName')]"
          lazy-rules
        />

        <q-btn
          type="submit"
          color="accent"
          text-color="black"
          :label="t('admin.sites.add')"
          :loading="adding"
          unelevated
          no-caps
          class="text-weight-bold q-mt-sm"
        />
      </q-form>

      <q-table
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
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar, type QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import { supabase } from '@/boot/supabase';
import TableFiltersBar from '@/components/TableFiltersBar.vue';

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

const filteredSites = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return sites.value;
  return sites.value.filter((s) => s.name.toLowerCase().includes(query));
});

const columns = computed<QTableColumn[]>(() => [
  {
    name: 'name',
    label: t('admin.sites.columnName'),
    field: 'name',
    align: 'left',
    sortable: true,
  },
  { name: 'is_active', label: t('admin.sites.columnActive'), field: 'is_active', align: 'left' },
]);

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
