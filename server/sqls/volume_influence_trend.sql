-- Get volume influence trend data
-- Parameters: @metric (e.g., 'duration', 'compliance', 'utilization', etc.)
-- Columns: month, current_value, last_year_value
SELECT 
    month,
    AVG(current_value) as current_value,
    AVG(last_year_value) as last_year_value
FROM volume_influence_metrics
WHERE metric_type = @metric
GROUP BY month
ORDER BY month;
