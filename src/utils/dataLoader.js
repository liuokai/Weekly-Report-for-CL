import cacheManager from './cacheManager';

// List of all query keys used in the application
// This should ideally be synced with server/queryRegistry.js
export const PRELOAD_QUERIES = [
  'getTurnoverOverview',
  'getWeeklyTurnover',
  'getWeeklyTurnoverCum',
  'getWeeklyTurnoverAvgDay',
  'getCityTurnover',
  'getWeeklyAvgPriceYTD',
  'getWeeklyAvgPrice',
  'getCityAnnualAvgPrice',
  'getAnnualAvgPrice',
  'getCityWeeklyAvgPriceYTD',
  'getStoreWeeklyAvgPriceYTD',
  'getRepurchaseRateAnnual',
  'getRepurchaseRateWeekly',
  'getRepurchaseRateCityWeekly',
  'getRepurchaseRateStoreWeekly',
  'getCityStoreWeeklyTurnover',
  'getProfitYearly',
  'getProfitTrend',
  'getNewEmpReturnComplianceAnnual',
  'getNewEmpReturnComplianceMonthly',
  'getNewEmpReturnComplianceCityAnnual',
  'getNewEmpReturnComplianceCityMonthly',
  'getNewEmpReturnComplianceStoreAnnual',
  'getEmployeeOutputStandardRateMonthly',
  'getEmployeeOutputStandardRateCityMonthly',
  'getEmployeeOutputStandardRateStoreMonthly',
  'getBedStaffRatioAnnual',
  'getBedStaffRatioWeekly',
  'getBedStaffRatioCityAnnual',
  'getBedStaffRatioCityWeekly',
  'getBedStaffRatioStoreAnnual',
  'getUserVisitCountAnnual',
  'getUserVisitCountDailyAvgMonthly',
  'getUserVisitCountCumMonthly',
  'getStaffServiceDurationMonthly',
  'getStaffServiceDurationCityMonthly',
  'getStaffServiceDurationBelowStandardMonthly',
  'getStaffServiceDurationBelowStandardCityMonthly',
  'getActiveUserMonthlyYoy',
  'getActiveUserCityMonthlyYoy',
  'getMemberChurnRateMonthlyYoy',
  'getMemberChurnRateCityMonthlyYoy',
  'getActiveReviewRateMonthlyYoy',
  'getActiveReviewRateCityMonthlyYoy',
  'getActiveReviewRateStoreMonthlyYoy',
  'getActiveUserStoreMonthlyYoy',
  'getMemberChurnRateStoreMonthlyYoy'
];

class DataLoader {
  constructor() {
    this.requestQueue = [];
    this.activeRequests = 0;
    this.MAX_CONCURRENT_REQUESTS = 6; // Optimized: Safe to increase concurrency as SQLs are optimized and backend pool is sufficient
    this.cacheManager = cacheManager;
    this.memoryCache = new Map();
    this.inflightRequests = new Map();
    this.isUnloading = false;

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.isUnloading = true;
      });
    }
  }

  _buildCacheKey(queryKey, params) {
    if (params == null) return queryKey;

    if (Array.isArray(params)) {
      if (params.length === 0) return queryKey;
      return `${queryKey}_${JSON.stringify(params)}`;
    }

    if (typeof params === 'object') {
      const keys = Object.keys(params);
      if (keys.length === 0) return queryKey;
      return `${queryKey}_${JSON.stringify(params)}`;
    }

    return `${queryKey}_${JSON.stringify(params)}`;
  }

  /**
   * Enqueue a request and process it when a slot is available
   */
  async fetchData(queryKey, params = []) {
    const uniqueCacheKey = this._buildCacheKey(queryKey, params);

    if (this.memoryCache.has(uniqueCacheKey)) {
      return { status: 'success', data: this.memoryCache.get(uniqueCacheKey) };
    }

    const cached = cacheManager.get(uniqueCacheKey);
    if (cached) {
      this.memoryCache.set(uniqueCacheKey, cached);
      return { status: 'success', data: cached };
    }

    const inflight = this.inflightRequests.get(uniqueCacheKey);
    if (inflight) return inflight;

    const inflightPromise = new Promise((resolve, reject) => {
      const task = async () => {
        try {
          // Attempt 1
          const result = await this._executeRequest(queryKey, params);
          resolve(result);
        } catch (error) {
          // Retry logic for 504 or network errors
          if (
            error.message.includes('504') ||
            error.message.includes('timeout') ||
            error.message.includes('Network Error') ||
            error.message.includes('Failed to fetch')
          ) {
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
          this.inflightRequests.delete(uniqueCacheKey);
          this._processQueue();
        }
      };

      this.requestQueue.push(task);
      this._processQueue();
    });

    this.inflightRequests.set(uniqueCacheKey, inflightPromise);
    return inflightPromise;
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
    const uniqueCacheKey = this._buildCacheKey(queryKey, params);

    if (this.memoryCache.has(uniqueCacheKey)) {
      return { status: 'success', data: this.memoryCache.get(uniqueCacheKey) };
    }

    const cached = cacheManager.get(uniqueCacheKey);
    if (cached) {
      this.memoryCache.set(uniqueCacheKey, cached);
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
      this.memoryCache.set(uniqueCacheKey, result.data);
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
      this.fetchData(queryKey, []).catch(err => {
        if (this.isUnloading) return null;
        console.error(`[Prefetch] Error for ${queryKey}:`, err);
        return null;
      })
    );
    
    await Promise.allSettled(promises);
    console.log('Data prefetch completed.');
  }
}

export default new DataLoader();
