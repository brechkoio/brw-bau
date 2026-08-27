import { register } from 'register-service-worker';
import { Notify } from 'quasar';
import { i18n } from '@/boot/i18n';

// The ready(), registered(), cached(), updatefound() and updated()
// events passes a ServiceWorkerRegistration instance in their arguments.
// ServiceWorkerRegistration: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration

register(import.meta.env.QUASAR_SERVICE_WORKER_FILE, {
  // The registrationOptions object will be passed as the second argument
  // to ServiceWorkerContainer.register()
  // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register#Parameter

  // registrationOptions: { scope: './' },

  ready(/* registration */) {
    // console.log('Service worker is active.')
  },

  registered(/* registration */) {
    // console.log('Service worker has been registered.')
  },

  cached(/* registration */) {
    // console.log('Content has been cached for offline use.')
  },

  updatefound(/* registration */) {
    // console.log('New content is downloading.')
  },

  // A new service worker has finished installing (skipWaiting/clientsClaim
  // are on, so it's already taken over in the background) — prompt the
  // user to reload rather than yanking the page out from under them
  // mid-task. Anyone who ignores this and hits a stale chunk anyway is
  // still caught by the vite:preloadError handler in src/boot/chunk-reload.
  updated() {
    const { t } = i18n.global;
    Notify.create({
      message: t('pwa.updateAvailable'),
      color: 'dark',
      position: 'bottom',
      timeout: 0,
      actions: [
        {
          label: t('pwa.updateAction'),
          color: 'accent',
          handler: () => window.location.reload(),
        },
        { icon: 'close', color: 'white' },
      ],
    });
  },

  offline() {
    // console.log('No internet connection found. App is running in offline mode.')
  },

  error(/* err */) {
    // console.error('Error during service worker registration:', err)
  },
});
