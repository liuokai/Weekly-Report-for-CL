-- 年度平均客单价

WITH annual_stats AS (
    -- 第一步：计算每年基础指标
    SELECT YEAR(off_clock_time)                                            AS s_year,
           COUNT(DISTINCT order_uid)                                       AS total_orders,
           SUM(order_actual_payment)                                       AS total_revenue,
           -- 年度平均客单价
           ROUND(SUM(order_actual_payment) / COUNT(DISTINCT order_uid), 2) AS avg_order_value
    FROM data_warehouse.dwd_sales_order_detail
    WHERE off_clock_time IS NOT NULL
      AND off_clock_time >= '2023-01-01'
      AND service_duration >= 40
    GROUP BY 1
)
-- 第二步：自连接计算同比
SELECT
    curr.s_year               AS sales_year,
    curr.total_orders         AS annual_total_orders,
    curr.avg_order_value      AS annual_avg_order_value,
    prev.avg_order_value      AS last_year_avg_order_value,
    -- 计算同比增长率 (%)
    CASE
        WHEN prev.avg_order_value IS NULL OR prev.avg_order_value = 0 THEN NULL
        ELSE ROUND(
            (curr.avg_order_value - prev.avg_order_value)
            / prev.avg_order_value * 100, 2
        )
    END                        AS avg_order_value_yoy_pct
FROM annual_stats curr
LEFT JOIN annual_stats prev
       ON curr.s_year = prev.s_year + 1
ORDER BY sales_year DESC;
