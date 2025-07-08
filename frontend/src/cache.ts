// A simple in-memory cache with TTL
const cacheStore = new Map<string, { data: any; expires: number }>();

const set = (key: string, data: any, ttl: number = 60 * 1000) => {
  const expires = Date.now() + ttl;
  cacheStore.set(key, { data, expires });
};

const get = (key: string): any | null => {
  const cached = cacheStore.get(key);
  if (!cached) {
    return null;
  }

  if (Date.now() > cached.expires) {
    cacheStore.delete(key);
    return null;
  }

  return cached.data;
};

export const cache = { get, set };
