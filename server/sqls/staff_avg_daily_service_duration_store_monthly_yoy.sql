-- 按月份、城市、门店维度统计天均服务时长

WITH daily_store_stats AS (
    -- 第一步：按 日期 + 城市 + 门店 聚合
    SELECT
        YEAR(a.off_clock_time)                 AS s_year,
        MONTH(a.off_clock_time)                AS s_month,
        DATE_FORMAT(a.off_clock_time, '%Y-%m') AS month_str,
        DATE(a.off_clock_time)                 AS order_date,
        b.statistics_city_name,
        a.store_code,
        a.store_name,
        SUM(a.service_duration)                AS daily_total_duration,
        COUNT(DISTINCT a.job_number)            AS daily_active_staff_count
    FROM dwd_sales_order_detail a
    LEFT JOIN dm_city b
        ON a.city_code = b.city_code
    WHERE a.off_clock_time IS NOT NULL
      and a.off_clock_time >= '2024-01-01'
      AND a.job_number IS NOT NULL
     AND b.statistics_city_name IS NOT NULL
      AND a.store_code IS NOT NULL
     -- and store_code = '102190'
    GROUP BY
        1, 2, 3, 4, 5, 6, 7
),

monthly_store_base AS (
    -- 第二步：按 月份 + 城市 + 门店 汇总
    SELECT
        s_year,
        s_month,
        month_str,
        statistics_city_name,
        store_code,
        store_name,
        SUM(daily_total_duration)     AS monthly_total_duration,
        SUM(daily_active_staff_count) AS monthly_staff_day_count,
        SUM(daily_total_duration) / SUM(daily_active_staff_count)
                                      AS avg_staff_daily_duration
    FROM daily_store_stats
    GROUP BY
        1, 2, 3, 4, 5, 6
)

-- 第三步：最终展示（同城 + 同店 + 同月同比）
SELECT
    curr.month_str            AS month,
    curr.statistics_city_name AS statistics_city_name,
    curr.store_code           AS store_code,
    curr.store_name           AS store_name,
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
FROM monthly_store_base curr
LEFT JOIN monthly_store_base prev
    ON curr.statistics_city_name = prev.statistics_city_name
   AND curr.store_code           = prev.store_code
   AND curr.s_year               = prev.s_year + 1
   AND curr.s_month              = prev.s_month
WHERE curr.s_year >= 2025
ORDER BY
    curr.month_str DESC,
    curr.statistics_city_name,
    curr.store_code;
