// src/backend/services/apiQuotaService.ts
// Comprehensive API Usage Tracking, Smart Multi-Tier Caching, and Quota Management for OMDb and TMDb

import { db, auth } from '../config/firebaseConfig';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import {
    getRedisCache,
    setRedisCache,
    incrRedisQuota,
    incrRedisHit,
    getRedisDailyUsage,
} from './redisService';

export interface DailyApiUsage {
    date: string; // YYYY-MM-DD
    omdb: number;
    tmdb: number;
    cacheHits: number;
    lastUpdated: number;
}

export interface ApiQuotaConfig {
    omdbDailyLimit: number; // default 1000 (OMDb free plan limit)
    tmdbDailyLimit: number; // default 2500 (TMDb safety limit)
    blockWhenLimitReached: boolean;
}

export interface CacheStats {
    itemCount: number;
    sizeBytes: number;
    totalHits: number;
}

const DEFAULT_CONFIG: ApiQuotaConfig = {
    omdbDailyLimit: 1000,
    tmdbDailyLimit: 2500,
    blockWhenLimitReached: false,
};

const CACHE_PREFIX = 'b12_api_cache_';
const USAGE_KEY = 'b12_api_usage_today';
const CONFIG_KEY = 'b12_api_quota_config';

// In-Memory Fast Cache Map
const memoryCache = new Map<string, { data: any; expiresAt: number }>();

function getTodayString(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Gets the current daily usage counters from localStorage (with auto-reset on new day)
 */
export function getApiUsage(): DailyApiUsage {
    const today = getTodayString();
    try {
        const stored = localStorage.getItem(USAGE_KEY);
        if (stored) {
            const parsed: DailyApiUsage = JSON.parse(stored);
            if (parsed.date === today) {
                return parsed;
            }
        }
    } catch {
        // Fallback
    }

    // New day or first run
    const fresh: DailyApiUsage = {
        date: today,
        omdb: 0,
        tmdb: 0,
        cacheHits: 0,
        lastUpdated: Date.now(),
    };
    saveApiUsage(fresh);
    return fresh;
}

function saveApiUsage(usage: DailyApiUsage): void {
    try {
        localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
    } catch {
        // Non-blocking
    }
}

/**
 * Gets user-configured API limits
 */
export function getQuotaConfig(): ApiQuotaConfig {
    try {
        const stored = localStorage.getItem(CONFIG_KEY);
        if (stored) {
            return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
        }
    } catch {
        // Fallback
    }
    return DEFAULT_CONFIG;
}

/**
 * Saves user-configured API limits
 */
export function saveQuotaConfig(config: Partial<ApiQuotaConfig>): void {
    const current = getQuotaConfig();
    const updated = { ...current, ...config };
    try {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
    } catch {
        // Non-blocking
    }
}

/**
 * Records an external API call and syncs to localStorage and Firestore asynchronously
 */
export function trackApiCall(api: 'omdb' | 'tmdb'): void {
    const usage = getApiUsage();
    if (api === 'omdb') {
        usage.omdb += 1;
    } else {
        usage.tmdb += 1;
    }
    usage.lastUpdated = Date.now();
    saveApiUsage(usage);

    // Sync to Redis atomically across all users in background
    incrRedisQuota(api).catch(() => {});

    // Sync to Firestore in background (debounced / non-blocking)
    syncUsageToFirestore(usage);
}

/**
 * Records a cache hit (saved external API request)
 */
export function recordCacheHit(): void {
    const usage = getApiUsage();
    usage.cacheHits += 1;
    usage.lastUpdated = Date.now();
    saveApiUsage(usage);

    // Sync to Redis hit counter
    incrRedisHit().catch(() => {});
}

/**
 * Checks if the daily request limit is reached for the selected API
 */
export function isDailyLimitReached(api: 'omdb' | 'tmdb'): boolean {
    const usage = getApiUsage();
    const config = getQuotaConfig();

    if (!config.blockWhenLimitReached) {
        return false;
    }

    if (api === 'omdb') {
        return usage.omdb >= config.omdbDailyLimit;
    } else {
        return usage.tmdb >= config.tmdbDailyLimit;
    }
}

/**
 * Retrieves cached response with memory + localStorage tiering and TTL expiration (synchronous)
 */
export function getCachedApiResponse<T>(cacheKey: string): T | null {
    const now = Date.now();

    // 1. Tier 1: Check In-Memory Map (0ms)
    if (memoryCache.has(cacheKey)) {
        const entry = memoryCache.get(cacheKey)!;
        if (entry.expiresAt > now) {
            recordCacheHit();
            return entry.data as T;
        } else {
            memoryCache.delete(cacheKey);
        }
    }

    // 2. Tier 2: Check localStorage
    try {
        const raw = localStorage.getItem(`${CACHE_PREFIX}${cacheKey}`);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.expiresAt > now) {
                // Populate memory cache for subsequent fast hits
                memoryCache.set(cacheKey, { data: parsed.data, expiresAt: parsed.expiresAt });
                recordCacheHit();
                return parsed.data as T;
            } else {
                localStorage.removeItem(`${CACHE_PREFIX}${cacheKey}`);
            }
        }
    } catch {
        // Fallback
    }

    return null;
}

/**
 * Multi-Tier Cache with Edge Redis:
 * Tier 1: Local RAM / LocalStorage (0ms)
 * Tier 2: Shared Upstash Edge Redis across all users (5-15ms)
 * Tier 3: Fresh API Fetch -> Saves back to RAM, LocalStorage, and Redis
 */
export async function getOrFetchWithRedisCache<T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 14 * 24 * 60 * 60 * 1000
): Promise<T> {
    // 1. Check local fast cache (0ms)
    const localHit = getCachedApiResponse<T>(cacheKey);
    if (localHit) {
        return localHit;
    }

    // 2. Check Shared Redis Edge cache
    try {
        const redisRes = await getRedisCache<T>(cacheKey);
        if (redisRes.hit && redisRes.data) {
            // Populate local tier for subsequent zero-latency hits
            setCachedApiResponse(cacheKey, redisRes.data, ttlMs);
            return redisRes.data;
        }
    } catch {
        // Non-blocking fallback
    }

    // 3. Cache Miss: Fetch from source API
    const freshData = await fetcher();

    // 4. Save to all cache tiers (Memory, LocalStorage, and Redis)
    if (freshData !== undefined && freshData !== null) {
        setCachedApiResponse(cacheKey, freshData, ttlMs);
    }

    return freshData;
}

/**
 * Refreshes local usage counters with the shared global Redis counter
 */
export async function refreshSharedQuotaFromRedis(): Promise<DailyApiUsage> {
    const local = getApiUsage();
    try {
        const redisUsage = await getRedisDailyUsage(local.date);
        if (redisUsage) {
            const merged: DailyApiUsage = {
                date: local.date,
                omdb: Math.max(local.omdb, redisUsage.omdb),
                tmdb: Math.max(local.tmdb, redisUsage.tmdb),
                cacheHits: Math.max(local.cacheHits, redisUsage.cacheHits),
                lastUpdated: Date.now(),
            };
            saveApiUsage(merged);
            return merged;
        }
    } catch {
        // Non-blocking
    }
    return local;
}

/**
 * Sets API response in memory, localStorage, and Edge Redis with TTL
 * @param ttlMs Time-to-live in milliseconds (defaults to 14 days)
 */
export function setCachedApiResponse<T>(cacheKey: string, data: T, ttlMs: number = 14 * 24 * 60 * 60 * 1000): void {
    const expiresAt = Date.now() + ttlMs;

    // 1. Set Memory
    memoryCache.set(cacheKey, { data, expiresAt });

    // 2. Set localStorage
    try {
        localStorage.setItem(
            `${CACHE_PREFIX}${cacheKey}`,
            JSON.stringify({ data, expiresAt })
        );
    } catch (e) {
        // In case localStorage is full, purge expired items
        purgeExpiredCache();
    }

    // 3. Set Edge Redis asynchronously
    setRedisCache(cacheKey, data, Math.floor(ttlMs / 1000)).catch(() => {});
}

/**
 * Purges expired cache entries from localStorage
 */
export function purgeExpiredCache(): void {
    const now = Date.now();
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                try {
                    const raw = localStorage.getItem(key);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (parsed.expiresAt <= now) {
                            localStorage.removeItem(key);
                        }
                    }
                } catch {
                    localStorage.removeItem(key);
                }
            }
        }
    } catch {
        // Non-blocking
    }
}

/**
 * Completely clears all cached API items from memory and localStorage
 */
export function clearApiCache(): number {
    let clearedCount = 0;
    memoryCache.clear();

    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(k => {
            localStorage.removeItem(k);
            clearedCount++;
        });
    } catch {
        // Non-blocking
    }

    return clearedCount;
}

/**
 * Returns cache analytics (item count, memory size, total hits)
 */
export function getCacheStats(): CacheStats {
    let itemCount = 0;
    let sizeBytes = 0;

    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_PREFIX)) {
                itemCount++;
                const val = localStorage.getItem(key) || '';
                sizeBytes += (key.length + val.length) * 2; // UTF-16 byte estimation
            }
        }
    } catch {
        // Non-blocking
    }

    const usage = getApiUsage();
    return {
        itemCount,
        sizeBytes,
        totalHits: usage.cacheHits,
    };
}

// Background Firestore Sync
let firestoreTimeout: number | null = null;
function syncUsageToFirestore(usage: DailyApiUsage): void {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;

    if (firestoreTimeout) clearTimeout(firestoreTimeout);

    firestoreTimeout = window.setTimeout(async () => {
        try {
            const usageRef = doc(db, 'apiUsage', `${currentUserId}_${usage.date}`);
            await setDoc(usageRef, {
                userId: currentUserId,
                date: usage.date,
                omdb: usage.omdb,
                tmdb: usage.tmdb,
                cacheHits: usage.cacheHits,
                updatedAt: serverTimestamp(),
            }, { merge: true });
        } catch {
            // Non-blocking
        }
    }, 2000);
}
