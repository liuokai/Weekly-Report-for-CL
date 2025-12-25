import { useState, useCallback, useEffect } from 'react';
import cacheManager from '../utils/cacheManager';

const useFetchData = (queryKey, params = [], initialData = null, options = {}) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use a ref to store the current params to avoid dependency cycles if params is an unstable array
  // But we also want to refetch if params change. 
  // Best approach for simple params (strings/numbers) is JSON.stringify for dependency.
  const paramsString = JSON.stringify(params);

  // Note: options.cacheKey/cacheTime are deprecated in favor of global CacheManager strategy,
  // but we keep the options object signature for backward compatibility if needed, 
  // though we ignore them for the caching logic (using queryKey + params as identity).
  
  const fetchData = useCallback(async (overrideParams) => {
    const activeParams = overrideParams || params;
    const activeParamsString = JSON.stringify(activeParams);
    
    // Generate a unique cache key based on queryKey and params
    // If params are empty, it's just the queryKey.
    // If params exist, append them.
    let uniqueCacheKey = queryKey;
    if (activeParams && activeParams.length > 0) {
       uniqueCacheKey += `_${activeParamsString}`;
    }

    // 1. Check Global Cache Manager
    const cachedData = cacheManager.get(uniqueCacheKey);
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/fetch-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          queryKey, 
          params: activeParams 
        }),
      });
      const result = await response.json();
      if (result.status === 'success') {
        setData(result.data);
        // 2. Save to Global Cache Manager
        cacheManager.set(uniqueCacheKey, result.data);
      } else {
        setError(result.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [queryKey, paramsString]);

  // Optionally auto-fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, fetchData, setData };
};

export default useFetchData;
