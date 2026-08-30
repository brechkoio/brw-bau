<template>
  <TableFilter :label="t('reports.filters.period')" :width="width" v-slot="{ inputId }">
    <q-input
      :for="inputId"
      :model-value="rangeLabel"
      outlined
      readonly
      :disable="disable"
      :class="['brw-input', 'brw-input--dense', 'brw-period-input', { 'cursor-pointer': !disable }]"
    >
      <template #append>
        <q-icon name="event" />
      </template>
      <q-popup-proxy v-if="!disable" transition-show="scale" transition-hide="scale">
        <q-date
          v-model="rawDateRange"
          mask="YYYY-MM-DD"
          :default-year-month="defaultYearMonth"
          :default-view="monthsView ? 'Months' : undefined"
          range
          no-unset
          today-btn
          color="accent"
          text-color="dark"
        >
          <div class="row items-center justify-end">
            <q-btn v-close-popup flat no-caps color="dark" :label="t('common.confirm')" />
          </div>
        </q-date>
      </q-popup-proxy>
    </q-input>
  </TableFilter>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import TableFilter from '@/components/TableFilter.vue';
import { formatDisplayDate, toLocalIsoDate } from '@/utils/format-date';
import type { DateRange } from '@/utils/date-range';

const props = withDefaults(
  defineProps<{
    modelValue: DateRange;
    width?: string;
    monthsView?: boolean;
    disable?: boolean;
  }>(),
  { width: '280px', monthsView: false, disable: false },
);

const emit = defineEmits<{ 'update:modelValue': [value: DateRange] }>();

const { t } = useI18n();

// q-date's range model collapses to a plain date string when both ends of
// the range land on the same day (e.g. clicking one day twice) instead of
// { from, to } — normalize it back into an object either way. A computed
// get/set (not a local ref + watch) keeps the parent's ref as the single
// source of truth, so an external reset (e.g. a page's "reset filters"
// button reassigning its own dateRange ref) flows straight through.
const rawDateRange = computed<string | DateRange>({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', typeof val === 'string' ? { from: val, to: val } : val);
  },
});

const rangeLabel = computed(
  () => `${formatDisplayDate(props.modelValue.from)} – ${formatDisplayDate(props.modelValue.to)}`,
);

// Guarantees the popup calendar opens on the current month even before any
// selection exists to derive it from.
const defaultYearMonth = toLocalIsoDate(new Date()).slice(0, 7).replace('-', '/');
</script>

<style lang="scss" scoped>
.brw-period-input :deep(.q-field__append) {
  color: $text-muted;
}
</style>
