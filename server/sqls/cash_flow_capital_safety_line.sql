-- 资金安全线（滚动计算）

SELECT 
    month,
    city_name,
    SUM(total_funds) as total_funds
FROM data_warehouse.dws_fund_safety_line
WHERE month = date_format(date_sub(curdate(),interval 1 month),'%Y-%m')
GROUP BY month, city_name
