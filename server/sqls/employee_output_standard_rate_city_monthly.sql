-- 按月、城市统计推拿师产值达标率

WITH monthly_city_output_metrics AS (
    -- 第一步：按月、城市汇总推拿师产值达标人数和总推拿师人数
    SELECT
        statistics_city_name,
        month,
        COUNT(DISTINCT job_number)                     AS total_massagists,
        SUM(IF(is_output_value_standard = '是', 1, 0)) AS standard_count
    FROM data_warehouse.dws_indicator_detail_massagist
    WHERE month IS NOT NULL
    GROUP BY
        statistics_city_name,
        month
),

rate_calculation AS (
    -- 第二步：计算月度、城市维度的推拿师产值达标率
    SELECT
        statistics_city_name,
        month,
        total_massagists,
        standard_count,
        ROUND(
            standard_count / NULLIF(total_massagists, 0) * 100,
            2
        ) AS output_standard_rate
    FROM monthly_city_output_metrics
)

-- 第三步：计算同城、同月的同比（2025 vs 2024）
SELECT
    curr.statistics_city_name                           AS statistic_city_name,
    curr.month                                          AS stat_month,
    curr.total_massagists                               AS total_massagists,
    curr.standard_count                                 AS standard_count,
    curr.output_standard_rate                           AS output_standard_rate_pct,
    prev.output_standard_rate                           AS prev_year_output_standard_rate_pct,
    ROUND(
        curr.output_standard_rate - prev.output_standard_rate,
        2
    )                                                   AS yoy_change_pct_point
FROM rate_calculation curr
LEFT JOIN rate_calculation prev
    ON curr.statistics_city_name = prev.statistics_city_name
   AND SUBSTRING(curr.month, 6, 2) = SUBSTRING(prev.month, 6, 2)
   AND CAST(SUBSTRING(curr.month, 1, 4) AS INT)
       = CAST(SUBSTRING(prev.month, 1, 4) AS INT) + 1
WHERE curr.month >= '2025-01'
ORDER BY
    curr.statistics_city_name,
    curr.month;
