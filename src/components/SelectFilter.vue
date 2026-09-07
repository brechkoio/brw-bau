<template>
  <TableFilter v-slot="{ inputId }" :label="label" :width="width">
    <q-select
      :for="inputId"
      :model-value="modelValue"
      :options="options"
      :placeholder="placeholder"
      outlined
      clearable
      emit-value
      map-options
      popup-content-class="brw-select__menu"
      class="brw-select brw-input--dense brw-entity-select"
      @update:model-value="$emit('update:modelValue', $event as string | null)"
    >
      <template #append>
        <div class="brw-entity-select__divider" />
      </template>
      <template #option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section>{{ scope.opt.label }}</q-item-section>
          <q-item-section v-if="scope.selected" side>
            <q-icon name="check" size="18px" class="brw-select__check" />
          </q-item-section>
        </q-item>
      </template>
    </q-select>
  </TableFilter>
</template>

<script setup lang="ts">
import TableFilter from '@/components/TableFilter.vue';

export interface SelectFilterOption {
  label: string;
  value: string;
}

withDefaults(
  defineProps<{
    modelValue: string | null;
    label: string;
    options: SelectFilterOption[];
    placeholder: string;
    width?: string;
  }>(),
  { width: '300px' },
);

defineEmits<{ 'update:modelValue': [value: string | null] }>();
</script>

<style lang="scss" scoped>
.brw-entity-select__divider {
  width: 1px;
  height: 22px;
  background: $separator-color;
}

.brw-entity-select :deep(.q-select__dropdown-icon) {
  color: $text-muted;
}

.brw-entity-select :deep(.q-field__focusable-action) {
  color: $text-hint;
  font-size: 18px;
}

.brw-entity-select :deep(.q-field__native) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
