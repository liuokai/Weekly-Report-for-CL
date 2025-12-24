-- Get volume city breakdown data
-- Columns: city, current_volume, last_year_volume
SELECT 
    city_name as city,
    SUM(current_volume) as current_volume,
    SUM(last_year_volume) as last_year_volume
FROM volume_metrics
GROUP BY city_name
ORDER BY current_volume DESC;
