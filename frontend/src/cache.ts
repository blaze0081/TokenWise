// A simple in-memory cache with TTL
const cacheStore = new Map<string, { data: unknown; expires: number }>();

const set = <T>(key: string, data: T, ttl: number = 60 * 1000): void => {
  const expires = Date.now() + ttl;
  cacheStore.set(key, { data, expires });
};

const get = <T>(key: string): T | null => {
  const cached = cacheStore.get(key);
  if (!cached) {
    return null;
  }

  if (Date.now() > cached.expires) {
    cacheStore.delete(key);
    return null;
  }

  return cached.data as T;
};

export const cache = { get, set };

