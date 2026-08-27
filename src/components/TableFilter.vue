<template>
  <div class="brw-filter" :style="{ minWidth: width ?? 'auto' }">
    <label :for="inputId" class="brw-filter__label">{{ label }}</label>
    <slot :inputId="inputId" />
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue';

defineProps<{
  label: string;
  width?: string;
}>();

defineSlots<{
  default(props: { inputId: string }): unknown;
}>();

const inputId = useId();
</script>

<style lang="scss" scoped>
.brw-filter {
  display: flex;
  flex-direction: column;
}

// line-height:16px + margin-bottom:6px = a fixed 22px label row, shared
// with `.brw-summary__label` in SitesReportPage.vue — the panel is a strict
// two-row grid (22px labels / 44px controls), not freely-sized blocks.
.brw-filter__label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: $text-secondary;
}
</style>
