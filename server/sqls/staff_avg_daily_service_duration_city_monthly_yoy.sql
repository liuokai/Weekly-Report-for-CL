-- 按月份、城市维度统计天均服务时长

WITH daily_city_stats AS (
    -- 第一步：按 日期 + 城市 聚合，计算城市当日总服务时长 & 当日推拿师数
    SELECT
        YEAR(a.off_clock_time)                 AS s_year,
        MONTH(a.off_clock_time)                AS s_month,
        DATE_FORMAT(a.off_clock_time, '%Y-%m') AS month_str,
        DATE(a.off_clock_time)                 AS order_date,
        b.statistics_city_name,
        SUM(a.service_duration)                AS daily_total_duration,
        COUNT(DISTINCT a.job_number)            AS daily_active_staff_count
    FROM dwd_sales_order_detail a
    LEFT JOIN dm_city b
        ON a.city_code = b.city_code
    WHERE a.off_clock_time IS NOT NULL
      AND a.job_number IS NOT NULL
      AND b.statistics_city_name IS NOT NULL
    GROUP BY
        1, 2, 3, 4, 5
),

monthly_city_base AS (
    -- 第二步：按 月份 + 城市 汇总总服务时长 & 总人日
    SELECT
        s_year,
        s_month,
        month_str,
        statistics_city_name,
        SUM(daily_total_duration)     AS monthly_total_duration,
        SUM(daily_active_staff_count) AS monthly_staff_day_count,
        SUM(daily_total_duration) / SUM(daily_active_staff_count)
                                      AS avg_staff_daily_duration
    FROM daily_city_stats
    GROUP BY
        1, 2, 3, 4
)

-- 第三步：最终展示（统一保留两位小数）
SELECT
    curr.month_str            AS month,
    curr.statistics_city_name AS statistics_city_name,
    ROUND(curr.avg_staff_daily_duration, 2)
                               AS avg_staff_daily_duration,
    ROUND(prev.avg_staff_daily_duration, 2)
                               AS avg_staff_daily_duration_yoy,
    IF(
        prev.avg_staff_daily_duration IS NULL
        OR prev.avg_staff_daily_duration = 0,
        NULL,
        ROUND(
            (curr.avg_staff_daily_duration - prev.avg_staff_daily_duration)
            / prev.avg_staff_daily_duration * 100,
            2
        )
    )                          AS yoy_growth_rate_pct
FROM monthly_city_base curr
LEFT JOIN monthly_city_base prev
    ON curr.statistics_city_name = prev.statistics_city_name
   AND curr.s_year  = prev.s_year + 1
   AND curr.s_month = prev.s_month
WHERE curr.s_year >= 2025
ORDER BY
    curr.month_str DESC,
    curr.statistics_city_name;
