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

        <q-btn
          unelevated
          no-caps
          icon="add"
          :label="t('admin.sites.add')"
          class="brw-btn-primary"
          @click="addDialogOpen = true"
        />
      </template>
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

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn flat icon="edit" class="brw-table-icon-btn" @click="openEdit(props.row)" />
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
              unelevated
              no-caps
              class="brw-btn-primary"
              :label="t('common.save')"
              :loading="adding"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <q-dialog v-model="editDialogOpen">
      <q-card style="min-width: 320px">
        <q-card-section class="text-h6">{{ editingName }}</q-card-section>
        <q-form @submit.prevent="onSaveEdit">
          <q-card-section class="column q-gutter-md">
            <div class="text-caption text-grey-7">{{ t('admin.sites.coordsHint') }}</div>

            <div v-if="editForm.lat !== null && editForm.lng !== null" class="text-body1">
              {{ editForm.lat.toFixed(6) }}, {{ editForm.lng.toFixed(6) }}
            </div>
            <div v-else class="text-body1 text-grey-6">{{ t('admin.sites.coordsNotSet') }}</div>

            <div class="row q-gutter-sm">
              <q-btn
                unelevated
                no-caps
                icon="my_location"
                class="brw-btn-primary"
                :label="t('admin.sites.setCoords')"
                :loading="locating"
                @click="captureCoords"
              />
              <q-btn
                v-if="editForm.lat !== null"
                flat
                no-caps
                :label="t('admin.sites.clearCoords')"
                @click="clearCoords"
              />
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat :label="t('common.cancel')" v-close-popup />
            <q-btn
              type="submit"
              unelevated
              no-caps
              class="brw-btn-primary"
              :label="t('common.save')"
              :loading="saving"
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
import TableFilter from '@/components/TableFilter.vue';
import { exportTableToCsv } from '@/utils/export-csv';
import { getCurrentCoords } from '@/utils/geolocation';

interface Site {
  id: string;
  name: string;
  is_active: boolean;
  lat: number | null;
  lng: number | null;
}

const $q = useQuasar();
const { t } = useI18n();

const sites = ref<Site[]>([]);
const search = ref('');
const newSiteName = ref('');
const loading = ref(false);
const adding = ref(false);
const saving = ref(false);
const locating = ref(false);
const addDialogOpen = ref(false);
const editDialogOpen = ref(false);
const editingId = ref<string | null>(null);
const editingName = ref('');
const editForm = ref<{ lat: number | null; lng: number | null }>({ lat: null, lng: null });

async function captureCoords() {
  locating.value = true;
  try {
    const coords = await getCurrentCoords();
    if (!coords) {
      $q.notify({ type: 'negative', message: t('admin.sites.locationErrorFallback') });
      return;
    }
    editForm.value = coords;
  } finally {
    locating.value = false;
  }
}

function clearCoords() {
  editForm.value = { lat: null, lng: null };
}

function formatCoords(site: Site) {
  if (site.lat === null || site.lng === null) return '—';
  return `${site.lat.toFixed(6)}, ${site.lng.toFixed(6)}`;
}

function openEdit(site: Site) {
  editingId.value = site.id;
  editingName.value = site.name;
  editForm.value = { lat: site.lat, lng: site.lng };
  editDialogOpen.value = true;
}

async function onSaveEdit() {
  if (!editingId.value) return;
  saving.value = true;
  try {
    const { error } = await supabase
      .from('sites')
      .update({ lat: editForm.value.lat, lng: editForm.value.lng })
      .eq('id', editingId.value);
    if (error) throw error;
    editDialogOpen.value = false;
    await loadSites();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('admin.sites.errorFallback'),
    });
  } finally {
    saving.value = false;
  }
}

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
  {
    name: 'coords',
    label: t('admin.sites.columnCoords'),
    field: 'lat',
    format: (_val: number | null, row) => formatCoords(row),
    align: 'left',
  },
  { name: 'actions', label: t('admin.sites.columnActions'), field: 'id', align: 'left' },
]);

const exportColumns = computed(() => columns.value.filter((col) => col.name !== 'actions'));

function onExport() {
  const ok = exportTableToCsv('sites.csv', exportColumns.value, filteredSites.value);
  if (!ok) {
    $q.notify({ type: 'negative', message: t('common.exportError') });
  }
}

async function loadSites() {
  loading.value = true;
  const { data, error } = await supabase
    .from('sites')
    .select('id, name, is_active, lat, lng')
    .order('name');
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
