<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    :position="$q.screen.lt.sm ? 'bottom' : 'standard'"
  >
    <q-card :class="$q.screen.lt.sm ? 'brw-sheet' : ''" style="width: 440px; max-width: 100vw">
      <div v-if="$q.screen.lt.sm" class="brw-sheet-handle" />
      <q-card-section>
        <div class="text-h6">{{ t('reports.monthly.submit') }}</div>
      </q-card-section>
      <q-form @submit.prevent="onSave">
        <q-card-section class="column q-gutter-md q-pt-none">
          <q-select
            v-model="form.siteId"
            :options="siteOptions"
            :label="t('reports.monthly.siteLabel')"
            color="accent"
            outlined
            emit-value
            map-options
            :rules="[(val) => !!val || t('validation.requiredSite')]"
            lazy-rules
          />

          <q-input
            v-model="form.workDate"
            type="date"
            :label="t('reports.monthly.dateLabel')"
            color="accent"
            outlined
            :rules="[(val) => !!val || t('validation.requiredDate')]"
            lazy-rules
          />

          <div class="row q-col-gutter-sm">
            <div class="col-4">
              <q-input
                v-model="form.startTime"
                type="time"
                :label="t('reports.monthly.startTimeLabel')"
                color="accent"
                outlined
                :rules="[(val) => !!val || t('validation.requiredTime')]"
                lazy-rules
              />
            </div>
            <div class="col-4">
              <q-input
                v-model="form.endTime"
                type="time"
                :label="t('reports.monthly.endTimeLabel')"
                color="accent"
                outlined
                :rules="[
                  (val) => !!val || t('validation.requiredTime'),
                  () => isRangeValid || t('validation.endAfterStart'),
                ]"
                lazy-rules
              />
            </div>
            <div class="col-4">
              <q-input
                v-model.number="form.pauseMinutes"
                type="number"
                min="0"
                step="15"
                :label="t('home.pauseLabel')"
                color="accent"
                outlined
              />
            </div>
          </div>

          <div class="row q-gutter-sm">
            <q-btn
              v-for="preset in presets"
              :key="preset.label"
              dense
              no-caps
              outline
              :color="isPresetActive(preset) ? 'accent' : 'grey-5'"
              :text-color="isPresetActive(preset) ? 'black' : 'dark'"
              :class="isPresetActive(preset) ? 'bg-accent' : ''"
              class="brw-preset-chip"
              :label="preset.label"
              @click="applyPreset(preset)"
            />
          </div>

          <div class="brw-summary-banner row items-baseline justify-between">
            <div class="text-caption">{{ t('home.creditedHours') }}</div>
            <div class="text-h6 text-weight-bold">
              {{ previewHours }} {{ t('reports.monthly.columnHours') }} · {{ previewEarned }}
              {{ t('common.currency') }}
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps :label="t('common.cancel')" v-close-popup />
          <q-btn
            type="submit"
            color="accent"
            text-color="black"
            unelevated
            no-caps
            :label="t('common.save')"
            :loading="saving"
            :disable="!isRangeValid"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { supabase } from '@/boot/supabase';
import { useAuthStore } from '@/stores/auth-store';

interface SiteOption {
  label: string;
  value: string;
}

interface Preset {
  label: string;
  startTime: string;
  endTime: string;
  pauseMinutes: number;
}

const props = defineProps<{
  modelValue: boolean;
  workDate?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [];
}>();

const $q = useQuasar();
const { t } = useI18n();
const auth = useAuthStore();

const siteOptions = ref<SiteOption[]>([]);
const saving = ref(false);
const currentRate = ref(0);

const presets: Preset[] = [
  { label: '7:00–16:30 · 45', startTime: '07:00', endTime: '16:30', pauseMinutes: 45 },
  { label: '6:30–15:00 · 30', startTime: '06:30', endTime: '15:00', pauseMinutes: 30 },
  { label: '8:00–17:00 · 60', startTime: '08:00', endTime: '17:00', pauseMinutes: 60 },
];

function blankForm() {
  return {
    siteId: null as string | null,
    workDate: props.workDate ?? new Date().toISOString().slice(0, 10),
    startTime: '',
    endTime: '',
    pauseMinutes: 0,
  };
}

const form = ref(blankForm());

watch(
  () => props.modelValue,
  (open) => {
    if (open) form.value = blankForm();
  },
);

function isPresetActive(preset: Preset) {
  return (
    form.value.startTime === preset.startTime &&
    form.value.endTime === preset.endTime &&
    form.value.pauseMinutes === preset.pauseMinutes
  );
}

function applyPreset(preset: Preset) {
  form.value.startTime = preset.startTime;
  form.value.endTime = preset.endTime;
  form.value.pauseMinutes = preset.pauseMinutes;
}

const previewDurationHours = computed(() => {
  if (!form.value.startTime || !form.value.endTime) return 0;
  const [sh, sm] = form.value.startTime.split(':').map(Number);
  const [eh, em] = form.value.endTime.split(':').map(Number);
  if (sh === undefined || sm === undefined || eh === undefined || em === undefined) return 0;
  const minutes = eh * 60 + em - (sh * 60 + sm) - (form.value.pauseMinutes || 0);
  return Math.max(0, minutes / 60);
});

const isRangeValid = computed(
  () => !!form.value.startTime && !!form.value.endTime && previewDurationHours.value > 0,
);

const previewHours = computed(() => previewDurationHours.value.toFixed(2));
const previewEarned = computed(() => (previewDurationHours.value * currentRate.value).toFixed(2));

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

async function loadCurrentRate() {
  if (!auth.user) return;
  const { data } = await supabase
    .from('employee_rates')
    .select('hourly_rate')
    .eq('user_id', auth.user.id)
    .lte('effective_from', new Date().toISOString().slice(0, 10))
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle();
  currentRate.value = data ? Number(data.hourly_rate) : 0;
}

async function onSave() {
  if (!auth.user || !form.value.siteId || !isRangeValid.value) return;
  saving.value = true;
  try {
    const { error } = await supabase.from('work_reports').insert({
      user_id: auth.user.id,
      site_id: form.value.siteId,
      work_date: form.value.workDate,
      start_time: form.value.startTime,
      end_time: form.value.endTime,
    });
    if (error) throw error;
    $q.notify({ type: 'positive', message: t('reports.monthly.successAdded') });
    emit('update:modelValue', false);
    emit('saved');
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('reports.monthly.errorFallback'),
    });
  } finally {
    saving.value = false;
  }
}

void loadSites();
void loadCurrentRate();
</script>

<style lang="scss" scoped>
.brw-sheet {
  border-radius: 20px 20px 0 0;
  max-height: 92vh;

  .brw-sheet-handle {
    width: 40px;
    height: 4px;
    border-radius: 99px;
    background: $separator-color;
    margin: 10px auto 0;
  }
}

.brw-preset-chip {
  border-radius: 99px;
}

.brw-summary-banner {
  background: #fffbe6;
  border: 1px solid #ffe97f;
  border-radius: 10px;
  padding: 12px 16px;
}
</style>
