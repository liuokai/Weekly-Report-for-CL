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
  'getVolumeCityModalStoreData',
  // 新增：新员工回头率达标率相关
  'getNewEmpReturnComplianceAnnual',
  'getNewEmpReturnComplianceMonthly',
  'getNewEmpReturnComplianceCityAnnual',
  'getNewEmpReturnComplianceStoreAnnual'
];

class DataLoader {
  constructor() {
    this.requestQueue = [];
    this.activeRequests = 0;
    this.MAX_CONCURRENT_REQUESTS = 6; // Optimized: Safe to increase concurrency as SQLs are optimized and backend pool is sufficient
    this.cacheManager = cacheManager;
  }

  /**
   * Enqueue a request and process it when a slot is available
   */
  async fetchData(queryKey, params = []) {
    return new Promise((resolve, reject) => {
      const task = async () => {
        try {
          // Attempt 1
          const result = await this._executeRequest(queryKey, params);
          resolve(result);
        } catch (error) {
          // Retry logic for 504 or network errors
          if (error.message.includes('504') || error.message.includes('timeout') || error.message.includes('Network Error')) {
            console.warn(`[DataLoader] Retry ${queryKey} due to error: ${error.message}`);
            try {
              // Wait 1 second before retry
              await new Promise(r => setTimeout(r, 1000));
              const retryResult = await this._executeRequest(queryKey, params);
              resolve(retryResult);
            } catch (retryError) {
              reject(retryError);
            }
          } else {
            reject(error);
          }
        } finally {
          this.activeRequests--;
          this._processQueue();
        }
      };

      this.requestQueue.push(task);
      this._processQueue();
    });
  }

  _processQueue() {
    if (this.requestQueue.length === 0 || this.activeRequests >= this.MAX_CONCURRENT_REQUESTS) {
      return;
    }

    const task = this.requestQueue.shift();
    this.activeRequests++;
    task();
  }

  async _executeRequest(queryKey, params) {
    // Generate cache key
    let uniqueCacheKey = queryKey;
    if (params && params.length > 0) {
      uniqueCacheKey += `_${JSON.stringify(params)}`;
    }

    // Check cache
    const cached = cacheManager.get(uniqueCacheKey);
    if (cached) {
      return { status: 'success', data: cached };
    }

    console.log(`[DataLoader] Fetching ${queryKey}...`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

    try {
      const response = await fetch('/api/fetch-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryKey, params }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server error: ${response.status} ${response.statusText} - ${text}`);
      }

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error(`[DataLoader] Invalid JSON for ${queryKey}:`, text.substring(0, 100));
        throw new Error(`Invalid JSON response`);
      }

      // Cache the result
      cacheManager.set(uniqueCacheKey, result.data);

      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout for ${queryKey}`);
      }
      throw error;
    }
  }

  /**
   * Prefetch all registered queries.
   * Checks cache first; if missing or stale, fetches from server.
   */
  async prefetchAll() {
    console.log('Starting data prefetch...');
    // Simply delegate to the queue-managed fetchData
    const promises = PRELOAD_QUERIES.map(queryKey => 
      this.fetchData(queryKey, []).catch(err => 
        console.error(`[Prefetch] Error for ${queryKey}:`, err)
      )
    );
    
    await Promise.allSettled(promises);
    console.log('Data prefetch completed.');
  }
}

export default new DataLoader();
