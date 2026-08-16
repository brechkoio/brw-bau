import { defineBoot } from '#q-app';
import { createI18n } from 'vue-i18n';
import { Quasar } from 'quasar';
import messages, { type MessageSchema } from '@/i18n';
import { getInitialLocale, loadQuasarLang } from '@/composables/use-locale';

declare module 'vue-i18n' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefineLocaleMessage extends MessageSchema {}
}

export default defineBoot(async ({ app }) => {
  const locale = getInitialLocale();

  const i18n = createI18n({
    locale,
    fallbackLocale: 'uk',
    legacy: false,
    messages,
  });

  app.use(i18n);

  Quasar.lang.set(await loadQuasarLang(locale));
});
