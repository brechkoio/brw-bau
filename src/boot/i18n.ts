import { defineBoot } from '#q-app';
import { createI18n } from 'vue-i18n';
import { Quasar } from 'quasar';
import messages, { type MessageSchema } from '@/i18n';
import { getInitialLocale, loadQuasarLang } from '@/composables/use-locale';

declare module 'vue-i18n' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefineLocaleMessage extends MessageSchema {}
}

// Created at module scope (not inside the boot function) so code outside
// the Vue app — register-sw.ts runs before any component tree exists — can
// still import `i18n.global.t(...)` for one-off translated strings.
export const i18n = createI18n({
  locale: getInitialLocale(),
  fallbackLocale: 'uk',
  legacy: false,
  messages,
});

export default defineBoot(async ({ app }) => {
  app.use(i18n);

  Quasar.lang.set(await loadQuasarLang(i18n.global.locale.value));
});
