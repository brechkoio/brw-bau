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
          :label="t('admin.workplaceAddress.add')"
          class="brw-btn-primary"
          @click="addDialogOpen = true"
        />
      </template>
    </TableFiltersBar>

    <div class="brw-page-body q-pa-md">
      <q-table
        class="col brw-sticky-table"
        :rows="filteredWorkplaceAddresses"
        :columns="columns"
        row-key="id"
        flat
        bordered
        :loading="loading"
        :no-data-label="t('admin.workplaceAddress.noWorkplaceAddresses')"
      >
        <template #body-cell-address="props">
          <q-td :props="props">{{ props.value }}</q-td>
        </template>

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
        <q-card-section class="text-h6">{{ t('admin.workplaceAddress.add') }}</q-card-section>
        <q-form @submit.prevent="onAdd">
          <q-card-section class="column q-gutter-md">
            <q-input
              v-model="newWorkplaceAddressName"
              :label="t('admin.workplaceAddress.nameLabel')"
              outlined
              class="brw-input"
              :rules="[(val) => !!val || t('validation.requiredWorkplaceAddressName')]"
              lazy-rules
            />
            <q-input
              v-model="newWorkplaceAddressCity"
              :label="t('admin.workplaceAddress.cityLabel')"
              outlined
              class="brw-input"
              :rules="[(val) => !!val || t('validation.requiredCity')]"
              lazy-rules
            />
            <q-input
              v-model="newWorkplaceAddressStreet"
              :label="t('admin.workplaceAddress.streetLabel')"
              outlined
              class="brw-input"
              :rules="[(val) => !!val || t('validation.requiredStreet')]"
              lazy-rules
            />
            <q-input
              v-model="newWorkplaceAddressHouseNumber"
              :label="t('admin.workplaceAddress.houseNumberLabel')"
              outlined
              class="brw-input"
              :rules="[(val) => !!val || t('validation.requiredHouseNumber')]"
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
        <q-card-section class="text-h6">{{ t('common.edit') }}</q-card-section>
        <q-form @submit.prevent="confirmSaveEdit">
          <q-card-section class="column q-gutter-md">
            <q-input
              v-model="editForm.name"
              :label="t('admin.workplaceAddress.nameLabel')"
              outlined
              class="brw-input"
              :rules="[(val) => !!val || t('validation.requiredWorkplaceAddressName')]"
              lazy-rules
            />
            <q-input
              v-model="editForm.city"
              :label="t('admin.workplaceAddress.cityLabel')"
              outlined
              class="brw-input"
              :rules="[(val) => !!val || t('validation.requiredCity')]"
              lazy-rules
            />
            <q-input
              v-model="editForm.street"
              :label="t('admin.workplaceAddress.streetLabel')"
              outlined
              class="brw-input"
              :rules="[(val) => !!val || t('validation.requiredStreet')]"
              lazy-rules
            />
            <q-input
              v-model="editForm.houseNumber"
              :label="t('admin.workplaceAddress.houseNumberLabel')"
              outlined
              class="brw-input"
              :rules="[(val) => !!val || t('validation.requiredHouseNumber')]"
              lazy-rules
            />

            <div class="text-caption text-grey-7">{{ t('admin.workplaceAddress.coordsHint') }}</div>

            <div v-if="editForm.lat !== null && editForm.lng !== null" class="text-body1">
              {{ editForm.lat.toFixed(6) }}, {{ editForm.lng.toFixed(6) }}
            </div>
            <div v-else class="text-body1 text-grey-6">
              {{ t('admin.workplaceAddress.coordsNotSet') }}
            </div>

            <div class="row q-gutter-sm">
              <q-btn
                unelevated
                no-caps
                icon="my_location"
                class="brw-btn-primary"
                :label="t('admin.workplaceAddress.setCoords')"
                :loading="locating"
                @click="captureCoords"
              />
              <q-btn
                v-if="editForm.lat !== null"
                flat
                no-caps
                :label="t('admin.workplaceAddress.clearCoords')"
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
import { exportTableToXlsx } from '@/utils/export-xlsx';
import { getCurrentCoords } from '@/utils/geolocation';
import { toLocalIsoDate } from '@/utils/format-date';

interface WorkplaceAddress {
  id: string;
  name: string;
  is_active: boolean;
  lat: number | null;
  lng: number | null;
  city: string | null;
  street: string | null;
  house_number: string | null;
}

const $q = useQuasar();
const { t } = useI18n();

const workplaceAddresses = ref<WorkplaceAddress[]>([]);
const search = ref('');
const newWorkplaceAddressName = ref('');
const newWorkplaceAddressCity = ref('');
const newWorkplaceAddressStreet = ref('');
const newWorkplaceAddressHouseNumber = ref('');
const loading = ref(false);
const adding = ref(false);
const saving = ref(false);
const locating = ref(false);
const addDialogOpen = ref(false);
const editDialogOpen = ref(false);
const editingId = ref<string | null>(null);
const editForm = ref<{
  name: string;
  lat: number | null;
  lng: number | null;
  city: string;
  street: string;
  houseNumber: string;
}>({ name: '', lat: null, lng: null, city: '', street: '', houseNumber: '' });

async function captureCoords() {
  locating.value = true;
  try {
    const coords = await getCurrentCoords();
    if (!coords) {
      $q.notify({ type: 'negative', message: t('admin.workplaceAddress.locationErrorFallback') });
      return;
    }
    editForm.value = { ...editForm.value, ...coords };
  } finally {
    locating.value = false;
  }
}

function clearCoords() {
  editForm.value = { ...editForm.value, lat: null, lng: null };
}

function formatCoords(workplaceAddress: WorkplaceAddress) {
  if (workplaceAddress.lat === null || workplaceAddress.lng === null) return '—';
  return `${workplaceAddress.lat.toFixed(6)}, ${workplaceAddress.lng.toFixed(6)}`;
}

function formatAddress(workplaceAddress: WorkplaceAddress) {
  const parts = [
    workplaceAddress.city,
    workplaceAddress.street,
    workplaceAddress.house_number,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

function openEdit(workplaceAddress: WorkplaceAddress) {
  editingId.value = workplaceAddress.id;
  editForm.value = {
    name: workplaceAddress.name,
    lat: workplaceAddress.lat,
    lng: workplaceAddress.lng,
    city: workplaceAddress.city ?? '',
    street: workplaceAddress.street ?? '',
    houseNumber: workplaceAddress.house_number ?? '',
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
      .from('workplace_address')
      .update({
        name: editForm.value.name,
        lat: editForm.value.lat,
        lng: editForm.value.lng,
        city: editForm.value.city,
        street: editForm.value.street,
        house_number: editForm.value.houseNumber,
      })
      .eq('id', editingId.value);
    if (error) throw error;
    editDialogOpen.value = false;
    await loadWorkplaceAddresses();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('admin.workplaceAddress.errorFallback'),
    });
  } finally {
    saving.value = false;
  }
}

const filteredWorkplaceAddresses = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return workplaceAddresses.value;
  return workplaceAddresses.value.filter((s) => s.name.toLowerCase().includes(query));
});

const columns = computed<QTableColumn<WorkplaceAddress>[]>(() => [
  {
    name: 'name',
    label: t('admin.workplaceAddress.columnName'),
    field: 'name',
    align: 'left',
    sortable: true,
  },
  {
    name: 'address',
    label: t('admin.workplaceAddress.columnAddress'),
    field: 'city',
    format: (_val: string | null, row) => formatAddress(row),
    align: 'left',
  },
  {
    name: 'is_active',
    label: t('admin.workplaceAddress.columnActive'),
    field: 'is_active',
    align: 'left',
  },
  {
    name: 'coords',
    label: t('admin.workplaceAddress.columnCoords'),
    field: 'lat',
    format: (_val: number | null, row) => formatCoords(row),
    align: 'left',
  },
  { name: 'actions', label: t('admin.workplaceAddress.columnActions'), field: 'id', align: 'left' },
]);

const exportColumns = computed(() => columns.value.filter((col) => col.name !== 'actions'));

async function onExport() {
  const ok = await exportTableToXlsx(
    `workplace-addresses-${toLocalIsoDate(new Date()).slice(0, 7)}.xlsx`,
    exportColumns.value,
    filteredWorkplaceAddresses.value,
  );
  if (!ok) {
    $q.notify({ type: 'negative', message: t('common.exportError') });
  }
}

async function loadWorkplaceAddresses() {
  loading.value = true;
  const { data, error } = await supabase
    .from('workplace_address')
    .select('id, name, is_active, lat, lng, city, street, house_number')
    .order('name');
  loading.value = false;
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  workplaceAddresses.value = data ?? [];
}

async function onAdd() {
  if (
    !newWorkplaceAddressName.value ||
    !newWorkplaceAddressCity.value ||
    !newWorkplaceAddressStreet.value ||
    !newWorkplaceAddressHouseNumber.value
  )
    return;
  adding.value = true;
  try {
    const { error } = await supabase.from('workplace_address').insert({
      name: newWorkplaceAddressName.value,
      city: newWorkplaceAddressCity.value,
      street: newWorkplaceAddressStreet.value,
      house_number: newWorkplaceAddressHouseNumber.value,
    });
    if (error) throw error;
    newWorkplaceAddressName.value = '';
    newWorkplaceAddressCity.value = '';
    newWorkplaceAddressStreet.value = '';
    newWorkplaceAddressHouseNumber.value = '';
    addDialogOpen.value = false;
    await loadWorkplaceAddresses();
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('admin.workplaceAddress.errorFallback'),
    });
  } finally {
    adding.value = false;
  }
}

async function toggleActive(workplaceAddress: WorkplaceAddress) {
  const { error } = await supabase
    .from('workplace_address')
    .update({ is_active: !workplaceAddress.is_active })
    .eq('id', workplaceAddress.id);
  if (error) {
    $q.notify({ type: 'negative', message: error.message });
    return;
  }
  await loadWorkplaceAddresses();
}

void loadWorkplaceAddresses();
</script>
