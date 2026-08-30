<template>
  <q-page class="brw-settings">
    <div class="brw-settings__inner">
      <div class="brw-tabs">
        <q-btn
          v-for="item in tabs"
          :key="item.id"
          no-caps
          flat
          unelevated
          class="brw-tab"
          :class="{ 'brw-tab--active': tab === item.id }"
          :icon="item.icon"
          :label="t(item.labelKey)"
          :aria-current="tab === item.id ? 'page' : undefined"
          @click="tab = item.id"
        />
      </div>

      <!-- Профіль -->
      <q-form v-if="tab === 'profile'" class="brw-profile-form" @submit.prevent="onSave">
        <q-card flat class="brw-card">
          <div class="brw-card-body">
            <div class="brw-card-head">
              <div class="brw-card-title">{{ t('settings.profileSection') }}</div>
              <div class="brw-card-hint">{{ t('settings.profileHint') }}</div>
            </div>

            <div class="brw-profile-row">
              <div class="brw-avatar-col">
                <q-avatar :size="avatarSize" class="brw-avatar">
                  <img v-if="avatarPreview" :src="avatarPreview" alt="" />
                  <span v-else>{{ initials }}</span>
                </q-avatar>
                <q-btn
                  outline
                  no-caps
                  type="button"
                  class="brw-avatar-btn"
                  :label="t('settings.changeAvatar')"
                  @click="fileInput?.pickFiles()"
                />
                <div class="brw-avatar-hint">{{ t('settings.avatarHint') }}</div>
                <q-file
                  ref="fileInput"
                  v-model="avatarFile"
                  accept="image/*"
                  class="hidden"
                  @update:model-value="onAvatarSelected"
                />
              </div>

              <div class="brw-fields-col">
                <div class="brw-name-grid">
                  <div class="brw-field">
                    <label for="settings-first-name">{{ t('settings.firstNameLabel') }}</label>
                    <q-input
                      for="settings-first-name"
                      v-model="firstName"
                      outlined
                      class="brw-input"
                      lazy-rules
                      hide-bottom-space
                      :rules="[(val) => !!val || t('validation.requiredFirstName')]"
                    />
                  </div>
                  <div class="brw-field">
                    <label for="settings-last-name">{{ t('settings.lastNameLabel') }}</label>
                    <q-input
                      for="settings-last-name"
                      v-model="lastName"
                      outlined
                      class="brw-input"
                      lazy-rules
                      hide-bottom-space
                      :rules="[(val) => !!val || t('validation.requiredLastName')]"
                    />
                  </div>
                </div>

                <div class="brw-field">
                  <label id="settings-email-label">{{ t('settings.emailLabel') }}</label>
                  <div
                    class="brw-input--readonly"
                    tabindex="-1"
                    aria-readonly="true"
                    aria-labelledby="settings-email-label"
                  >
                    <q-icon name="lock" />
                    <span class="ellipsis">{{ auth.profile?.email }}</span>
                  </div>
                  <div class="brw-field-hint">{{ t('settings.emailLockedHint') }}</div>
                </div>
              </div>
            </div>
          </div>
        </q-card>

        <q-card flat class="brw-card">
          <div class="brw-card-body">
            <div class="brw-card-head">
              <div class="brw-card-title">{{ t('settings.workSection') }}</div>
              <div class="brw-card-hint">{{ t('settings.workHint') }}</div>
            </div>

            <div class="brw-work-grid">
              <div class="brw-field">
                <label id="settings-rate-label">{{ t('settings.rateLabel') }}</label>
                <div
                  class="brw-input--readonly"
                  tabindex="-1"
                  aria-readonly="true"
                  aria-labelledby="settings-rate-label"
                >
                  <span>{{
                    currentRate !== null ? `${currentRate.toFixed(2)} ${t('common.currency')}` : '—'
                  }}</span>
                  <q-icon name="lock" />
                </div>
                <div class="brw-field-hint">{{ t('settings.rateLockedHint') }}</div>
              </div>

              <div class="brw-field">
                <label id="settings-norm-label">{{ t('settings.normLabel') }}</label>
                <div
                  class="brw-input--readonly"
                  tabindex="-1"
                  aria-readonly="true"
                  aria-labelledby="settings-norm-label"
                >
                  <span>{{ monthlyNormHours }} {{ t('reports.monthly.columnHours') }}</span>
                  <q-icon name="lock" />
                </div>
                <div class="brw-field-hint">{{ t('settings.normHint') }}</div>
              </div>

              <div class="brw-field">
                <label for="settings-default-site">{{ t('settings.defaultSiteLabel') }}</label>
                <!-- TODO(backend): profiles.default_site_id -->
                <q-select
                  for="settings-default-site"
                  v-model="defaultSiteId"
                  :options="[]"
                  emit-value
                  map-options
                  outlined
                  disable
                  popup-content-class="brw-select__menu"
                  class="brw-select"
                />
                <div class="brw-field-hint">{{ t('settings.defaultSiteHint') }}</div>
              </div>
            </div>
          </div>
        </q-card>

        <div class="brw-save-bar">
          <div class="brw-save-status" :class="{ 'brw-save-status--dirty': dirty }">
            {{ dirty ? t('settings.dirtyNotice') : t('settings.savedNotice') }}
          </div>
          <div class="brw-save-actions">
            <q-btn
              flat
              no-caps
              type="button"
              class="brw-save-cancel"
              :label="t('settings.discardChanges')"
              :disable="!dirty || saving"
              @click="onDiscard"
            />
            <q-btn
              type="submit"
              unelevated
              no-caps
              class="brw-save-btn"
              :label="t('settings.submit')"
              :loading="saving"
              :disable="!dirty || saving"
            />
          </div>
        </div>
      </q-form>

      <!-- Безпека -->
      <template v-else-if="tab === 'security'">
        <q-card flat class="brw-card">
          <div class="brw-card-body">
            <div class="brw-card-head">
              <div class="brw-card-title">{{ t('settings.passwordSection') }}</div>
              <div class="brw-card-hint">{{ t('settings.passwordHint') }}</div>
            </div>

            <q-form class="brw-password-form" @submit.prevent="onChangePassword">
              <div class="brw-field">
                <label for="settings-current-password">{{ t('settings.currentPassword') }}</label>
                <q-input
                  for="settings-current-password"
                  v-model="currentPassword"
                  :type="showCurrentPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  outlined
                  class="brw-input"
                  lazy-rules
                  hide-bottom-space
                  :rules="[(val) => !!val || t('validation.requiredPassword')]"
                >
                  <template #append
                    ><q-btn
                      flat
                      round
                      dense
                      type="button"
                      :icon="showCurrentPassword ? 'visibility_off' : 'visibility'"
                      :aria-label="t('auth.passwordToggleAria')"
                      @click="showCurrentPassword = !showCurrentPassword"
                  /></template>
                </q-input>
              </div>
              <div class="brw-field">
                <label for="settings-new-password">{{ t('settings.newPassword') }}</label>
                <q-input
                  for="settings-new-password"
                  v-model="newPassword"
                  :type="showNewPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  outlined
                  class="brw-input"
                  lazy-rules
                  hide-bottom-space
                  :rules="[(val) => (!!val && val.length >= 6) || t('validation.minPassword')]"
                >
                  <template #append
                    ><q-btn
                      flat
                      round
                      dense
                      type="button"
                      :icon="showNewPassword ? 'visibility_off' : 'visibility'"
                      :aria-label="t('auth.passwordToggleAria')"
                      @click="showNewPassword = !showNewPassword"
                  /></template>
                </q-input>
              </div>
              <div class="brw-field">
                <label for="settings-repeat-password">{{ t('settings.repeatPassword') }}</label>
                <q-input
                  for="settings-repeat-password"
                  v-model="repeatPassword"
                  :type="showRepeatPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  outlined
                  class="brw-input"
                  lazy-rules
                  hide-bottom-space
                  :rules="[(val) => val === newPassword || t('validation.passwordsMismatch')]"
                >
                  <template #append
                    ><q-btn
                      flat
                      round
                      dense
                      type="button"
                      :icon="showRepeatPassword ? 'visibility_off' : 'visibility'"
                      :aria-label="t('auth.passwordToggleAria')"
                      @click="showRepeatPassword = !showRepeatPassword"
                  /></template>
                </q-input>
              </div>
              <q-btn
                type="submit"
                unelevated
                no-caps
                class="brw-password-submit"
                :label="t('settings.changePassword')"
                :loading="passwordSaving"
                :disable="!canChangePassword"
              />
            </q-form>
          </div>
        </q-card>

        <q-card flat class="brw-card">
          <div class="brw-card-body">
            <div class="brw-card-head">
              <div class="brw-card-title">{{ t('settings.sessionsSection') }}</div>
            </div>

            <div class="brw-session-row">
              <q-icon :name="deviceIcon" size="22px" />
              <div class="brw-session-info">
                <div class="brw-session-name">{{ t('settings.thisDevice') }}</div>
                <div class="brw-session-meta ellipsis">{{ deviceLabel }}</div>
              </div>
              <div class="brw-pill brw-pill--active">{{ t('settings.sessionActive') }}</div>
            </div>

            <q-btn
              outline
              no-caps
              type="button"
              class="brw-signout-btn"
              :label="t('settings.signOutEverywhere')"
              @click="confirmSignOutEverywhere"
            />
          </div>
        </q-card>

        <q-card flat class="brw-card brw-card--danger">
          <div class="brw-card-body">
            <div class="brw-card-title brw-card-title--danger">
              {{ t('settings.dangerSection') }}
            </div>
            <div class="brw-danger-hint">{{ t('settings.dangerHint') }}</div>
            <ul class="brw-danger-list">
              <li>{{ t('settings.dangerBullet1') }}</li>
              <li>{{ t('settings.dangerBullet2') }}</li>
              <li>{{ t('settings.dangerBullet3') }}</li>
            </ul>
            <q-btn
              unelevated
              no-caps
              type="button"
              class="brw-btn-danger"
              :label="t('settings.deleteAccount')"
              @click="deleteDialogOpen = true"
            />
          </div>
        </q-card>

        <q-dialog v-model="deleteDialogOpen" @hide="deleteConfirmText = ''">
          <q-card class="brw-delete-dialog">
            <div class="brw-delete-dialog__head">
              <div class="brw-delete-dialog__icon">
                <q-icon name="delete_forever" size="24px" />
              </div>
              <div class="brw-delete-dialog__title">{{ t('settings.deleteDialogTitle') }}</div>
            </div>
            <p class="brw-delete-dialog__text">{{ t('settings.deleteDialogText') }}</p>
            <div class="brw-field">
              <label for="settings-delete-confirm">{{
                t('settings.deleteConfirmLabel', { word: t('settings.deleteConfirmWord') })
              }}</label>
              <q-input
                for="settings-delete-confirm"
                v-model="deleteConfirmText"
                outlined
                autofocus
                class="brw-input"
              />
            </div>
            <div class="brw-delete-dialog__actions">
              <q-btn
                flat
                no-caps
                type="button"
                class="brw-btn-ghost"
                :label="t('common.cancel')"
                v-close-popup
              />
              <q-btn
                unelevated
                no-caps
                type="button"
                class="brw-btn-danger--solid"
                :label="t('settings.deleteFinal')"
                :disable="!canDeleteAccount"
                :loading="deleting"
                @click="onDeleteAccount"
              />
            </div>
          </q-card>
        </q-dialog>
      </template>

      <!-- Застосунок -->
      <template v-else>
        <section
          v-if="showSettingsAction"
          class="brw-pwa-banner"
          :aria-label="t('settings.pwaSection')"
        >
          <q-icon name="install_mobile" size="30px" class="brw-pwa-banner__icon" />
          <div class="brw-pwa-banner__text">
            <div class="brw-pwa-banner__title">{{ t('settings.pwaTitle') }}</div>
            <div class="brw-pwa-banner__hint">{{ t('settings.pwaHint') }}</div>
          </div>
          <q-btn
            unelevated
            no-caps
            type="button"
            class="brw-pwa-banner__btn"
            :label="t('settings.pwaInstall')"
            @click="onInstallApp"
          />
        </section>

        <q-card flat class="brw-card">
          <div class="brw-card-body">
            <div class="brw-card-head">
              <div class="brw-card-title">{{ t('settings.notificationsSection') }}</div>
            </div>

            <div class="brw-toggle-row">
              <div class="brw-toggle-info">
                <div class="brw-toggle-label">{{ t('settings.notifyNewReport') }}</div>
                <div class="brw-toggle-hint">{{ t('settings.notifyNewReportHint') }}</div>
              </div>
              <q-toggle v-model="notifyNewReport" color="accent" keep-color />
            </div>
            <div class="brw-toggle-row">
              <div class="brw-toggle-info">
                <div class="brw-toggle-label">{{ t('settings.notifyWeekly') }}</div>
                <div class="brw-toggle-hint">{{ t('settings.notifyWeeklyHint') }}</div>
              </div>
              <q-toggle v-model="notifyWeekly" color="accent" keep-color />
            </div>
            <div v-if="auth.isAdmin" class="brw-toggle-row">
              <div class="brw-toggle-info">
                <div class="brw-toggle-label">{{ t('settings.notifyCrewMissing') }}</div>
                <div class="brw-toggle-hint">{{ t('settings.notifyCrewMissingHint') }}</div>
              </div>
              <q-toggle v-model="notifyCrewMissing" color="accent" keep-color />
            </div>
          </div>
        </q-card>

        <q-card flat class="brw-card">
          <div class="brw-card-body brw-about-row">
            <div>
              <div class="brw-card-title">{{ t('settings.aboutSection') }}</div>
              <div class="brw-card-hint">
                {{ t('settings.appVersion', { version: appVersion }) }}
              </div>
            </div>
            <a href="#" class="brw-terms-link" @click.prevent>{{ t('settings.termsLink') }}</a>
          </div>
        </q-card>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import { useQuasar, type QFile } from 'quasar';
import { useI18n } from 'vue-i18n';
import { supabase } from '@/boot/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { usePwaInstall } from '@/composables/use-pwa-install';
import { toLocalIsoDate } from '@/utils/format-date';

type TabId = 'profile' | 'security' | 'app';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();
const { showSettingsAction, canNativeInstall, install } = usePwaInstall();

const tabs: { id: TabId; icon: string; labelKey: string }[] = [
  { id: 'profile', icon: 'person', labelKey: 'settings.tabProfile' },
  { id: 'security', icon: 'lock', labelKey: 'settings.tabSecurity' },
  { id: 'app', icon: 'smartphone', labelKey: 'settings.tabApp' },
];

const tab = computed<TabId>({
  get: () =>
    (['profile', 'security', 'app'] as const).includes(route.query.tab as TabId)
      ? (route.query.tab as TabId)
      : 'profile',
  set: (value) => void router.replace({ query: { ...route.query, tab: value } }),
});

const avatarSize = computed(() => ($q.screen.lt.sm ? '64px' : '84px'));

const initials = computed(() => {
  if (!auth.profile) return '';
  return `${auth.profile.last_name.charAt(0)}${auth.profile.first_name.charAt(0)}`;
});

// ---- Профіль ----

const firstName = ref(auth.profile?.first_name ?? '');
const lastName = ref(auth.profile?.last_name ?? '');
const avatarFile = ref<File | null>(null);
const avatarPreview = ref<string | null>(auth.profile?.avatar_url ?? null);
const defaultSiteId = ref<string | null>(null);
const saving = ref(false);
const fileInput = ref<QFile | null>(null);

let objectUrl: string | null = null;

function onAvatarSelected(file: File | null) {
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  if (file) {
    objectUrl = URL.createObjectURL(file);
    avatarPreview.value = objectUrl;
  }
}

onBeforeUnmount(() => {
  if (objectUrl) URL.revokeObjectURL(objectUrl);
});

const dirty = computed(
  () =>
    firstName.value !== (auth.profile?.first_name ?? '') ||
    lastName.value !== (auth.profile?.last_name ?? '') ||
    avatarFile.value !== null ||
    defaultSiteId.value !== null,
);

function onDiscard() {
  firstName.value = auth.profile?.first_name ?? '';
  lastName.value = auth.profile?.last_name ?? '';
  defaultSiteId.value = null;
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  }
  avatarFile.value = null;
  avatarPreview.value = auth.profile?.avatar_url ?? null;
}

async function onSave() {
  saving.value = true;
  try {
    await auth.updateProfile({
      firstName: firstName.value,
      lastName: lastName.value,
      avatarFile: avatarFile.value,
    });
    avatarFile.value = null;
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('settings.errorFallback'),
    });
  } finally {
    saving.value = false;
  }
}

onBeforeRouteLeave(() => {
  if (!dirty.value) return true;
  return new Promise<boolean>((resolve) => {
    $q.dialog({
      title: t('settings.discardChanges'),
      message: t('settings.discardConfirm'),
      cancel: { label: t('common.cancel'), flat: true },
      ok: { label: t('common.confirm'), color: 'negative', unelevated: true },
    })
      .onOk(() => resolve(true))
      .onCancel(() => resolve(false))
      .onDismiss(() => resolve(false));
  });
});

// ---- Робочі параметри ----

const WORKDAY_HOURS = 8;
const currentRate = ref<number | null>(null);

const monthlyNormHours = computed(() => {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), d).getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count * WORKDAY_HOURS;
});

async function loadCurrentRate() {
  if (!auth.user) return;
  const { data } = await supabase
    .from('employee_rates')
    .select('hourly_rate')
    .eq('user_id', auth.user.id)
    .lte('effective_from', toLocalIsoDate(new Date()))
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle();
  currentRate.value = data ? Number(data.hourly_rate) : null;
}

void loadCurrentRate();

// ---- Пароль ----

const currentPassword = ref('');
const newPassword = ref('');
const repeatPassword = ref('');
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showRepeatPassword = ref(false);
const passwordSaving = ref(false);

const canChangePassword = computed(
  () =>
    !!currentPassword.value &&
    newPassword.value.length >= 6 &&
    repeatPassword.value === newPassword.value,
);

async function onChangePassword() {
  passwordSaving.value = true;
  try {
    await auth.changePassword(currentPassword.value, newPassword.value);
    currentPassword.value = '';
    newPassword.value = '';
    repeatPassword.value = '';
    $q.notify({ type: 'positive', message: t('settings.successMessage') });
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('settings.errorFallback'),
    });
  } finally {
    passwordSaving.value = false;
  }
}

// ---- Сесії ----

const deviceIcon = /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)
  ? 'smartphone'
  : 'computer';
const deviceLabel = navigator.userAgent;

function confirmSignOutEverywhere() {
  $q.dialog({
    title: t('settings.signOutEverywhere'),
    message: t('settings.signOutEverywhereConfirm'),
    cancel: { label: t('common.cancel'), flat: true },
    ok: { label: t('settings.signOutEverywhere'), color: 'negative', unelevated: true },
  }).onOk(() => void onSignOutEverywhere());
}

async function onSignOutEverywhere() {
  try {
    await auth.signOutEverywhere();
    await router.push('/login');
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('settings.errorFallback'),
    });
  }
}

// ---- Видалення акаунту ----

const deleteDialogOpen = ref(false);
const deleteConfirmText = ref('');
const deleting = ref(false);

const canDeleteAccount = computed(
  () =>
    deleteConfirmText.value.trim().toUpperCase() === t('settings.deleteConfirmWord').toUpperCase(),
);

async function onDeleteAccount() {
  deleting.value = true;
  try {
    await auth.deleteAccount();
    deleteDialogOpen.value = false;
    $q.notify({ type: 'positive', message: t('settings.deleteSuccess') });
    await auth.signOut().catch(() => undefined);
    await router.push('/login');
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('settings.deleteError'),
    });
  } finally {
    deleting.value = false;
  }
}

// ---- Застосунок ----

async function onInstallApp() {
  if (canNativeInstall.value) {
    await install();
    return;
  }
  $q.dialog({
    title: t('settings.iosInstallTitle'),
    message: t('pwa.iosHint'),
    ok: t('common.confirm'),
  });
}

const appVersion = import.meta.env.APP_VERSION;

// TODO(backend): notification_preferences
function readBoolPref(key: string): boolean {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}
function writeBoolPref(key: string, value: boolean) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // ignore quota / private mode
  }
}

const notifyNewReport = ref(readBoolPref('brw.notifications.newReport'));
const notifyWeekly = ref(readBoolPref('brw.notifications.weekly'));
const notifyCrewMissing = ref(readBoolPref('brw.notifications.crewMissing'));

watch(notifyNewReport, (value) => writeBoolPref('brw.notifications.newReport', value));
watch(notifyWeekly, (value) => writeBoolPref('brw.notifications.weekly', value));
watch(notifyCrewMissing, (value) => writeBoolPref('brw.notifications.crewMissing', value));
</script>

<style lang="scss" scoped>
.brw-settings {
  padding: 24px 20px 48px;
}

.brw-settings__inner {
  max-width: 820px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.brw-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: #fff;
  border: 1px solid $separator-color;
  border-radius: 12px;
  width: fit-content;
}

.brw-tab {
  height: 40px;
  padding: 0 16px;
  border-radius: 9px;
  font-size: 14px;
  color: $dark;

  :deep(.q-icon) {
    font-size: 20px;
    color: $text-hint;
  }

  &--active {
    background: $secondary;
    box-shadow: inset 0 0 0 1px $separator-color;
    font-weight: 600;

    :deep(.q-icon) {
      color: $dark;
    }
  }
}

.brw-profile-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.brw-card-body {
  padding: 20px;
}

.brw-card-head {
  margin-bottom: 16px;
}

.brw-card-title {
  font-size: 16px;
  font-weight: 600;
  color: $dark;

  &--danger {
    color: $negative;
  }
}

.brw-card-hint {
  margin-top: 2px;
  font-size: 13px;
  color: $text-muted;
}

.brw-profile-row {
  display: flex;
  gap: 22px;
  flex-wrap: wrap;
}

.brw-avatar-col {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.brw-avatar {
  background: $accent;
  color: $dark;
  font-size: 26px;
  font-weight: 800;
}

.brw-avatar-btn {
  height: 36px;
  padding: 0 14px;
  border: 1px solid $separator-color;
  border-radius: 10px;
  font-size: 13px;
}

.brw-avatar-hint {
  font-size: 11px;
  color: $text-hint;
  text-align: center;
}

.brw-fields-col {
  flex: 1;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.brw-name-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.brw-field label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: $text-secondary;
}

.brw-field-hint {
  margin-top: 6px;
  font-size: 12px;
  color: $text-hint;
}

.brw-work-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.brw-password-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 420px;
}

.brw-password-submit {
  height: 48px;
  margin-top: 4px;
  background: $accent;
  color: $dark;
  border-radius: 12px;
  font-weight: 600;
}

.brw-session-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid $row-divider;
}

.brw-session-info {
  flex: 1;
  min-width: 0;
}

.brw-session-name {
  font-size: 14px;
  font-weight: 500;
  color: $dark;
}

.brw-session-meta {
  margin-top: 2px;
  font-size: 12px;
  color: $text-muted;
}

.brw-pill {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  border-radius: 99px;
  padding: 5px 10px;

  &--active {
    color: $positive;
    background: #e8f5e9;
  }
}

.brw-signout-btn {
  margin-top: 14px;
  height: 44px;
  border: 1px solid $separator-color;
  border-radius: 12px;
  color: $negative;
}

.brw-card--danger {
  border-color: #f3d4d4;
}

.brw-danger-hint {
  margin-top: 4px;
  max-width: 560px;
  font-size: 13px;
  color: $text-muted;
}

.brw-danger-list {
  margin: 14px 0;
  padding-left: 18px;
  font-size: 13px;
  color: $text-secondary;
  line-height: 1.7;
}

.brw-delete-dialog {
  width: 460px;
  max-width: 92vw;
  border-radius: 16px;
  padding: 24px;
}

.brw-delete-dialog__head {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brw-delete-dialog__icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #fdecec;
  color: $negative;
}

.brw-delete-dialog__title {
  font-size: 18px;
  font-weight: 600;
  color: $dark;
}

.brw-delete-dialog__text {
  margin: 14px 0;
  font-size: 13px;
  color: $text-secondary;
}

.brw-delete-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}

.brw-pwa-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: $accent-soft;
  border: 1px solid $accent-soft-border;
  border-radius: 12px;
}

.brw-pwa-banner__icon {
  flex-shrink: 0;
  color: $accent-ink;
}

.brw-pwa-banner__text {
  flex: 1;
  min-width: 0;
}

.brw-pwa-banner__title {
  font-size: 14px;
  font-weight: 600;
  color: $dark;
}

.brw-pwa-banner__hint {
  margin-top: 2px;
  font-size: 12px;
  color: $accent-ink;
}

.brw-pwa-banner__btn {
  flex-shrink: 0;
  height: 44px;
  padding: 0 18px;
  background: $accent;
  color: $dark;
  border-radius: 10px;
  font-weight: 600;
}

.brw-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid $row-divider;

  &:last-child {
    border-bottom: none;
  }
}

.brw-toggle-label {
  font-size: 14px;
  font-weight: 500;
  color: $dark;
}

.brw-toggle-hint {
  margin-top: 2px;
  font-size: 12px;
  color: $text-muted;
}

.brw-about-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.brw-terms-link {
  font-size: 13px;
  font-weight: 500;
  color: $accent-link;
  text-decoration: none;
}

.brw-save-bar {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  background: #fff;
  border: 1px solid $separator-color;
  border-radius: 14px;
  box-shadow: 0 -2px 14px rgba(0, 0, 0, 0.05);
}

.brw-save-status {
  font-size: 13px;
  color: $text-hint;

  &--dirty {
    color: $accent-link;
  }
}

.brw-save-actions {
  display: flex;
  gap: 8px;
}

.brw-save-cancel {
  height: 44px;
  color: $text-secondary;
}

.brw-save-btn {
  height: 44px;
  padding: 0 18px;
  background: $accent;
  color: $dark;
  border-radius: 10px;
  font-weight: 600;
}

@media (max-width: 599px) {
  .brw-settings {
    padding: 16px 14px 32px;
  }

  .brw-tabs {
    width: 100%;
  }

  .brw-tab {
    flex: 1;
  }

  .brw-card {
    border-radius: 16px;
  }

  .brw-card-body {
    padding: 16px;
  }

  .brw-profile-row {
    flex-direction: column;
  }

  .brw-avatar-col {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }

  .brw-avatar-hint {
    flex-basis: 100%;
    text-align: left;
  }

  .brw-name-grid {
    grid-template-columns: 1fr;
  }

  .brw-save-bar {
    padding-bottom: max(14px, env(safe-area-inset-bottom));
  }
}
</style>
