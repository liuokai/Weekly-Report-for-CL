const NodeCache = require('node-cache');

// Initialize cache with standard TTL of 1 hour (3600 seconds)
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

/**
 * Generate a unique cache key based on query key and params
 * @param {string} queryKey 
 * @param {Array} params 
 */
const generateKey = (queryKey, params) => {
  return `${queryKey}_${JSON.stringify(params || [])}`;
};

module.exports = {
  get: (queryKey, params) => {
    const key = generateKey(queryKey, params);
    return cache.get(key);
  },
  
  set: (queryKey, params, data) => {
    const key = generateKey(queryKey, params);
    return cache.set(key, data);
  },
  
  flush: () => {
    cache.flushAll();
  }
};
