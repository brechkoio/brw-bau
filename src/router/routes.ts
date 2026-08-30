import type { RouteRecordRaw } from 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    requiresGuest?: boolean;
    requiresAdmin?: boolean;
    title?: string;
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('@/layouts/AuthLayout.vue'),
    meta: { requiresGuest: true },
    children: [{ path: '', component: () => import('@/pages/auth/LoginPage.vue') }],
  },

  {
    path: '/register',
    component: () => import('@/layouts/AuthLayout.vue'),
    meta: { requiresGuest: true },
    children: [{ path: '', component: () => import('@/pages/auth/RegisterPage.vue') }],
  },

  {
    path: '/forgot-password',
    component: () => import('@/layouts/AuthLayout.vue'),
    meta: { requiresGuest: true },
    children: [{ path: '', component: () => import('@/pages/auth/ForgotPasswordPage.vue') }],
  },

  {
    // No requiresAuth/requiresGuest guard: this page is reached via a
    // one-time recovery-email link, which establishes a temporary Supabase
    // session on load (turning auth.isAuthenticated true) — but a stale or
    // already-used link leaves the visitor unauthenticated. Either way the
    // page itself decides what to show, rather than the router redirecting
    // an unauthenticated visitor away before they can see "link expired".
    path: '/reset-password',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [{ path: '', component: () => import('@/pages/auth/ResetPasswordPage.vue') }],
  },

  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('@/pages/HomePage.vue'),
        meta: { title: 'meta.title.home' },
      },
      {
        path: 'settings',
        component: () => import('@/pages/SettingsPage.vue'),
        meta: { title: 'meta.title.settings' },
      },
      {
        path: 'reports/monthly',
        component: () => import('@/pages/reports/MonthlyReportPage.vue'),
        meta: { title: 'meta.title.monthlyReport' },
      },
      {
        path: 'reports/general',
        component: () => import('@/pages/reports/GeneralReportPage.vue'),
        meta: { requiresAdmin: true, title: 'meta.title.generalReport' },
      },
      {
        path: 'reports/sites',
        component: () => import('@/pages/reports/SitesReportPage.vue'),
        meta: { requiresAdmin: true, title: 'meta.title.sitesReport' },
      },
      {
        path: 'reports/sites-summary',
        component: () => import('@/pages/reports/SitesReportSummaryPage.vue'),
        meta: { requiresAdmin: true, title: 'meta.title.sitesSummaryReport' },
      },
      {
        path: 'admin/rates',
        component: () => import('@/pages/admin/EmployeeRatesPage.vue'),
        meta: { requiresAdmin: true, title: 'meta.title.employeeRates' },
      },
      {
        path: 'admin/sites',
        component: () => import('@/pages/admin/SitesPage.vue'),
        meta: { requiresAdmin: true, title: 'meta.title.sites' },
      },
      {
        path: 'admin/users',
        component: () => import('@/pages/admin/UsersPage.vue'),
        meta: { requiresAdmin: true, title: 'meta.title.users' },
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
    meta: { title: 'meta.title.fallback' },
  },
];

export default routes;
