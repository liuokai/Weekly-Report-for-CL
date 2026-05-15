-- 按城市、年度维度统计平均客单价
WITH base_2025_data AS (
    -- 第一步：手动注入图中 2025 年的固定客单价数据
    SELECT '四川省' as city_name, 153.90 as aov UNION ALL
    SELECT '重庆市', 154.75 UNION ALL
    SELECT '深圳市', 192.21 UNION ALL
    SELECT '杭州市', 180.93 UNION ALL
    SELECT '南京市', 176.49 UNION ALL
    SELECT '宁波市', 163.41 UNION ALL
    SELECT '广州市', 182.30 UNION ALL
    SELECT '上海市', 207.12 UNION ALL
    SELECT '北京市', 198.01
),
city_annual_stats AS (
    -- 第二步：计算 2026 年及以后的实际业务数据
    SELECT
        b.statistics_city_name,
        YEAR(off_clock_time)      AS s_year,
        SUM(order_actual_payment) AS total_revenue,
        COUNT(if(service_duration >= 40, order_uid, null)) AS total_orders
    FROM dwd_sales_order_detail AS a
    LEFT JOIN dm_city AS b
           ON a.city_code = b.city_code
    WHERE off_clock_time IS NOT NULL
      AND off_clock_time >= '2026-01-01' -- 只取 2026 年以后的数据
      AND (order_type in ('01', '03') or project_name = '修脚')
    GROUP BY b.statistics_city_name, s_year
),
city_actual_aov AS (
    -- 第三步：计算当前年度客单价
    SELECT
        statistics_city_name,
        s_year,
        IF(total_orders = 0, 0, ROUND(total_revenue / total_orders, 2)) AS current_year_aov
    FROM city_annual_stats
)
-- 第四步：关联 2025 基准值，计算同比
SELECT
    curr.statistics_city_name AS city_name,
    curr.s_year               AS sales_year,
    curr.current_year_aov     AS current_year_aov,
    -- 如果是 2026 年，去年数据取图片中的固定值；否则取表内自连接（针对未来 2027 年等）
    CASE
        WHEN curr.s_year = 2026 THEN b25.aov
        ELSE prev.current_year_aov
    END AS last_year_aov,
    -- 计算同比
    ROUND(
        (curr.current_year_aov -
         CASE WHEN curr.s_year = 2026 THEN b25.aov ELSE prev.current_year_aov END
        ) /
        CASE WHEN curr.s_year = 2026 THEN b25.aov ELSE prev.current_year_aov END
        * 100, 2
    ) AS aov_yoy_pct
FROM city_actual_aov curr
LEFT JOIN base_2025_data b25
       ON curr.statistics_city_name = b25.city_name
LEFT JOIN city_actual_aov prev
       ON curr.statistics_city_name = prev.statistics_city_name
      AND curr.s_year = prev.s_year + 1
ORDER BY curr.s_year DESC, curr.current_year_aov DESC;