<template>
  <q-page class="brw-home-page">
    <div class="brw-home-container">
      <!-- Stat cards -->
      <div class="brw-stat-grid">
        <div class="brw-shift-card" :class="activeShift ? 'brw-shift-card--active' : ''">
          <template v-if="activeShift">
            <div class="brw-shift-body">
              <div class="brw-shift-head">
                <span class="brw-shift-dot" aria-hidden="true" />
                <span class="brw-shift-status">{{ t('home.shiftRunning') }}</span>
                <q-space />
                <span class="brw-shift-elapsed">{{ elapsedLabel }}</span>
              </div>

              <div class="brw-shift-site">{{ activeShift.site_name }}</div>
              <div class="brw-shift-since">
                <q-icon name="schedule" size="16px" />
                {{ t('home.shiftStartedAt', { time: formatTime(activeShift.start_time) }) }}
              </div>
            </div>

            <q-btn
              unelevated
              no-caps
              icon="stop_circle"
              :label="t('home.endShift')"
              class="brw-btn-primary brw-shift-btn"
              :loading="shiftBusy"
              @click="endShift"
            />
          </template>

          <template v-else>
            <div class="brw-shift-body">
              <div class="brw-shift-status brw-shift-status--idle">
                {{ t('home.startShiftTitle') }}
              </div>

              <div class="brw-field">
                <label for="home-site">{{ t('reports.monthly.siteLabel') }}</label>
                <q-select
                  for="home-site"
                  v-model="selectedSiteId"
                  :options="siteOptions"
                  :placeholder="t('reports.monthly.sitePlaceholder')"
                  outlined
                  emit-value
                  map-options
                  hide-bottom-space
                  popup-content-class="brw-select__menu"
                  class="brw-select"
                />
              </div>
            </div>

            <q-btn
              unelevated
              no-caps
              icon="play_arrow"
              :label="t('home.startShift')"
              class="brw-btn-primary brw-shift-btn"
              :disable="!selectedSiteId"
              :loading="shiftBusy"
              @click="startShift"
            />
            <div v-if="!selectedSiteId" class="brw-shift-hint">{{ t('home.pickSiteFirst') }}</div>
          </template>
        </div>

        <q-card class="brw-card brw-stat-card" flat bordered>
          <div class="row items-center q-gutter-sm brw-muted text-body2">
            <q-icon name="schedule" size="20px" />
            <div>{{ t('home.totalHoursLabel') }}</div>
          </div>
          <div class="brw-stat-value">{{ formattedHours }}</div>
          <div class="brw-stat-caption">{{ t('home.daysApprox', { days: daysApprox }) }}</div>
          <div v-if="breakMinutesThisMonth > 0" class="brw-stat-caption">
            {{ t('home.breakDeductedCaption', { minutes: breakMinutesThisMonth }) }}
          </div>
        </q-card>

        <q-card class="brw-card brw-stat-card" flat bordered>
          <div class="row items-center q-gutter-sm brw-muted text-body2">
            <q-icon name="payments" size="20px" />
            <div>{{ t('home.expectedSalaryLabel') }}</div>
          </div>
          <div class="brw-stat-value">{{ formattedSalary }}</div>
          <div v-if="currentRate !== null" class="brw-stat-caption">
            {{ t('home.currentRateLabel', { rate: currentRate.toFixed(2) }) }}
          </div>
        </q-card>
      </div>

      <div class="brw-shift-meta">
        {{ currentMonthLabel }} ·
        {{
          lastEntryDaysAgo === null
            ? t('home.noEntriesYet')
            : t('home.lastEntryDaysAgo', { days: lastEntryDaysAgo })
        }}
      </div>

      <!-- Recent entries + monthly-norm progress -->
      <div class="brw-two-col">
        <q-card class="brw-card brw-panel" flat bordered>
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-subtitle1 text-weight-bold">{{ t('home.recentEntries') }}</div>
            <q-btn
              flat
              dense
              no-caps
              color="accent"
              :label="t('home.viewMonthlyReport')"
              to="/reports/monthly"
            />
          </div>

          <q-list separator>
            <q-item v-for="entry in recentEntries" :key="entry.id" class="q-px-none">
              <q-item-section avatar top class="brw-entry-daynum">
                <div class="text-weight-bold">{{ entry.dayNum }}</div>
                <div class="brw-entry-weekday">{{ entry.weekdayLabel }}</div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="ellipsis">{{ entry.site_name }}</q-item-label>
                <q-item-label caption>{{ entry.timeRange }}</q-item-label>
              </q-item-section>
              <q-item-section side top>
                <div class="text-weight-bold">
                  {{ formatHoursLabel(entry.hours, t) }}
                </div>
                <div class="brw-stat-caption">
                  {{ entry.earned.toFixed(2) }} {{ t('common.currency') }}
                </div>
              </q-item-section>
            </q-item>

            <q-item v-if="!recentEntries.length" class="q-px-none">
              <q-item-section class="brw-muted">{{ t('home.noRecentEntries') }}</q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <q-card class="brw-card brw-stat-card" flat bordered>
          <div class="row items-center q-gutter-sm brw-muted text-body2">
            <q-icon name="track_changes" size="20px" />
            <div>{{ t('home.monthlyNormLabel') }}</div>
          </div>
          <div class="row items-baseline q-gutter-sm">
            <div class="brw-stat-value">{{ normProgressPercent }}%</div>
            <div class="brw-stat-fraction">
              {{ t('home.monthlyNormFraction', { hours: formattedHours, norm: monthlyNormHours }) }}
            </div>
          </div>
          <q-linear-progress
            :value="normProgressRatio"
            color="accent"
            track-color="grey-3"
            size="8px"
            rounded
            class="q-mt-md"
          />
          <div class="brw-stat-caption q-mt-sm">
            {{ t('home.remainingLabel', { hours: remainingHours, days: remainingWorkdays }) }}
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/boot/supabase';
import { aggregateCreditedHours } from '@/utils/work-hours';
import { getCurrentCoords } from '@/utils/geolocation';
import { formatHoursLabel } from '@/utils/format-hours';

interface EarningsRow {
  id: string;
  work_date: string;
  start_time: string;
  end_time: string | null;
  hours: number | null;
  earned: number | null;
  site_name: string;
}

interface SiteOption {
  label: string;
  value: string;
}

interface ActiveShift {
  id: string;
  site_name: string;
  start_time: string;
}

const $q = useQuasar();
const auth = useAuthStore();
const i18n = useI18n();
const { t } = i18n;

const today = new Date().toISOString().slice(0, 10);

function toIsoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

function getLocalWeekday(dateStr: string): number {
  return parseLocalDate(dateStr).getDay();
}

function isWeekday(day: number) {
  return day !== 0 && day !== 6;
}

// ---- Month summary (hours / salary cards) ----

const totalHours = ref(0);
const totalEarned = ref(0);
const breakMinutesThisMonth = ref(0);
const currentRate = ref<number | null>(null);
const lastEntryDaysAgo = ref<number | null>(null);

const WORKDAY_HOURS = 8;
const formattedHours = computed(() => formatHoursLabel(totalHours.value, t));
const daysApprox = computed(() => (totalHours.value / WORKDAY_HOURS).toFixed(1));
const formattedSalary = computed(() => `${totalEarned.value.toFixed(2)} ${t('common.currency')}`);

const now = new Date();
const currentMonthLabel = computed(() => {
  const monthNames = i18n.tm('months');
  return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
});

const monthlyNormHours = computed(() => {
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    if (isWeekday(new Date(now.getFullYear(), now.getMonth(), d).getDay())) count++;
  }
  return count * WORKDAY_HOURS;
});

const normProgressRatio = computed(() =>
  Math.min(1, totalHours.value / (monthlyNormHours.value || 1)),
);
const normProgressPercent = computed(() => Math.round(normProgressRatio.value * 100));
const remainingHours = computed(() =>
  formatHoursLabel(Math.max(0, monthlyNormHours.value - totalHours.value), t),
);
const remainingWorkdays = computed(() => {
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  let count = 0;
  for (let d = now.getDate(); d <= daysInMonth; d++) {
    if (isWeekday(new Date(now.getFullYear(), now.getMonth(), d).getDay())) count++;
  }
  return count;
});

async function loadMonthSummary() {
  if (!auth.user) return;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const { data, error } = await supabase
    .from('work_report_earnings')
    .select('hours, work_date, hourly_rate')
    .eq('user_id', auth.user.id)
    .gte('work_date', toIsoDate(monthStart))
    .lt('work_date', toIsoDate(nextMonthStart));

  if (error || !data) return;
  const credited = aggregateCreditedHours(data);
  totalHours.value = credited.creditedHours;
  totalEarned.value = credited.creditedEarned;
  breakMinutesThisMonth.value = credited.breakMinutes;
}

async function loadCurrentRate() {
  if (!auth.user) return;
  const { data } = await supabase
    .from('employee_rates')
    .select('hourly_rate')
    .eq('user_id', auth.user.id)
    .lte('effective_from', today)
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle();
  currentRate.value = data ? Number(data.hourly_rate) : null;
}

async function loadLastEntry() {
  if (!auth.user) return;
  const { data } = await supabase
    .from('work_reports')
    .select('work_date')
    .eq('user_id', auth.user.id)
    .order('work_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) {
    lastEntryDaysAgo.value = null;
    return;
  }
  const diffMs = parseLocalDate(today).getTime() - parseLocalDate(data.work_date).getTime();
  lastEntryDaysAgo.value = Math.round(diffMs / (1000 * 60 * 60 * 24));
}

// ---- Recent entries ----

const recentEntries = ref<
  {
    id: string;
    dayNum: number;
    weekdayLabel: string;
    site_name: string;
    timeRange: string;
    hours: number;
    earned: number;
  }[]
>([]);

function formatTime(value: string) {
  return value.slice(0, 5);
}

async function loadRecentEntries() {
  if (!auth.user) return;
  const { data, error } = await supabase
    .from('work_report_earnings')
    .select('id, work_date, start_time, end_time, hours, earned, site_name')
    .eq('user_id', auth.user.id)
    .order('work_date', { ascending: false })
    .limit(6);

  if (error || !data) return;
  const names = i18n.tm('weekdaysShort');
  recentEntries.value = (data as EarningsRow[]).map((r) => ({
    id: r.id,
    dayNum: parseLocalDate(r.work_date).getDate(),
    weekdayLabel: names[getLocalWeekday(r.work_date)] ?? '',
    site_name: r.site_name,
    timeRange: r.end_time
      ? `${formatTime(r.start_time)}–${formatTime(r.end_time)}`
      : `${formatTime(r.start_time)}–${t('common.inProgress')}`,
    hours: Number(r.hours),
    earned: Number(r.earned),
  }));
}

async function onSaved() {
  await Promise.all([loadMonthSummary(), loadRecentEntries(), loadLastEntry()]);
}

// ---- Clock-in / clock-out ----

const siteOptions = ref<SiteOption[]>([]);
const selectedSiteId = ref<string | null>(null);
const activeShift = ref<ActiveShift | null>(null);
const shiftBusy = ref(false);

const elapsedNow = ref(Date.now());
let elapsedTick: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  elapsedTick = setInterval(() => (elapsedNow.value = Date.now()), 60_000);
});
onUnmounted(() => clearInterval(elapsedTick));

// «3:47» — годин:хвилин від початку зміни. Рахуємо на клієнті від
// activeShift.start_time (час без дати, зміна завжди в межах поточної доби).
const elapsedLabel = computed(() => {
  if (!activeShift.value) return '';
  const [h, m] = activeShift.value.start_time.split(':').map(Number);
  const start = new Date(elapsedNow.value);
  start.setHours(h ?? 0, m ?? 0, 0, 0);
  const mins = Math.max(0, Math.round((elapsedNow.value - start.getTime()) / 60_000));
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`;
});

async function loadSites() {
  const { data, error } = await supabase
    .from('sites')
    .select('id, name')
    .eq('is_active', true)
    .order('name');
  if (error) return;
  siteOptions.value = (data ?? []).map((s) => ({ label: s.name, value: s.id }));
}

async function loadActiveShift() {
  if (!auth.user) return;
  const { data } = await supabase
    .from('work_report_earnings')
    .select('id, site_name, start_time')
    .eq('user_id', auth.user.id)
    .is('end_time', null)
    .maybeSingle();
  activeShift.value = data
    ? { id: data.id, site_name: data.site_name, start_time: data.start_time }
    : null;
}

function nowTime() {
  return new Date().toTimeString().slice(0, 8);
}

async function startShift() {
  if (!auth.user || !selectedSiteId.value) return;
  shiftBusy.value = true;
  try {
    const geo = await getCurrentCoords();
    const { error } = await supabase.from('work_reports').insert({
      user_id: auth.user.id,
      site_id: selectedSiteId.value,
      work_date: today,
      start_time: nowTime(),
      start_lat: geo?.lat ?? null,
      start_lng: geo?.lng ?? null,
    });
    if (error) throw error;
    $q.notify({ type: 'positive', message: t('home.shiftStarted') });
    selectedSiteId.value = null;
    await Promise.all([loadActiveShift(), loadRecentEntries(), loadLastEntry()]);
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('home.errorFallback'),
    });
  } finally {
    shiftBusy.value = false;
  }
}

async function endShift() {
  if (!activeShift.value) return;
  shiftBusy.value = true;
  try {
    const { error } = await supabase
      .from('work_reports')
      .update({ end_time: nowTime() })
      .eq('id', activeShift.value.id);
    if (error) throw error;
    $q.notify({ type: 'positive', message: t('home.shiftEnded') });
    await Promise.all([loadActiveShift(), onSaved()]);
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err instanceof Error ? err.message : t('home.errorFallback'),
    });
  } finally {
    shiftBusy.value = false;
  }
}

void loadMonthSummary();
void loadCurrentRate();
void loadLastEntry();
void loadRecentEntries();
void loadSites();
void loadActiveShift();
</script>

<style lang="scss" scoped>
.brw-home-page {
  background: #f5f5f5;
}

.brw-home-container {
  max-width: 1180px;
  margin: 0 auto;
  padding: 20px 16px 56px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// Блок зміни — головна дія сторінки. В активному стані єдиний темний
// елемент на світлому тлі, тому читається першим; картки статистики
// лишаються фоном.
.brw-shift-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border: 1px solid #e6e8ea;
  border-radius: 18px;
  background: #fff;
}

.brw-shift-card--active {
  border-color: transparent;
  background: $dark;
}

// Groups everything above the button so it can grow (flex: 1) and absorb
// any extra height the grid stretches onto the card — keeps the button
// flush to the card's bottom edge regardless of sibling card heights.
.brw-shift-body {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
}

.brw-shift-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brw-shift-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: $accent;
  animation: brw-shift-pulse 2s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

@keyframes brw-shift-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.25;
  }
}

.brw-shift-status {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: $accent;
}

.brw-shift-status--idle {
  color: $text-muted;
}

.brw-shift-elapsed {
  margin-left: auto;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  font-variant-numeric: tabular-nums;
}

// Обʼєкт — головна відповідь на «де я зараз працюю», тому найбільший
// текст блоку, а не хвостик після кнопки.
.brw-shift-site {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
  color: #fff;
  text-wrap: pretty;
}

.brw-shift-since {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.62);
  font-variant-numeric: tabular-nums;
}

.brw-shift-btn {
  width: 100%;
  height: 56px;
  border-radius: 14px;
  font-size: 16px;
}

.brw-shift-hint {
  margin-top: -6px;
  font-size: 12.5px;
  color: $text-muted;
  text-align: center;
}

.brw-shift-meta {
  font-size: 13px;
  color: $text-muted;
}

.brw-muted {
  color: $text-secondary;
}

// Одна колонка до 1024px (картка на всю ширину — уникає зламу сітки в
// проміжку 600–1024px), від 1024px картка зміни фіксованих 420px, дві
// картки статистики ділять решту (макет 2A).
.brw-stat-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media (min-width: 1024px) {
    grid-template-columns: 420px repeat(2, minmax(0, 1fr));
  }
}

.brw-stat-card {
  padding: 18px 20px;
}

.brw-stat-value {
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -0.01em;
  margin-top: 6px;
}

.brw-stat-fraction {
  font-size: 13px;
  color: $text-muted;
}

.brw-stat-caption {
  font-size: 12px;
  color: $text-muted;
}

.brw-two-col {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.brw-panel {
  padding: 18px 20px 20px;
}

.brw-entry-daynum {
  min-width: 42px;
  text-align: center;
}

.brw-entry-weekday {
  font-size: 11px;
  color: $text-hint;
  text-transform: uppercase;
}
</style>
