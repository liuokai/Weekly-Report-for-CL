-- 按周计算累计平均客单价
-- 累计平均客单价 = Σ(第1周 ~ 当前周 营业额) ÷ Σ(第1周 ~ 当前周 订单数)

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
        -- 核心业务指标
        SUM(order_actual_payment)                                                                         AS weekly_revenue,
        COUNT(DISTINCT order_uid)                                                                         AS weekly_order_count
    FROM data_warehouse.dwd_sales_order_detail
    WHERE off_clock_time IS NOT NULL
      AND off_clock_time >= '2024-01-01'
      AND service_duration >= 40
    GROUP BY 1, 2, 3, 4
),
weekly_cumulative_base AS (
    -- 第二步：计算年内累计营业额与累计订单数
    SELECT
        *,
        SUM(weekly_revenue) OVER (
            PARTITION BY sales_year
            ORDER BY sales_week
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        )                                                                                                 AS cumulative_revenue,
        SUM(weekly_order_count) OVER (
            PARTITION BY sales_year
            ORDER BY sales_week
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        )                                                                                                 AS cumulative_order_count
    FROM weekly_metrics
),
weekly_cumulative_aov AS (
    -- 第三步：计算年内累计平均客单价
    SELECT
        *,
        IF(
            cumulative_order_count = 0,
            0,
            ROUND(cumulative_revenue / cumulative_order_count, 2)
        )                                                                                                 AS cumulative_aov
    FROM weekly_cumulative_base
)
-- 第四步：自连接计算“年度累计 AOV”的同比
SELECT
    curr.sales_year                                                                                      AS sales_year,
    curr.sales_week                                                                                      AS sales_week,
    CONCAT(
        DATE_FORMAT(curr.week_start, '%Y-%m-%d'),
        ' ~ ',
        DATE_FORMAT(curr.week_end, '%Y-%m-%d')
    )                                                                                                     AS week_date_range,
    curr.cumulative_aov                                                                                  AS current_year_cumulative_aov,
    prev.cumulative_aov                                                                                  AS last_year_cumulative_aov,
    -- 累计 AOV 同比差值
    ROUND(curr.cumulative_aov - prev.cumulative_aov, 2)                                                  AS cumulative_aov_yoy_diff,
    -- 累计 AOV 同比增幅
    IF(
        prev.cumulative_aov IS NULL OR prev.cumulative_aov = 0,
        NULL,
        ROUND(
            (curr.cumulative_aov - prev.cumulative_aov)
            / prev.cumulative_aov * 100,
            2
        )
    )                                                                                                     AS cumulative_aov_yoy_pct
FROM weekly_cumulative_aov curr
LEFT JOIN weekly_cumulative_aov prev
       ON curr.sales_year = prev.sales_year + 1
      AND curr.sales_week = prev.sales_week
WHERE curr.sales_year >= 2025
ORDER BY curr.year_week_key DESC;
