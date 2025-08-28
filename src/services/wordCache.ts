import AsyncStorage from '@react-native-async-storage/async-storage';

interface WordCache {
  word: string;
  translation: string;
  definition: string;
  timestamp: number;
}

const CACHE_PREFIX = 'wordCache_';
const MAX_CACHE_ITEMS = 1000;
const CLEANUP_PERCENT = 0.2;
const CACHE_EXPIRE_DAYS = 7;

export async function getFromCache(word: string): Promise<WordCache | null> {
  try {
    const key = `${CACHE_PREFIX}${word.toLowerCase()}`;
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const data: WordCache = JSON.parse(cached);
    if (!isCacheValid(data.timestamp)) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Failed to get from cache:', error);
    return null;
  }
}

export async function saveToCache(data: WordCache): Promise<void> {
  try {
    const key = `${CACHE_PREFIX}${data.word.toLowerCase()}`;
    await AsyncStorage.setItem(key, JSON.stringify(data));
    await checkAndCleanupCache();
  } catch (error) {
    console.error('Failed to save to cache:', error);
  }
}

async function checkAndCleanupCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
    
    if (cacheKeys.length > MAX_CACHE_ITEMS) {
      const items = await AsyncStorage.multiGet(cacheKeys);
      const sorted = items
        .map(([key, value]) => ({
          key,
          timestamp: value ? JSON.parse(value).timestamp : 0
        }))
        .sort((a, b) => a.timestamp - b.timestamp);

      const removeCount = Math.floor(cacheKeys.length * CLEANUP_PERCENT);
      const toRemove = sorted.slice(0, removeCount).map(item => item.key);
      await AsyncStorage.multiRemove(toRemove);
    }
  } catch (error) {
    console.error('Failed to cleanup cache:', error);
  }
}

function isCacheValid(timestamp: number): boolean {
  const now = Date.now();
  const expireTime = CACHE_EXPIRE_DAYS * 24 * 60 * 60 * 1000;
  return now - timestamp < expireTime;
}
