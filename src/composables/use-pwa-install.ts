import { computed, onMounted, onUnmounted, ref } from 'vue';

const DISMISS_KEY = 'brw.pwa.installDismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    ('standalone' in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isIosSafariBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const ios =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!ios) return false;
  const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|YaBrowser/i.test(ua);
  return /WebKit/i.test(ua) && !otherBrowser;
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
const dismissed = ref(false);
const standalone = ref(false);
const iosSafari = ref(false);
let listenersBound = false;

function onBeforeInstallPrompt(event: Event) {
  event.preventDefault();
  deferredPrompt.value = event as BeforeInstallPromptEvent;
}

function onAppInstalled() {
  deferredPrompt.value = null;
  standalone.value = true;
}

function bindListeners() {
  if (listenersBound || typeof window === 'undefined') return;
  listenersBound = true;
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  window.addEventListener('appinstalled', onAppInstalled);
}

export function usePwaInstall() {
  bindListeners();

  onMounted(() => {
    standalone.value = isStandaloneDisplay();
    iosSafari.value = isIosSafariBrowser() && !standalone.value;
    try {
      dismissed.value = localStorage.getItem(DISMISS_KEY) === 'true';
    } catch {
      dismissed.value = false;
    }
  });

  onUnmounted(() => {
    // Keep global listeners: the prompt event can fire once per page load.
  });

  const canNativeInstall = computed(() => deferredPrompt.value !== null);

  const showBanner = computed(
    () => !standalone.value && !dismissed.value && (canNativeInstall.value || iosSafari.value),
  );

  const showSettingsAction = computed(
    () => !standalone.value && (canNativeInstall.value || iosSafari.value),
  );

  async function install() {
    const promptEvent = deferredPrompt.value;
    if (!promptEvent) return false;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    deferredPrompt.value = null;
    if (choice.outcome === 'accepted') {
      standalone.value = true;
      return true;
    }
    return false;
  }

  function dismiss() {
    dismissed.value = true;
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // ignore quota / private mode
    }
  }

  return {
    showBanner,
    showSettingsAction,
    canNativeInstall,
    iosSafari,
    standalone,
    install,
    dismiss,
  };
}
