-- 获取城市年度营业额（仅返回实际值，目标由前端配置文件控制）
SELECT
    b.statistics_city_name,
    SUM(a.order_actual_payment) AS actual_turnover
FROM data_warehouse.dwd_sales_order_detail AS a
LEFT JOIN dm_city AS b
    ON a.city_code = b.city_code
WHERE a.off_clock_time >= '2025-01-01'
GROUP BY
    b.statistics_city_name;
