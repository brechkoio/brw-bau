import { defineBoot } from '#q-app';
import { flushLoginFailures } from '@/utils/login-failures';

// Send failed sign-in reports that couldn't be delivered when they
// happened (see src/utils/login-failures.ts) as soon as there's a chance
// the server is reachable: on start, and when the device reconnects.
export default defineBoot(() => {
  void flushLoginFailures();
  window.addEventListener('online', () => void flushLoginFailures());
});
