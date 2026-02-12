-- 按周、城市维度统计周均营业额（天均），并计算同比

WITH weekly_city_base AS (
    -- 第一步：基础聚合（ISO 年、ISO 周、城市）
    SELECT
        -- ✅ ISO 周一
        STR_TO_DATE(CONCAT(YEARWEEK(a.off_clock_time, 1), ' Monday'), '%x%v %W') AS week_start_date, -- 原字段：week_start

        -- ✅ ISO 年 / ISO 周：统一从 week_start_date 派生
        YEAR(
            STR_TO_DATE(CONCAT(YEARWEEK(a.off_clock_time, 1), ' Monday'), '%x%v %W')
        ) AS s_year,
        WEEK(
            STR_TO_DATE(CONCAT(YEARWEEK(a.off_clock_time, 1), ' Monday'), '%x%v %W'),
            1
        ) AS s_week,

        b.statistics_city_name,
        SUM(a.order_actual_payment) AS total_weekly_revenue, -- 原字段：weekly_revenue
        COUNT(DISTINCT DATE(a.off_clock_time)) AS active_day_count -- 原字段：active_days
    FROM data_warehouse.dwd_sales_order_detail AS a
    LEFT JOIN data_warehouse.dm_city AS b
        ON a.city_code = b.city_code
    WHERE a.off_clock_time IS NOT NULL
      AND a.off_clock_time >= '2024-01-01'
      AND b.statistics_city_name = ?
    GROUP BY
        week_start_date,
        s_year,
        s_week,
        b.statistics_city_name
),

weekly_city_avg AS (
    -- 第二步：计算天均营业额
    SELECT
        *,
        ROUND(total_weekly_revenue / NULLIF(active_day_count, 0), 2) AS daily_avg_revenue
    FROM weekly_city_base
)

-- 第三步：自连接计算同比
SELECT
    curr.statistics_city_name AS city_name, -- 原字段：statistics_city_name
    curr.s_year               AS stat_year, -- 原字段：year
    curr.s_week               AS stat_week, -- 原字段：week
    -- ISO 周日期范围
    CONCAT(
        DATE_FORMAT(curr.week_start_date, '%Y-%m-%d'),
        ' ~ ',
        DATE_FORMAT(DATE_ADD(curr.week_start_date, INTERVAL 6 DAY), '%Y-%m-%d')
    ) AS week_date_range, -- 原字段：date_range
    curr.daily_avg_revenue    AS weekly_daily_avg_revenue, -- 原字段：周天均营业额
    prev.daily_avg_revenue    AS last_year_daily_avg_revenue, -- 原字段：去年同期天均营业额
    ROUND(
        (curr.daily_avg_revenue - prev.daily_avg_revenue)
        / NULLIF(prev.daily_avg_revenue, 0) * 100,
        2
    ) AS daily_avg_yoy_rate -- 原字段：天均同比(%)
FROM weekly_city_avg curr
LEFT JOIN weekly_city_avg prev
    ON curr.s_year = prev.s_year + 1
   AND curr.s_week = prev.s_week
   AND curr.statistics_city_name = prev.statistics_city_name
WHERE curr.s_year >= 2025
ORDER BY
    curr.s_year,
    curr.s_week;
