import { useState, useCallback, useEffect } from 'react';
import dataLoader from '../utils/dataLoader';

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
    
    setLoading(true);
    setError(null);
    try {
      // Delegate to global DataLoader which handles queuing, caching, and batching
      const result = await dataLoader.fetchData(queryKey, activeParams);
      
      if (result.status === 'success') {
        setData(result.data);
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
    if (!options.manual) {
      fetchData();
    }
  }, [fetchData, options.manual]);
  
  return { data, loading, error, fetchData, setData };
};

export default useFetchData;
