<template>
  <q-layout view="LHh Lpr lFf" class="brw-shell">
    <q-header class="brw-header">
      <q-toolbar class="brw-toolbar">
        <q-btn
          ref="burgerRef"
          flat
          unelevated
          no-caps
          icon="menu"
          class="brw-icon-btn"
          :aria-label="burgerAriaLabel"
          :aria-expanded="isMobile ? mobileOpen : undefined"
          :aria-pressed="isMobile ? undefined : !drawerExpanded"
          aria-controls="brw-main-drawer"
          @click="onBurgerClick"
        />

        <div class="brw-header-titles">
          <div class="brw-header-title">{{ pageTitle }}</div>
          <div v-if="!isMobile" class="brw-header-date">{{ headerDate }}</div>
        </div>

        <div class="brw-header-actions">
          <LocaleSwitcher v-if="!isMobile" variant="light" />

          <q-btn
            flat
            unelevated
            no-caps
            :icon="hasUnread ? 'notifications' : 'notifications_none'"
            class="brw-icon-btn brw-icon-btn--outlined"
            :aria-label="t('layout.notificationsAria')"
          >
            <span v-if="hasUnread" class="brw-notify-dot" aria-hidden="true" />
          </q-btn>

          <div class="brw-header-divider" aria-hidden="true" />

          <q-btn
            v-if="auth.profile"
            flat
            unelevated
            no-caps
            class="brw-profile-trigger"
            :aria-label="t('layout.profileMenu')"
          >
            <q-avatar :size="isMobile ? '34px' : '36px'" class="brw-avatar brw-avatar--header">
              <img v-if="auth.profile.avatar_url" :src="auth.profile.avatar_url" alt="" />
              <span v-else>{{ initials }}</span>
            </q-avatar>
            <div v-if="!isMobile" class="brw-profile-meta">
              <div class="brw-profile-name">{{ fullName }}</div>
              <div class="brw-profile-role">{{ roleLabel }}</div>
            </div>
            <q-icon v-if="!isMobile" name="expand_more" size="20px" />
            <q-menu
              class="brw-profile-menu"
              anchor="bottom right"
              self="top right"
              :offset="[0, 8]"
            >
              <q-list>
                <q-item v-close-popup clickable to="/settings">
                  <q-item-section>{{ t('settings.title') }}</q-item-section>
                </q-item>
                <q-item v-close-popup clickable @click="onLogout">
                  <q-item-section>{{ t('layout.logoutAria') }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      id="brw-main-drawer"
      v-model="drawerOpen"
      class="brw-drawer"
      :class="{ 'brw-drawer--mini': isMini }"
      :mini="isMini"
      :width="drawerWidth"
      :mini-width="76"
      :overlay="isMobile"
      :behavior="isMobile ? 'mobile' : 'desktop'"
      :persistent="!isMobile"
      :no-swipe-open="!isMobile"
      @hide="onDrawerHide"
    >
      <div class="brw-drawer__inner">
        <div class="brw-drawer__brand">
          <img :src="logo" alt="" class="brw-drawer__logo" />
          <span class="brw-drawer__brand-text">
            <strong>BRW</strong>
            Bau
          </span>
        </div>

        <nav class="brw-drawer__nav" :aria-label="t('layout.navAria')">
          <div v-if="!isMini" class="brw-nav-group">{{ t('layout.groupTracking') }}</div>
          <q-item
            v-for="item in trackingLinks"
            :key="item.to"
            :to="item.to"
            :exact="item.exact"
            clickable
            class="brw-nav-item"
            active-class="brw-nav-item--active"
            :aria-current="isLinkActive(item) ? 'page' : undefined"
          >
            <q-item-section avatar>
              <q-icon :name="item.icon" size="22px" />
            </q-item-section>
            <q-item-section class="brw-nav-label">{{ t(item.labelKey) }}</q-item-section>
            <q-tooltip v-if="isMini" anchor="center right" self="center left" :offset="[8, 0]">
              {{ t(item.labelKey) }}
            </q-tooltip>
          </q-item>

          <template v-if="auth.isAdmin">
            <div v-if="!isMini" class="brw-nav-group">{{ t('layout.groupAdmin') }}</div>
            <q-item
              v-for="item in adminLinks"
              :key="item.to"
              :to="item.to"
              clickable
              class="brw-nav-item"
              active-class="brw-nav-item--active"
              :aria-current="isLinkActive(item) ? 'page' : undefined"
            >
              <q-item-section avatar>
                <q-icon :name="item.icon" size="22px" />
              </q-item-section>
              <q-item-section class="brw-nav-label">{{ t(item.labelKey) }}</q-item-section>
              <q-tooltip v-if="isMini" anchor="center right" self="center left" :offset="[8, 0]">
                {{ t(item.labelKey) }}
              </q-tooltip>
            </q-item>
          </template>
        </nav>

        <div class="brw-drawer__footer">
          <q-item
            to="/settings"
            clickable
            class="brw-nav-item"
            active-class="brw-nav-item--active"
            :aria-current="route.path === '/settings' ? 'page' : undefined"
          >
            <q-item-section avatar>
              <q-icon name="settings" size="22px" />
            </q-item-section>
            <q-item-section class="brw-nav-label">{{ t('layout.navSettings') }}</q-item-section>
            <q-tooltip v-if="isMini" anchor="center right" self="center left" :offset="[8, 0]">
              {{ t('layout.navSettings') }}
            </q-tooltip>
          </q-item>

          <div v-if="auth.profile" class="brw-user-card">
            <q-avatar size="34px" class="brw-avatar brw-avatar--drawer">
              <img v-if="auth.profile.avatar_url" :src="auth.profile.avatar_url" alt="" />
              <span v-else>{{ initials }}</span>
            </q-avatar>
            <div v-if="!isMini" class="brw-user-card__meta">
              <div class="brw-user-card__name">{{ fullName }}</div>
              <div class="brw-user-card__role">{{ roleLabel }}</div>
            </div>
            <q-btn
              v-if="!isMini"
              flat
              unelevated
              round
              icon="logout"
              size="sm"
              class="brw-user-card__logout"
              :aria-label="t('layout.logoutAria')"
              @click="onLogout"
            />
            <q-tooltip v-if="isMini" anchor="center right" self="center left" :offset="[8, 0]">
              {{ fullName }}
            </q-tooltip>
          </div>

          <LocaleSwitcher v-if="isMobile" class="brw-drawer__locale" />
        </div>
      </div>
    </q-drawer>

    <q-page-container class="brw-page-container">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useAuthStore } from '@/stores/auth-store';
import LocaleSwitcher from '@/components/LocaleSwitcher.vue';
import logo from '@/assets/logo.png';

const COLLAPSED_KEY = 'brw.drawer.collapsed';

interface NavLink {
  to: string;
  icon: string;
  labelKey: string;
  exact?: boolean;
}

const trackingLinks: NavLink[] = [
  { to: '/', icon: 'home', labelKey: 'layout.navHome', exact: true },
  { to: '/reports/monthly', icon: 'calendar_month', labelKey: 'layout.navMonthlyReport' },
];

const adminLinks: NavLink[] = [
  { to: '/reports/general', icon: 'summarize', labelKey: 'layout.navGeneralReport' },
  { to: '/reports/sites', icon: 'apartment', labelKey: 'layout.navSitesReport' },
  { to: '/admin/rates', icon: 'payments', labelKey: 'layout.navEmployeeRates' },
  { to: '/admin/sites', icon: 'location_city', labelKey: 'layout.navSites' },
];

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const { t, locale } = useI18n();

const burgerRef = ref<{ $el?: HTMLElement } | null>(null);
const collapsed = ref(readCollapsed());
const tabletExpanded = ref(false);
const mobileOpen = ref(false);

// Placeholder until the notifications feed lands — drives the accent dot only.
const hasUnread = ref(false);

const isDesktop = computed(() => $q.screen.gt.sm);
const isTablet = computed(() => $q.screen.sm);
const isMobile = computed(() => $q.screen.lt.sm);

const isMini = computed(() => {
  if (isMobile.value) return false;
  if (isTablet.value) return !tabletExpanded.value;
  return collapsed.value;
});

const drawerExpanded = computed(() => {
  if (isDesktop.value) return !collapsed.value;
  if (isTablet.value) return tabletExpanded.value;
  return mobileOpen.value;
});

const drawerOpen = computed({
  get: () => (isMobile.value ? mobileOpen.value : true),
  set: (value: boolean) => {
    if (isMobile.value) {
      mobileOpen.value = value;
      return;
    }
    if (isTablet.value && !value) {
      tabletExpanded.value = false;
    }
  },
});

const drawerWidth = computed(() => {
  if (isMobile.value) {
    return Math.min(300, Math.round($q.screen.width * 0.84));
  }
  return 260;
});

const burgerAriaLabel = computed(() => {
  if (isMobile.value) return t('layout.menuAria');
  return drawerExpanded.value ? t('layout.collapseAria') : t('layout.expandAria');
});

const pageTitle = computed(() => {
  const key = typeof route.meta.title === 'string' ? route.meta.title : 'meta.title.fallback';
  return t(key);
});

const headerDate = computed(() => formatHeaderDate(locale.value));

const fullName = computed(() => {
  if (!auth.profile) return '';
  return `${auth.profile.last_name} ${auth.profile.first_name}`.trim();
});

const initials = computed(() => {
  if (!auth.profile) return '';
  return `${auth.profile.last_name.charAt(0)}${auth.profile.first_name.charAt(0)}`;
});

const roleLabel = computed(() => {
  if (auth.isAdmin) return t('layout.roleAdmin');
  return t('layout.roleWorker');
});

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function formatHeaderDate(localeCode: string): string {
  const raw = new Intl.DateTimeFormat(localeCode, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  return raw.replace(/\s*р\.?\s*$/i, '').replace(/^./, (char) => char.toUpperCase());
}

function isLinkActive(item: NavLink): boolean {
  if (item.exact) return route.path === item.to;
  return route.path === item.to || route.path.startsWith(`${item.to}/`);
}

function onBurgerClick() {
  if (isDesktop.value) {
    collapsed.value = !collapsed.value;
    return;
  }
  if (isTablet.value) {
    tabletExpanded.value = !tabletExpanded.value;
    return;
  }
  mobileOpen.value = !mobileOpen.value;
}

function onDrawerHide() {
  if (!isMobile.value) return;
  void nextTick(() => burgerRef.value?.$el?.focus());
}

async function onLogout() {
  await auth.signOut();
  await router.push('/login');
}

watch(collapsed, (value) => {
  try {
    localStorage.setItem(COLLAPSED_KEY, String(value));
  } catch {
    // ignore quota / private mode
  }
});

watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false;
    tabletExpanded.value = false;
  },
);
</script>

<style lang="scss" scoped>
.brw-toolbar {
  min-height: 64px;
  height: 64px;
  padding: 0 20px;
  gap: 14px;
}

.brw-header-titles {
  min-width: 0;
  flex: 1;
}

.brw-header-title {
  font-size: 17px;
  font-weight: 600;
  line-height: 1.2;
  color: $dark;
}

.brw-header-date {
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.2;
  color: $text-muted;
}

.brw-header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brw-icon-btn {
  width: 40px;
  min-width: 40px;
  height: 40px;
  border-radius: 10px;
  color: $dark;
}

.brw-icon-btn:hover {
  background: $secondary;
}

.brw-icon-btn--outlined {
  border: 1px solid $hairline;
}

.brw-notify-dot {
  position: absolute;
  top: 7px;
  right: 7px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: $accent;
  box-shadow: 0 0 0 2px #fff;
}

.brw-header-divider {
  width: 1px;
  height: 28px;
  background: $hairline;
}

.brw-profile-trigger {
  min-height: 40px;
  padding: 0 4px 0 2px;
  margin-left: 2px;
  border-radius: 10px;
}

.brw-profile-trigger :deep(.q-btn__content) {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brw-profile-trigger:hover {
  background: $secondary;
}

.brw-profile-meta {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1px;
  text-align: left;
  line-height: 1.2;
}

.brw-profile-name {
  font-size: 13px;
  font-weight: 600;
  color: $dark;
}

.brw-profile-role {
  font-size: 11px;
  font-weight: 400;
  color: $text-muted;
}

.brw-profile-trigger :deep(.q-icon) {
  color: $text-hint;
}

.brw-avatar {
  font-size: 12px;
  font-weight: 700;
}

.brw-avatar--header {
  background: $dark;
  color: #fff;
}

.brw-avatar--drawer {
  background: $accent;
  color: $dark;
}

.brw-drawer {
  height: 100%;
  overflow: hidden;
}

.brw-drawer__inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.brw-drawer__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 64px;
  min-height: 64px;
  padding: 0 16px;
  overflow: hidden;
}

.brw-drawer__logo {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  flex-shrink: 0;
}

.brw-drawer__brand-text {
  font-size: 18px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
}

.brw-drawer__brand-text strong {
  font-weight: 700;
  color: $accent;
}

.brw-drawer__nav {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 4px 10px 10px;
}

.brw-nav-group {
  padding: 14px 10px 8px;
  color: $drawer-group;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.brw-nav-item {
  position: relative;
  min-height: 46px;
  height: 46px;
  padding: 0 12px;
  border-radius: 10px;
  color: $drawer-text;
}

.brw-nav-item :deep(.q-icon) {
  color: inherit;
}

.brw-nav-item :deep(.q-item__section--avatar) {
  min-width: 22px;
  padding-right: 14px;
}

.brw-nav-label {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition:
    opacity 0.16s ease,
    width 0.2s ease;
}

.brw-nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}

.brw-nav-item--active {
  background: rgba(255, 207, 0, 0.12);
  color: $accent;
  font-weight: 500;
}

// Marker sits on the panel edge, so it has to escape the 10px nav padding.
.brw-nav-item--active::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 50%;
  width: 3px;
  height: 22px;
  border-radius: 0 3px 3px 0;
  background: $accent;
  transform: translateY(-50%);
}

.brw-drawer__footer {
  flex-shrink: 0;
  padding: 8px 10px 14px;
  border-top: 1px solid $drawer-border;
}

.brw-user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: $drawer-surface;
}

.brw-user-card :deep(.q-avatar) {
  flex-shrink: 0;
}

.brw-user-card__meta {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: 1px;
}

.brw-user-card__name {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brw-user-card__role {
  font-size: 11px;
  line-height: 1.2;
  color: $drawer-muted;
}

.brw-user-card__logout {
  width: 36px;
  min-width: 36px;
  height: 36px;
  margin-left: auto;
  color: $drawer-muted;
}

.brw-drawer__locale {
  margin-top: 10px;
}

.brw-drawer--mini .brw-drawer__brand {
  justify-content: center;
  padding: 0;
}

.brw-drawer--mini .brw-drawer__brand-text,
.brw-drawer--mini .brw-nav-label {
  opacity: 0;
  overflow: hidden;
  width: 0;
}

.brw-drawer--mini .brw-user-card {
  justify-content: center;
  padding: 8px 0;
}

.brw-page-container {
  background: $secondary;
}
</style>

<style lang="scss">
.brw-profile-menu {
  width: 220px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
}
</style>
