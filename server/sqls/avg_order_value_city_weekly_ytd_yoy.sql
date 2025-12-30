-- 按城市、周维度统计累计平均客单价

WITH city_weekly_stats AS (
    -- 第一步：按城市和周汇总基础指标
    SELECT
        b.statistics_city_name                                                                AS city_name,
        YEARWEEK(off_clock_time, 1)                                                          AS year_week_key,
        YEAR(off_clock_time)                                                                 AS sales_year,
        WEEK(off_clock_time, 1)                                                              AS sales_week,
        -- 计算该周的日期范围
        STR_TO_DATE(
            CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'),
            '%x%v %W'
        )                                                                                    AS week_start,
        DATE_ADD(
            STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W'),
            INTERVAL 6 DAY
        )                                                                                    AS week_end,
        -- 核心业务指标
        SUM(a.order_actual_payment)                                                          AS weekly_revenue,
        COUNT(DISTINCT a.order_uid)                                                          AS weekly_order_count
    FROM dwd_sales_order_detail AS a
    LEFT JOIN dm_city AS b
           ON a.city_code = b.city_code
    WHERE off_clock_time IS NOT NULL
      and date(off_clock_time) >= '2023-01-01'
      AND service_duration >= 40
    GROUP BY
        b.statistics_city_name,
        year_week_key,
        sales_year,
        sales_week,
        week_start
),
city_weekly_cumulative_base AS (
    -- 第二步：按城市 + 年度维度计算周度累计值
    SELECT
        *,
        SUM(weekly_revenue) OVER (
            PARTITION BY city_name, sales_year
            ORDER BY sales_week
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        )                                                                                    AS cumulative_revenue,
        SUM(weekly_order_count) OVER (
            PARTITION BY city_name, sales_year
            ORDER BY sales_week
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        )                                                                                    AS cumulative_order_count
    FROM city_weekly_stats
),
city_weekly_cumulative_aov AS (
    -- 第三步：计算年内累计平均客单价（AOV）
    SELECT
        *,
        IF(
            cumulative_order_count = 0,
            0,
            ROUND(cumulative_revenue / cumulative_order_count, 2)
        )                                                                                    AS cumulative_aov
    FROM city_weekly_cumulative_base
)
-- 第四步：自连接匹配去年同期周，计算累计同比
SELECT
    curr.city_name                                                                           AS city_name,
    curr.sales_year                                                                          AS sales_year,
    curr.sales_week                                                                          AS sales_week,
    CONCAT(
        DATE_FORMAT(curr.week_start, '%Y-%m-%d'),
        ' ~ ',
        DATE_FORMAT(curr.week_end, '%Y-%m-%d')
    )                                                                                        AS week_date_range,
    curr.cumulative_aov                                                                     AS current_year_cumulative_aov,
    prev.cumulative_aov                                                                     AS last_year_cumulative_aov,
    -- 累计 AOV 同比差值
    ROUND(curr.cumulative_aov - prev.cumulative_aov, 2)                                     AS cumulative_aov_yoy_diff,
    -- 累计 AOV 同比增幅
    IF(
        prev.cumulative_aov IS NULL OR prev.cumulative_aov = 0,
        NULL,
        ROUND(
            (curr.cumulative_aov - prev.cumulative_aov)
            / prev.cumulative_aov * 100,
            2
        )
    )                                                                                        AS cumulative_aov_yoy_pct
FROM city_weekly_cumulative_aov curr
LEFT JOIN city_weekly_cumulative_aov prev
       ON curr.city_name  = prev.city_name
      AND curr.sales_year = prev.sales_year + 1
      AND curr.sales_week = prev.sales_week
WHERE curr.sales_year >= (SELECT MAX(sales_year) - 1 FROM city_weekly_cumulative_aov)
ORDER BY
    curr.sales_year DESC,
    curr.sales_week DESC,
    curr.cumulative_aov DESC;
