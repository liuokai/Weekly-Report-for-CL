-- 周维度的项目回头率统计（按城市）

WITH weekly_city_metrics AS (
    -- 第一步：关联城市表，并严格按年、周、统计城市名称维度进行汇总
    SELECT
        YEAR(t1.off_clock_time)                                 AS s_year,
        WEEK(t1.off_clock_time, 1)                              AS s_week,
        MIN(DATE(t1.off_clock_time))                            AS week_start_date,
        MAX(DATE(t1.off_clock_time))                            AS week_end_date,
        t2.statistics_city_name,
        COUNT(DISTINCT t1.order_uid)                            AS total_orders,
        SUM(IF(t1.is_project_repurchase_customer = '是', 1, 0)) AS repurchase_orders
    FROM dwd_sales_order_detail t1
    LEFT JOIN dm_city t2 ON t1.city_code = t2.city_code  -- city_code 仅在此处用于关联
    WHERE t1.off_clock_time IS NOT NULL
      AND t1.off_clock_time >= '2024-01-01'
    GROUP BY 1, 2, 3                                     -- 仅按时间维度和统计城市名聚合
),
rate_calculation AS (
    -- 第二步：计算回头率
    SELECT
        *,
        ROUND(repurchase_orders / NULLIF(total_orders, 0) * 100, 2) AS repurchase_rate
    FROM weekly_city_metrics
)
-- 第三步：自连接计算去年同城市、同周的同比
SELECT
    curr.s_year,
    curr.s_week,
    CONCAT(DATE_FORMAT(curr.week_start_date, '%Y/%m/%d'), ' ~ ', DATE_FORMAT(curr.week_end_date, '%Y/%m/%d')) AS week_date_range,
    curr.statistics_city_name                               AS city_name,
    curr.total_orders,
    curr.repurchase_orders,
    curr.repurchase_rate,
    prev.repurchase_rate                                    AS prev_year_rate,
    -- 计算同比增减百分点
    ROUND(curr.repurchase_rate - prev.repurchase_rate, 2)    AS yoy_change_pct
FROM rate_calculation curr
LEFT JOIN rate_calculation prev
    ON curr.s_year = prev.s_year + 1
    AND curr.s_week = prev.s_week
    AND curr.statistics_city_name = prev.statistics_city_name -- 使用统计城市名称进行同比匹配
ORDER BY curr.s_year DESC, curr.s_week DESC, curr.statistics_city_name ASC;