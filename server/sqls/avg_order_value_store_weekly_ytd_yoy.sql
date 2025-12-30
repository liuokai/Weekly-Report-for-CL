-- 按门店维度统计最近一周累计平均客单价（仅保留每个城市、门店最新一周）

WITH store_weekly_stats AS (
    SELECT
        a.store_code AS store_code,
        a.store_name AS store_name,
        b.statistics_city_name AS city_name,
        YEARWEEK(a.off_clock_time, 1) AS year_week_key,
        YEAR(a.off_clock_time) AS sales_year,
        WEEK(a.off_clock_time, 1) AS sales_week,
        STR_TO_DATE(CONCAT(YEARWEEK(a.off_clock_time, 1), ' Monday'), '%x%v %W') AS week_start,
        DATE_ADD(STR_TO_DATE(CONCAT(YEARWEEK(a.off_clock_time, 1), ' Monday'), '%x%v %W'), INTERVAL 6 DAY) AS week_end,
        SUM(a.order_actual_payment) AS weekly_revenue,
        COUNT(DISTINCT a.order_uid) AS weekly_order_count
    FROM dwd_sales_order_detail AS a
    LEFT JOIN dm_city AS b
           ON a.city_code = b.city_code
    WHERE a.off_clock_time IS NOT NULL
      AND a.off_clock_time >= '2024-01-01'
      AND a.service_duration >= 40
    GROUP BY
        a.store_code,
        a.store_name,
        b.statistics_city_name,
        year_week_key,
        sales_year,
        sales_week,
        week_start
),
store_weekly_cumulative_base AS (
    SELECT
        *,
        SUM(weekly_revenue) OVER (
            PARTITION BY store_code, sales_year
            ORDER BY sales_week
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS cumulative_revenue,
        SUM(weekly_order_count) OVER (
            PARTITION BY store_code, sales_year
            ORDER BY sales_week
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS cumulative_order_count
    FROM store_weekly_stats
),
store_weekly_cumulative_aov AS (
    SELECT
        *,
        IF(cumulative_order_count = 0, 0, ROUND(cumulative_revenue / cumulative_order_count, 2)) AS cumulative_aov
    FROM store_weekly_cumulative_base
)
SELECT
    curr.city_name AS city_name,
    curr.store_code AS store_code,
    curr.store_name AS store_name,
    curr.sales_year AS sales_year,
    curr.sales_week AS sales_week,
    CONCAT(DATE_FORMAT(curr.week_start, '%Y-%m-%d'), ' ~ ', DATE_FORMAT(curr.week_end, '%Y-%m-%d')) AS week_date_range,
    curr.cumulative_aov AS current_year_cumulative_aov,
    prev.cumulative_aov AS last_year_cumulative_aov,
    ROUND(curr.cumulative_aov - prev.cumulative_aov, 2) AS cumulative_aov_yoy_diff,
    IF(prev.cumulative_aov IS NULL OR prev.cumulative_aov = 0,
       NULL,
       ROUND((curr.cumulative_aov - prev.cumulative_aov) / prev.cumulative_aov * 100, 2)
    ) AS cumulative_aov_yoy_pct
FROM store_weekly_cumulative_aov curr
LEFT JOIN store_weekly_cumulative_aov prev
       ON curr.store_code = prev.store_code
      AND curr.sales_year = prev.sales_year + 1
      AND curr.sales_week = prev.sales_week
WHERE curr.sales_year >= (SELECT MAX(sales_year) - 1 FROM store_weekly_cumulative_aov)
ORDER BY
    curr.city_name,
    curr.store_code,
    curr.sales_year DESC,
    curr.sales_week DESC;
