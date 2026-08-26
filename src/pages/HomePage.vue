<template>
  <q-page class="brw-home-page">
    <div class="brw-home-container">
      <!-- CTA row -->
      <div class="row items-center brw-cta-row">
        <q-btn
          unelevated
          no-caps
          icon="add"
          :label="t('home.addTodayEntry')"
          class="brw-btn-primary"
          @click="addDialogOpen = true"
        />
        <div class="text-body2 brw-muted">
          {{ currentMonthLabel }} ·
          {{
            lastEntryDaysAgo === null
              ? t('home.noEntriesYet')
              : t('home.lastEntryDaysAgo', { days: lastEntryDaysAgo })
          }}
        </div>
      </div>

      <!-- Stat cards -->
      <div class="brw-stat-grid">
        <q-card class="brw-card brw-stat-card" flat bordered>
          <div class="row items-center q-gutter-sm brw-muted text-body2">
            <q-icon name="schedule" size="20px" />
            <div>{{ t('home.totalHoursLabel') }}</div>
          </div>
          <div class="brw-stat-value">{{ formattedHours }}</div>
          <div class="brw-stat-caption">{{ t('home.daysApprox', { days: daysApprox }) }}</div>
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

      <!-- Weekly chart + recent entries -->
      <div class="brw-two-col">
        <q-card class="brw-card brw-panel" flat bordered>
          <div class="row items-center justify-between brw-panel-header">
            <div>
              <div class="text-subtitle1 text-weight-bold">{{ weekTitle }}</div>
              <div class="brw-stat-caption">
                {{ t('home.weekTotal', { hours: weekTotalHours, earned: weekTotalEarned }) }}
              </div>
            </div>
            <div>
              <q-btn flat dense round icon="chevron_left" @click="weekOffset -= 1" />
              <q-btn flat dense round icon="chevron_right" @click="weekOffset += 1" />
            </div>
          </div>

          <div class="brw-chart">
            <div v-for="day in weekDays" :key="day.date" class="brw-chart-col">
              <div class="brw-chart-hours" :class="{ 'brw-chart-hours--empty': day.hours <= 0 }">
                {{ day.hours > 0 ? day.hours.toFixed(1) : '—' }}
              </div>
              <div
                class="brw-bar"
                :class="day.hours > 8 ? 'bg-dark' : day.hours > 0 ? 'bg-accent' : 'brw-bar--empty'"
                :style="{ height: barHeight(day.hours) + 'px' }"
              >
                <q-tooltip v-if="day.hours > 0"
                  >{{ day.hours.toFixed(2) }} {{ t('reports.monthly.columnHours') }}</q-tooltip
                >
              </div>
              <div class="brw-chart-weekday">{{ day.weekdayLabel }}</div>
              <div class="brw-chart-daynum" :class="{ 'brw-chart-daynum--today': day.isToday }">
                {{ day.dayNum }}
              </div>
            </div>
          </div>
        </q-card>

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
                  {{ entry.hours.toFixed(2) }} {{ t('reports.monthly.columnHours') }}
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
      </div>
    </div>

    <AddWorkReportDialog v-model="addDialogOpen" :work-date="today" @saved="onSaved" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth-store';
import { supabase } from '@/boot/supabase';
import AddWorkReportDialog from '@/components/AddWorkReportDialog.vue';

interface EarningsRow {
  id: string;
  work_date: string;
  start_time: string;
  end_time: string;
  hours: number;
  earned: number;
  site_name: string;
}

const auth = useAuthStore();
const i18n = useI18n();
const { t } = i18n;

const today = new Date().toISOString().slice(0, 10);
const addDialogOpen = ref(false);

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
const currentRate = ref<number | null>(null);
const lastEntryDaysAgo = ref<number | null>(null);

const WORKDAY_HOURS = 8;
const formattedHours = computed(() => totalHours.value.toFixed(2));
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
  Math.max(0, monthlyNormHours.value - totalHours.value).toFixed(2),
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
    .select('hours, earned, work_date')
    .eq('user_id', auth.user.id)
    .gte('work_date', toIsoDate(monthStart))
    .lt('work_date', toIsoDate(nextMonthStart));

  if (error || !data) return;
  totalHours.value = data.reduce((sum, r) => sum + Number(r.hours), 0);
  totalEarned.value = data.reduce((sum, r) => sum + Number(r.earned), 0);
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

// ---- Weekly chart ----

const weekOffset = ref(0);

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

const weekStart = computed(() => {
  const base = getWeekStart(new Date());
  base.setDate(base.getDate() + weekOffset.value * 7);
  return base;
});

const weekEnd = computed(() => {
  const d = new Date(weekStart.value);
  d.setDate(d.getDate() + 6);
  return d;
});

const weekTitle = computed(() => {
  const monthNames = i18n.tm('months');
  return t('home.weekLabel', {
    from: weekStart.value.getDate(),
    to: weekEnd.value.getDate(),
    month: monthNames[weekEnd.value.getMonth()],
  });
});

const weekRows = ref<{ work_date: string; hours: number; earned: number }[]>([]);

async function loadWeek() {
  if (!auth.user) return;
  const { data, error } = await supabase
    .from('work_report_earnings')
    .select('work_date, hours, earned')
    .eq('user_id', auth.user.id)
    .gte('work_date', toIsoDate(weekStart.value))
    .lte('work_date', toIsoDate(weekEnd.value));

  if (error || !data) return;
  weekRows.value = data;
}

watch(weekOffset, () => void loadWeek());

const weekDays = computed(() => {
  const names = i18n.tm('weekdaysShort');
  const todayStr = today;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.value);
    d.setDate(d.getDate() + i);
    const dateStr = toIsoDate(d);
    const hours = weekRows.value
      .filter((r) => r.work_date === dateStr)
      .reduce((sum, r) => sum + Number(r.hours), 0);
    return {
      date: dateStr,
      dayNum: d.getDate(),
      weekdayLabel: names[d.getDay()] ?? '',
      hours,
      isToday: dateStr === todayStr,
    };
  });
});

const weekTotalHours = computed(() =>
  weekDays.value.reduce((sum, d) => sum + d.hours, 0).toFixed(2),
);
const weekTotalEarned = computed(() =>
  weekRows.value.reduce((sum, r) => sum + Number(r.earned), 0).toFixed(2),
);

function barHeight(hours: number): number {
  if (hours <= 0) return 4;
  const maxHours = Math.max(...weekDays.value.map((d) => d.hours), 10);
  return Math.max(6, Math.round((hours / maxHours) * 110));
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
    timeRange: `${formatTime(r.start_time)}–${formatTime(r.end_time)}`,
    hours: Number(r.hours),
    earned: Number(r.earned),
  }));
}

async function onSaved() {
  await Promise.all([loadMonthSummary(), loadWeek(), loadRecentEntries(), loadLastEntry()]);
}

void loadMonthSummary();
void loadCurrentRate();
void loadLastEntry();
void loadWeek();
void loadRecentEntries();
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

.brw-cta-row {
  flex-wrap: wrap;
  gap: 16px;
}

.brw-muted {
  color: $text-secondary;
}

.brw-stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
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

.brw-chart {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-top: 18px;
  align-items: end;
  height: 190px;
}

.brw-chart-col {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
  gap: 6px;
}

.brw-chart-hours {
  font-size: 12px;
  font-weight: 600;
  text-align: center;

  &--empty {
    color: #c4c4c4;
  }
}

.brw-bar {
  border-radius: 8px 8px 0 0;
  min-height: 4px;
  transition: height 0.25s ease;

  &--empty {
    background: #efefef;
  }
}

.brw-chart-weekday {
  text-align: center;
  font-size: 11px;
  color: $text-muted;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.brw-chart-daynum {
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  border-radius: 99px;
  padding: 2px 0;

  &--today {
    background: $accent;
  }
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
