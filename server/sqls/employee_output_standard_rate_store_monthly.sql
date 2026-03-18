-- 按月份、城市、门店维度统计推拿师产值达标率

WITH monthly_city_store_output_metrics AS (
    -- 第一步：按月、城市、门店汇总新员工产值达标人数和总人数

    SELECT b.statistics_city_name                            as statistics_city_name,
           a.month,
           a.store_code,
           a.store_name,
           sum(massager_on_duty_count_no_include_this_month) AS total_massagists,
           SUM(daily_output_value_qualify_num)                     AS standard_count
    FROM data_warehouse.dws_indicator_detail_store_monthly a
             left join data_warehouse.dm_city b on a.city_code = b.city_code
    WHERE month IS NOT NULL
     and store_code is not null
    and month <= date_format(now(), '%Y-%m')
    GROUP BY b.statistics_city_name,
             a.store_code,
             a.store_name, month),

rate_calculation AS (
    -- 第二步：计算月度、城市、门店维度的新员工产值达标率
    SELECT
        statistics_city_name,
        store_code,
        store_name,
        month,
        total_massagists,
        standard_count,
        ROUND(
            standard_count / NULLIF(total_massagists, 0) * 100,
            2
        ) AS output_standard_rate
    FROM monthly_city_store_output_metrics
)

-- 第三步：计算同城、同店、同月的同比（2025 vs 2024）
SELECT
    curr.statistics_city_name                           AS statistics_city_name,
    curr.store_code                                     AS store_code,
    curr.store_name                                     AS store_name,
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
   AND curr.store_code = prev.store_code
   AND SUBSTRING(curr.month, 6, 2) = SUBSTRING(prev.month, 6, 2)
   AND CAST(SUBSTRING(curr.month, 1, 4) AS INT)
       = CAST(SUBSTRING(prev.month, 1, 4) AS INT) + 1
WHERE curr.month >= '2025-01'
ORDER BY
    curr.statistics_city_name,
    curr.store_code,
    curr.month;
