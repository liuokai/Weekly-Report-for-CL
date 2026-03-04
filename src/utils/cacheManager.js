/**
 * Global Cache Manager
 * Implements T+1 caching strategy with configurable update hour.
 */
class CacheManager {
  constructor() {
    this.storageKeyPrefix = 'cl_weekly_cache_v3_'; // Updated prefix to invalidate old cache
    this.configKey = 'cl_weekly_cache_config';
    this.defaultUpdateHour = 8; // 8:00 AM
    this.enableCache = true; // Switch to control cache mechanism. Set to false to disable cache.
    
    if (this.enableCache) {
      this.clearInvalidCache();
    } else {
      this.clearAllCache();
    }
  }

  /**
   * Clear all cache related to this application
   */
  clearAllCache() {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.storageKeyPrefix)) {
          localStorage.removeItem(key);
        }
      });
      console.log('CacheManager: All cache cleared.');
    } catch (e) {
      console.warn('Failed to clear cache', e);
    }
  }

  /**
   * Clear only invalid (stale) cache
   */
  clearInvalidCache() {
     // This is implicitly handled by get() validation, 
     // but we could actively scan and remove here if needed.
     // For now, we leave it lazy.
  }

  /**
   * Get the configured update hour (0-23)
   */
  getUpdateHour() {
    try {
      const config = localStorage.getItem(this.configKey);
      if (config) {
        const { updateHour } = JSON.parse(config);
        return typeof updateHour === 'number' ? updateHour : this.defaultUpdateHour;
      }
    } catch (e) {
      console.warn('Failed to parse cache config', e);
    }
    return this.defaultUpdateHour;
  }

  /**
   * Set the update hour
   * @param {number} hour 0-23
   */
  setUpdateHour(hour) {
    if (hour < 0 || hour > 23) {
      console.error('Invalid update hour. Must be between 0 and 23.');
      return;
    }
    localStorage.setItem(this.configKey, JSON.stringify({ updateHour: hour }));
    // Note: Changing update hour might technically invalidate current valid caches depending on interpretation,
    // but usually we just let them expire naturally or check against the new rule next time.
    // For strict consistency, we could clear all caches, but that might be overkill.
    // Let's keep it simple for now.
  }

  /**
   * Calculate the start timestamp of the current valid data period.
   * If now is 8:00 and updateHour is 7:00, the period started today at 7:00.
   * If now is 6:00 and updateHour is 7:00, the period started yesterday at 7:00.
   */
  getCurrentPeriodStart() {
    const now = new Date();
    const updateHour = this.getUpdateHour();
    
    const periodStart = new Date(now);
    periodStart.setHours(updateHour, 0, 0, 0);

    if (now.getHours() < updateHour) {
      // It's before the update time today, so the current period started yesterday
      periodStart.setDate(periodStart.getDate() - 1);
    }
    
    return periodStart.getTime();
  }

  /**
   * Get data from cache
   * @param {string} key 
   * @returns {any|null}
   */
  get(key) {
    if (!this.enableCache) return null; // Cache disabled

    try {
      const fullKey = this.storageKeyPrefix + key;
      const raw = localStorage.getItem(fullKey);
      if (!raw) return null;

      const { data, timestamp } = JSON.parse(raw);
      
      const periodStart = this.getCurrentPeriodStart();

      // If the cache was created BEFORE the current period started, it's invalid.
      // Example: Period starts at Today 7:00. Cache made at Today 6:59 (Yesterday's data) -> Invalid.
      // Cache made at Today 7:01 -> Valid.
      if (timestamp < periodStart) {
        // Cache is stale
        // localStorage.removeItem(fullKey); // Optional: clean up immediately or lazy
        return null;
      }

      return data;
    } catch (e) {
      console.warn(`Failed to read cache for ${key}`, e);
      return null;
    }
  }

  /**
   * Save data to cache
   * @param {string} key 
   * @param {any} data 
   */
  set(key, data) {
    if (!this.enableCache) return; // Cache disabled

    try {
      const fullKey = this.storageKeyPrefix + key;
      const cacheItem = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(fullKey, JSON.stringify(cacheItem));
    } catch (e) {
      console.warn(`Failed to write cache for ${key}`, e);
    }
  }

  /**
   * Clear all app-specific cache
   */
  clearAll() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.storageKeyPrefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

export default new CacheManager();
