-- Get volume city modal store data
-- Parameters: @city, @metric
-- Columns: store_name, month, value
SELECT 
    store_name,
    month,
    value
FROM volume_store_metrics
WHERE city = @city AND metric_type = @metric
ORDER BY store_name, month;
