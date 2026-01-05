-- 周维度的项目回头率统计

WITH weekly_metrics AS (
    -- 第一步：按年、周维度汇总数据
    SELECT 
        YEAR(STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W'))    AS s_year,
        WEEK(STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W'), 1) AS s_week,
        COUNT(DISTINCT order_uid)                            AS total_orders,
        SUM(IF(is_project_repurchase_customer = '是', 1, 0)) AS repurchase_orders
    FROM dwd_sales_order_detail
    WHERE off_clock_time IS NOT NULL 
      AND off_clock_time >= '2024-01-01'
    GROUP BY 1, 2
),
rate_calculation AS (
    -- 第二步：计算回头率
    SELECT 
        *,
        ROUND(repurchase_orders / NULLIF(total_orders, 0) * 100, 2) AS repurchase_rate
    FROM weekly_metrics
)
-- 第三步：自连接计算去年同周的同比
SELECT 
    curr.s_year,
    curr.s_week,
    curr.total_orders,
    curr.repurchase_orders,
    curr.repurchase_rate,
    prev.repurchase_rate                                  AS prev_year_rate,
    -- 计算同比增减百分点
    ROUND(curr.repurchase_rate - prev.repurchase_rate, 2) AS yoy_change_pct
FROM rate_calculation curr
LEFT JOIN rate_calculation prev 
    ON curr.s_year = prev.s_year + 1 
    AND curr.s_week = prev.s_week
ORDER BY curr.s_year DESC, curr.s_week DESC;
