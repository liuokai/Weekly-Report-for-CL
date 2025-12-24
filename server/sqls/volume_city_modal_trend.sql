-- Get volume city modal trend data
-- Parameters: @city, @metric
-- Columns: month, value
SELECT 
    month,
    AVG(value) as value
FROM volume_city_metrics
WHERE city = @city AND metric_type = @metric
GROUP BY month
ORDER BY month;
