import { useState, useCallback, useEffect } from 'react';

const useFetchData = (queryKey, params = [], initialData = null) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use a ref to store the current params to avoid dependency cycles if params is an unstable array
  // But we also want to refetch if params change. 
  // Best approach for simple params (strings/numbers) is JSON.stringify for dependency.
  const paramsString = JSON.stringify(params);

  const fetchData = useCallback(async (overrideParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/fetch-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          queryKey, 
          params: overrideParams || params 
        }),
      });
      const result = await response.json();
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
  }, [queryKey, paramsString]); // Depend on stringified params

  // Optionally auto-fetch on mount if params are provided and stable
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, fetchData, setData };
};

export default useFetchData;
