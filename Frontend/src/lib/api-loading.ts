type Listener = (pending: number) => void;

let pending = 0;
const listeners = new Set<Listener>();

export function getApiPendingCount() {
  return pending;
}

export function subscribeApiLoading(listener: Listener) {
  listeners.add(listener);
  listener(pending);
  return () => {
    listeners.delete(listener);
  };
}

export function beginApiLoading() {
  pending += 1;
  listeners.forEach((listener) => listener(pending));
}

export function endApiLoading() {
  pending = Math.max(0, pending - 1);
  listeners.forEach((listener) => listener(pending));
}
