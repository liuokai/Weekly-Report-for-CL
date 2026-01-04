-- 按月、城市、门店维度统计推拿师服务时长不达标占比

WITH daily_job_city_store_stats AS (
    -- 第一步：计算每个技师每天在门店维度的总服务时长
    SELECT
        b.statistics_city_name                  AS city_name,
        a.store_code,
        a.store_name,
        YEAR(a.off_clock_time)                 AS stat_year,
        MONTH(a.off_clock_time)                AS stat_month,
        DATE(a.off_clock_time)                 AS order_date,
        a.job_number,
        SUM(a.service_duration)                AS daily_duration
    FROM dwd_sales_order_detail AS a
    LEFT JOIN data_warehouse.dm_city AS b
        ON a.city_code = b.city_code
    WHERE a.off_clock_time IS NOT NULL
      AND a.job_number IS NOT NULL
    GROUP BY
        city_name,
        a.store_code,
        a.store_name,
        stat_year,
        stat_month,
        order_date,
        a.job_number
),

monthly_staff_performance AS (
    -- 第二步：计算技师在门店 × 月维度的个人天均服务时长
    SELECT
        city_name,
        store_code,
        store_name,
        stat_year,
        stat_month,
        job_number,
        SUM(daily_duration) / COUNT(DISTINCT order_date) AS staff_daily_avg
    FROM daily_job_city_store_stats
    GROUP BY
        city_name,
        store_code,
        store_name,
        stat_year,
        stat_month,
        job_number
),

city_store_monthly_agg AS (
    -- 第三步：城市 × 门店 × 月维度统计人数及不达标占比（百分数）
    SELECT
        city_name,
        store_code,
        store_name,
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
        city_name,
        store_code,
        store_name,
        stat_year,
        stat_month
),

final_with_yoy AS (
    -- 第四步：关联去年同期（同城市 + 同门店 + 同月份）
    SELECT
        cur.city_name,
        cur.store_code,
        cur.store_name,
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
    FROM city_store_monthly_agg cur
    LEFT JOIN city_store_monthly_agg last
        ON cur.city_name  = last.city_name
       AND cur.store_code = last.store_code
       AND cur.stat_month = last.stat_month
       AND cur.stat_year  = last.stat_year + 1
)

SELECT
    stat_year,
    stat_month,
    city_name,
    store_code,
    store_name,
    total_massagists,
    below_standard_massagists,
    below_standard_ratio,
    below_standard_ratio_yoy,
    yoy_change
FROM final_with_yoy
WHERE stat_year >= 2025
ORDER BY
    stat_year DESC,
    stat_month DESC,
    city_name,
    store_code;