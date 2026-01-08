-- 城市年度营业额统计
SELECT
    year(off_clock_time) year,
    b.statistics_city_name,
    SUM(a.order_actual_payment) AS actual_turnover
FROM data_warehouse.dwd_sales_order_detail AS a
LEFT JOIN dm_city AS b
    ON a.city_code = b.city_code
WHERE a.off_clock_time >= '2025-01-01'
GROUP BY
    year(off_clock_time),
    b.statistics_city_name;