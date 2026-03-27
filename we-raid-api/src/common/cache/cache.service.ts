import { Injectable } from '@nestjs/common'

interface CacheEntry {
  value: string
  expiresAt: number | null
}

@Injectable()
export class CacheService {
  private store = new Map<string, CacheEntry>()

  set(key: string, value: string, ttlSeconds?: number): void {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    })
  }

  get(key: string): string | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  del(key: string): void {
    this.store.delete(key)
  }
}
