export interface Coords {
  lat: number;
  lng: number;
}

// Best-effort: resolves null (never rejects) if the browser has no
// geolocation API, the user denies/ignores the permission prompt, or the
// fix times out — callers decide whether that's worth surfacing to the user.
export function getCurrentCoords(timeout = 8000): Promise<Coords | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout },
    );
  });
}
