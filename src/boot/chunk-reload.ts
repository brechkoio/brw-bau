import { defineBoot } from '#q-app';

// After a new deploy, GitHub Pages overwrites the previous build's hashed
// chunk files (e.g. MainLayout-<hash>.js). A tab still running the old
// build — or one served from a stale PWA cache — can try to lazy-load a
// route chunk that no longer exists, which Vite's own runtime surfaces as
// this specific event. Reloading picks up the current index.html, which
// points at the chunks that actually exist now.
//
// Guarded to fire at most once per tab: if the reload doesn't fix it (a
// genuinely broken deploy, not just a stale cache), retrying forever would
// just reload-loop instead of showing the error.
const RELOAD_FLAG = 'brw.chunkReload';

export default defineBoot(() => {
  window.addEventListener('vite:preloadError', () => {
    try {
      if (sessionStorage.getItem(RELOAD_FLAG)) return;
      sessionStorage.setItem(RELOAD_FLAG, 'true');
    } catch {
      // ignore private mode; worst case we reload more than once
    }
    window.location.reload();
  });
});
