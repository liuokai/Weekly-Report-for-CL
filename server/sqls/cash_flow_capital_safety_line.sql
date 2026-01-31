-- 资金安全线（滚动计算）

SELECT
    a.date, a.city_name, a.total_funds
FROM data_warehouse.dws_fund_safety_line a
INNER JOIN (
    SELECT MAX(date) as max_date
    FROM data_warehouse.dws_fund_safety_line
) b ON a.date = b.max_date;