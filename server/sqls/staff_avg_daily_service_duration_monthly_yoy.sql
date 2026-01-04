-- 按月统计推拿师天均服务时长

WITH daily_job_stats AS (
    -- 第一步：按 员工+日期 聚合，计算每个技师每天的总时长
    SELECT YEAR(off_clock_time)                 AS s_year,
           MONTH(off_clock_time)                AS s_month,
           DATE_FORMAT(off_clock_time, '%Y-%m') AS month_str,
           DATE(off_clock_time)                 AS order_date,
           job_number,
           SUM(service_duration)                AS daily_duration
    FROM dwd_sales_order_detail
    WHERE off_clock_time IS NOT NULL
      AND job_number IS NOT NULL
    GROUP BY 1, 2, 3, 4, 5
),
monthly_job_avg AS (
    -- 第二步：按 员工+月份 聚合，计算该员工在该月的天均时长
    SELECT s_year,
           s_month,
           month_str,
           job_number,
           SUM(daily_duration)                              AS monthly_job_total_duration,
           COUNT(DISTINCT order_date)                       AS job_active_days,
           SUM(daily_duration) / COUNT(DISTINCT order_date) AS job_daily_avg
    FROM daily_job_stats
    GROUP BY 1, 2, 3, 4
),
final_monthly_metrics AS (
    -- 第三步：汇总全公司/全店维度的“每员工天均时长”
    SELECT s_year,
           s_month,
           month_str,
           ROUND(AVG(job_daily_avg), 2) AS avg_staff_daily_duration,
           COUNT(DISTINCT job_number)   AS active_staff_count
    FROM monthly_job_avg
    GROUP BY 1, 2, 3
)
-- 第四步：计算同比
SELECT
    curr.month_str                  AS month,
    curr.active_staff_count         AS active_staff_count,
    curr.avg_staff_daily_duration   AS avg_staff_daily_duration,
    prev.avg_staff_daily_duration   AS avg_staff_daily_duration_yoy,
    IF(
        prev.avg_staff_daily_duration IS NULL
        OR prev.avg_staff_daily_duration = 0,
        NULL,
        ROUND(
            (curr.avg_staff_daily_duration - prev.avg_staff_daily_duration)
            / prev.avg_staff_daily_duration * 100,
            2
        )
    )                                AS yoy_growth_rate_pct
FROM final_monthly_metrics curr
LEFT JOIN final_monthly_metrics prev
    ON curr.s_year  = prev.s_year + 1
   AND curr.s_month = prev.s_month
WHERE curr.s_year >= 2025
ORDER BY curr.month_str DESC;