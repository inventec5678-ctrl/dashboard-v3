const _cache = new Map<string, { data: any; expires: number }>();
const DEFAULT_TTL = 60000; // 60秒

export function cacheGet<T>(key: string): T | null {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    _cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function cacheSet<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
  _cache.set(key, { data, expires: Date.now() + ttl });
}

export function cacheInvalidate(key: string): void {
  if (key === '*') {
    _cache.clear();
  } else {
    _cache.delete(key);
  }
}

export function cacheInvalidatePattern(prefix: string): void {
  for (const k of _cache.keys()) {
    if (k.startsWith(prefix)) _cache.delete(k);
  }
}