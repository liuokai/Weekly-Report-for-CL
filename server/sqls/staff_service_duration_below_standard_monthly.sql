-- 按月统计推拿师服务时长不达标占比

WITH daily_job_stats AS (
    -- 第一步：计算每个技师每天的总服务时长
    SELECT
        YEAR(a.off_clock_time)                 AS stat_year,
        MONTH(a.off_clock_time)                AS stat_month,
        DATE(a.off_clock_time)                 AS order_date,
        a.job_number,
        SUM(a.service_duration)                AS daily_duration
    FROM dwd_sales_order_detail AS a
    WHERE a.off_clock_time IS NOT NULL
      AND a.job_number IS NOT NULL
    GROUP BY
        stat_year,
        stat_month,
        order_date,
        a.job_number
),

monthly_staff_performance AS (
    -- 第二步：计算技师当月个人天均服务时长
    SELECT
        stat_year,
        stat_month,
        job_number,
        SUM(daily_duration) / COUNT(DISTINCT order_date) AS staff_daily_avg
    FROM daily_job_stats
    GROUP BY
        stat_year,
        stat_month,
        job_number
),

monthly_agg AS (
    -- 第三步：按月统计推拿师人数及不达标占比（百分数）
    SELECT
        stat_year,
        stat_month,
        COUNT(DISTINCT job_number)                                      AS total_massagists,
        SUM(CASE WHEN staff_daily_avg < 300 THEN 1 ELSE 0 END)         AS below_standard_massagists,
        ROUND(
            SUM(CASE WHEN staff_daily_avg < 300 THEN 1 ELSE 0 END)
            / NULLIF(COUNT(DISTINCT job_number), 0) * 100,
            2
        )                                                               AS below_standard_ratio
    FROM monthly_staff_performance
    GROUP BY
        stat_year,
        stat_month
),

final_with_yoy AS (
    -- 第四步：关联去年同期，计算同比（百分点）
    SELECT
        cur.stat_year,
        cur.stat_month,
        cur.total_massagists,
        cur.below_standard_massagists,
        cur.below_standard_ratio,
        last.below_standard_ratio                                      AS below_standard_ratio_yoy,
        ROUND(
            cur.below_standard_ratio - last.below_standard_ratio,
            2
        )                                                               AS yoy_change
    FROM monthly_agg cur
    LEFT JOIN monthly_agg last
        ON cur.stat_month = last.stat_month
       AND cur.stat_year  = last.stat_year + 1
)

SELECT
    stat_year,
    stat_month,
    total_massagists,
    below_standard_massagists,
    below_standard_ratio,
    below_standard_ratio_yoy,
    yoy_change
FROM final_with_yoy
WHERE stat_year >= 2025
ORDER BY
    stat_year DESC,
    stat_month DESC;
