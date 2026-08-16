import type { RouteRecordRaw } from 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    requiresGuest?: boolean;
    requiresAdmin?: boolean;
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
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', component: () => import('@/pages/HomePage.vue') },
      { path: 'settings', component: () => import('@/pages/SettingsPage.vue') },
      { path: 'reports/monthly', component: () => import('@/pages/reports/MonthlyReportPage.vue') },
      {
        path: 'reports/general',
        component: () => import('@/pages/reports/GeneralReportPage.vue'),
        meta: { requiresAdmin: true },
      },
      {
        path: 'admin/rates',
        component: () => import('@/pages/admin/EmployeeRatesPage.vue'),
        meta: { requiresAdmin: true },
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
];

export default routes;
