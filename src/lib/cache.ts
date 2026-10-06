type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export class MemoryCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  constructor(private ttlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      return undefined;
    }

    return entry.value;
  }

  peek(key: string, maxStaleMs = this.ttlMs): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt + maxStaleMs) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }
}

const windowMs = 60_000;
const maxRequests = 30;
const hits: number[] = [];

export function isRateLimited(): boolean {
  const now = Date.now();
  while (hits.length > 0 && now - hits[0] > windowMs) {
    hits.shift();
  }

  if (hits.length >= maxRequests) {
    return true;
  }

  hits.push(now);
  return false;
}
