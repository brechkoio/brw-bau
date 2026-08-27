<template>
  <div class="brw-filters-bar">
    <slot />
    <div class="brw-filters-bar__spacer" />
    <div class="brw-filters-bar__right">
      <slot name="summary" />
      <slot name="actions" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.brw-filters-bar {
  display: flex;
  align-items: flex-end;
  gap: 14px;
  flex-wrap: wrap;
  box-sizing: border-box;
  padding: 16px 20px;
  background: $panel-surface;
  border-bottom: 1px solid $hairline;
}

.brw-filters-bar__spacer {
  flex: 1;
}

.brw-filters-bar__right {
  display: flex;
  // Bottom-aligned, not centered: the summary block carries a label row
  // above its number (66px total, same as a filter column), while the
  // export button has no label and is only 44px — centering them would
  // leave the button's bottom floating above the filters' baseline.
  align-items: flex-end;
  gap: 16px;
}

@media (max-width: 599px) {
  .brw-filters-bar {
    flex-direction: column;
    align-items: stretch;
    padding: 12px 16px;
  }

  .brw-filters-bar__right {
    justify-content: space-between;
  }
}
</style>
