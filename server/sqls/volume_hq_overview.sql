-- Get volume HQ overview data
-- Columns: current_volume, last_year_volume, total_expense, labor_cost_total, labor_city, labor_ops, marketing_discount
SELECT 
    SUM(current_volume) as current_volume,
    SUM(last_year_volume) as last_year_volume,
    3011 as total_expense, -- Mock/Static for now as per instructions
    372 as labor_cost_total,
    309 as labor_city,
    62.3 as labor_ops,
    2640 as marketing_discount
FROM volume_metrics;
