<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => emit('update:modelValue', val)"
    :position="$q.screen.lt.sm ? 'bottom' : 'standard'"
  >
    <q-card :class="$q.screen.lt.sm ? 'brw-sheet' : ''" style="width: 440px; max-width: 100vw">
      <div v-if="$q.screen.lt.sm" class="brw-sheet-handle" />

      <q-card-section class="brw-dialog-header">
        <div class="brw-dialog-header__text">
          <div class="brw-dialog-title">{{ t('reports.monthly.submit') }}</div>
          <div class="brw-dialog-hint">{{ t('reports.monthly.addHint') }}</div>
        </div>
        <q-btn
          v-if="!$q.screen.lt.sm"
          flat
          dense
          round
          icon="close"
          class="brw-dialog-close"
          v-close-popup
        />
      </q-card-section>

      <q-form @submit.prevent="onSave">
        <q-card-section class="brw-dialog-body">
          <div class="brw-field">
            <label for="report-site">{{ t('reports.monthly.siteLabel') }}</label>
            <q-select
              for="report-site"
              v-model="form.siteId"
              :options="siteOptions"
              :placeholder="t('reports.monthly.sitePlaceholder')"
              outlined
              emit-value
              map-options
              hide-bottom-space
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

          <div class="brw-field">
            <label for="report-date">{{ t('reports.monthly.dateLabel') }}</label>
            <q-input
              for="report-date"
              v-model="form.workDate"
              outlined
              readonly
              hide-bottom-space
              class="brw-input cursor-pointer"
            >
              <template #append>
                <q-icon name="event" />
              </template>
              <q-popup-proxy ref="workDateProxy" transition-show="scale" transition-hide="scale">
                <q-date
                  v-model="form.workDate"
                  mask="YYYY-MM-DD"
                  today-btn
                  color="accent"
                  text-color="dark"
                  class="brw-picker"
                  @update:model-value="() => workDateProxy?.hide()"
                />
              </q-popup-proxy>
            </q-input>
          </div>

          <div class="brw-time-row">
            <div class="brw-field">
              <label for="report-start">{{ t('reports.monthly.startTimeLabel') }}</label>
              <q-input
                for="report-start"
                v-model="form.startTime"
                outlined
                readonly
                hide-bottom-space
                class="brw-input cursor-pointer"
              >
                <template #append>
                  <q-icon name="schedule" />
                </template>
                <q-popup-proxy ref="startTimeProxy" transition-show="scale" transition-hide="scale">
                  <q-time
                    v-model="form.startTime"
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
              <label for="report-end">{{ t('reports.monthly.endTimeLabel') }}</label>
              <q-input
                for="report-end"
                v-model="form.endTime"
                outlined
                readonly
                hide-bottom-space
                :class="['brw-input', 'cursor-pointer', { 'brw-input--error': isRangeInverted }]"
              >
                <template #append>
                  <q-icon name="schedule" />
                </template>
                <q-popup-proxy ref="endTimeProxy" transition-show="scale" transition-hide="scale">
                  <q-time
                    v-model="form.endTime"
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
          </div>

          <div class="brw-hours-hint" :class="{ 'brw-hours-hint--error': isRangeInverted }">
            <q-icon :name="hoursHint.icon" size="16px" />
            <span>{{ hoursHint.text }}</span>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="brw-dialog-actions">
          <q-btn flat no-caps class="brw-btn-ghost" :label="t('common.cancel')" v-close-popup />
          <q-btn
            type="submit"
            unelevated
            no-caps
            class="brw-btn-primary brw-btn-primary--dialog"
            :label="t('common.save')"
            :loading="saving"
            :disable="!canSave"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar, type QPopupProxy } from 'quasar';
import { useI18n } from 'vue-i18n';
import { supabase } from '@/boot/supabase';
import { useAuthStore } from '@/stores/auth-store';

interface SiteOption {
  label: string;
  value: string;
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
const workDateProxy = ref<QPopupProxy | null>(null);
const startTimeProxy = ref<QPopupProxy | null>(null);
const endTimeProxy = ref<QPopupProxy | null>(null);

function blankForm() {
  return {
    siteId: null as string | null,
    workDate: props.workDate ?? new Date().toISOString().slice(0, 10),
    startTime: '',
    endTime: '',
  };
}

const form = ref(blankForm());

watch(
  () => props.modelValue,
  (open) => {
    if (open) form.value = blankForm();
  },
);

const previewDurationHours = computed(() => {
  if (!form.value.startTime || !form.value.endTime) return 0;
  const [sh, sm] = form.value.startTime.split(':').map(Number);
  const [eh, em] = form.value.endTime.split(':').map(Number);
  if (sh === undefined || sm === undefined || eh === undefined || em === undefined) return 0;
  const minutes = eh * 60 + em - (sh * 60 + sm);
  return Math.max(0, minutes / 60);
});

const isRangeValid = computed(
  () => !!form.value.startTime && !!form.value.endTime && previewDurationHours.value > 0,
);
const isRangeInverted = computed(
  () => !!form.value.startTime && !!form.value.endTime && previewDurationHours.value <= 0,
);
const canSave = computed(() => !!form.value.siteId && isRangeValid.value);

const previewHours = computed(() => previewDurationHours.value.toFixed(2));

const hoursHint = computed(() => {
  if (!form.value.startTime || !form.value.endTime) {
    return { icon: 'schedule', text: t('reports.monthly.hoursHintEmpty') };
  }
  if (isRangeInverted.value) {
    return { icon: 'error', text: t('validation.endAfterStart') };
  }
  return {
    icon: 'schedule',
    text: t('reports.monthly.hoursHintValue', { hours: previewHours.value }),
  };
});

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

async function onSave() {
  if (!auth.user || !canSave.value) return;
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

.brw-dialog-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 20px 20px 4px;
}

.brw-dialog-header__text {
  flex: 1;
  min-width: 0;
}

.brw-dialog-title {
  font-size: 19px;
  font-weight: 600;
  color: $dark;
}

.brw-dialog-hint {
  margin-top: 2px;
  font-size: 12px;
  color: $text-muted;
}

.brw-dialog-close {
  width: 34px;
  height: 34px;
  min-height: 34px;
  flex-shrink: 0;
  border-radius: 9px;
  color: $text-secondary;

  &:hover {
    background: $secondary;
  }
}

.brw-dialog-body {
  padding: 16px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.brw-field label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: $text-secondary;
}

.brw-time-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.brw-hours-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 18px;
  font-size: 12px;
  color: $text-secondary;

  &--error {
    color: $field-invalid;
  }
}

.brw-dialog-actions {
  gap: 8px;
}

@media (max-width: 599px) {
  .brw-dialog-actions {
    flex-direction: column-reverse;
    align-items: stretch;
    padding: 0 20px 20px;
    gap: 8px;

    .brw-btn-primary,
    .brw-btn-ghost {
      width: 100%;
    }
  }
}
</style>
