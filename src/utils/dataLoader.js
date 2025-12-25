import cacheManager from './cacheManager';

// List of all query keys used in the application
// This should ideally be synced with server/queryRegistry.js
export const PRELOAD_QUERIES = [
  'getTurnoverOverview',
  'getHQMetrics',
  'getWeeklyTurnover',
  'getWeeklyTurnoverCum',
  'getWeeklyTurnoverAvgDay',
  'getCityTurnover',
  'getStoreList',
  'getProcessMetricTrend',
  'getProcessCityData',
  'getVolumeTrend',
  'getVolumeInfluenceCity',
  'getCityPriceGrowth',
  'getCityModalTrend',
  'getCityModalStoreData',
  'getVolumeCityBreakdown',
  'getVolumeHQOverview',
  'getVolumeInfluenceTrend',
  'getVolumeCityModalTrend',
  'getVolumeCityModalStoreData'
];

class DataLoader {
  /**
   * Prefetch all registered queries.
   * Checks cache first; if missing or stale, fetches from server.
   */
  async prefetchAll() {
    console.log('Starting data prefetch...');
    const promises = PRELOAD_QUERIES.map(async (queryKey) => {
      // 1. Check if valid cache exists
      const cached = cacheManager.get(queryKey);
      if (cached) {
        // console.log(`[Prefetch] Cache hit for ${queryKey}`);
        return;
      }

      // 2. Fetch from server
      try {
        // console.log(`[Prefetch] Fetching ${queryKey}...`);
        const response = await fetch('/api/fetch-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queryKey, params: [] }), // Assuming most preloads don't need params or use default
        });
        const result = await response.json();
        
        if (result.status === 'success') {
          cacheManager.set(queryKey, result.data);
          // console.log(`[Prefetch] Fetched & Cached ${queryKey}`);
        } else {
          console.warn(`[Prefetch] Failed to fetch ${queryKey}: ${result.message}`);
        }
      } catch (err) {
        console.error(`[Prefetch] Network error for ${queryKey}:`, err);
      }
    });

    await Promise.allSettled(promises);
    console.log('Data prefetch completed.');
  }
}

export default new DataLoader();
