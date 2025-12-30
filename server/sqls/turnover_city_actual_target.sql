-- 获取城市年度营业额
WITH city_turnover_target AS (
    SELECT '成都市'  AS statistics_city_name, 167010966 AS turnover_target UNION ALL
    SELECT '重庆市'  AS statistics_city_name, 53365585  UNION ALL
    SELECT '深圳市'  AS statistics_city_name, 85732032  UNION ALL
    SELECT '杭州市'  AS statistics_city_name, 35037613  UNION ALL
    SELECT '南京市'  AS statistics_city_name, 10168795  UNION ALL
    SELECT '宁波市'  AS statistics_city_name, 5924531   UNION ALL
    SELECT '广州市'  AS statistics_city_name, 27066092  UNION ALL
    SELECT '上海市'  AS statistics_city_name, 43772571  UNION ALL
    SELECT '北京市'  AS statistics_city_name, 57631485
)

SELECT
    b.statistics_city_name,
    SUM(a.order_actual_payment)      AS actual_turnover,
    t.turnover_target                AS turnover_target
FROM data_warehouse.dwd_sales_order_detail AS a
LEFT JOIN dm_city AS b
    ON a.city_code = b.city_code
LEFT JOIN city_turnover_target AS t
    ON b.statistics_city_name = t.statistics_city_name
WHERE a.off_clock_time >= '2025-01-01'
GROUP BY
    b.statistics_city_name,
    t.turnover_target;