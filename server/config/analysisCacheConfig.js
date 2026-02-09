module.exports = {
  // Whether to enable analysis cache
  ENABLED: true,
  
  // Cache TTL (seconds), default 24 hours (since data is monthly/daily, 24h is reasonable)
  TTL: 3600 * 24,
  
  // Cache check period (seconds)
  CHECK_PERIOD: 600
};
