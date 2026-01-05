-- 按周计算平均客单价

WITH weekly_metrics AS (
    -- 第一步：按周聚合基础指标
    SELECT
        YEARWEEK(off_clock_time, 1)                                                                      AS year_week_key,
        YEAR(STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W'))                    AS sales_year,
        WEEK(STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W'), 1)                 AS sales_week,
        -- 计算该周的日期范围
        STR_TO_DATE(
            CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'),
            '%x%v %W'
        )                                                                                                 AS week_start,
        DATE_ADD(
            STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W'),
            INTERVAL 6 DAY
        )                                                                                                 AS week_end,
        -- 核心业务指标（此处 COUNT(order_no) 建议替换为 SUM(实付金额字段)）
        SUM(order_actual_payment)                                                                         AS weekly_revenue,
        COUNT(DISTINCT order_uid)                                                                         AS weekly_order_count
    FROM data_warehouse.dwd_sales_order_detail
    WHERE off_clock_time IS NOT NULL
      AND off_clock_time >= '2024-01-01' -- Optimization: Limit to recent 2 years
      AND service_duration >= 40
    GROUP BY 1, 2, 3, 4
),
weekly_aov_base AS (
    -- 第二步：计算平均客单价（AOV）
    SELECT
        *,
        IF(weekly_order_count = 0, 0,
           ROUND(weekly_revenue / weekly_order_count, 2)
        )                                                                                                 AS aov
    FROM weekly_metrics
)
-- 第三步：自连接匹配去年同周数据，计算同比
SELECT
    curr.sales_year                                                                                      AS sales_year,
    curr.sales_week                                                                                      AS sales_week,
    CONCAT(
        DATE_FORMAT(curr.week_start, '%Y-%m-%d'),
        ' ~ ',
        DATE_FORMAT(curr.week_end, '%Y-%m-%d')
    )                                                                                                     AS week_date_range,
    curr.aov                                                                                             AS current_week_aov,
    prev.aov                                                                                             AS last_year_week_aov,
    -- 计算同比差异额
    ROUND(curr.aov - prev.aov, 2)                                                                        AS aov_yoy_diff,
    -- 计算同比增幅
    IF(
        prev.aov IS NULL OR prev.aov = 0,
        NULL,
        ROUND((curr.aov - prev.aov) / prev.aov * 100, 2)
    )                                                                                                     AS aov_yoy_pct
FROM weekly_aov_base curr
LEFT JOIN weekly_aov_base prev
       ON curr.sales_year = prev.sales_year + 1
      AND curr.sales_week = prev.sales_week
WHERE curr.sales_year >= 2025
ORDER BY curr.year_week_key DESC;
