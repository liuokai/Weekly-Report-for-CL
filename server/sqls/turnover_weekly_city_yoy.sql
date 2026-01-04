-- 按城市、周维度统计营业额

WITH weekly_city_sales AS (
    SELECT
        b.statistics_city_name,
        YEARWEEK(a.off_clock_time, 1)                                                                      AS year_week_key,
        YEAR(a.off_clock_time)                                                                             AS sales_year,
        WEEK(a.off_clock_time, 1)                                                                          AS sales_week,
        -- 周一
        STR_TO_DATE(CONCAT(YEARWEEK(a.off_clock_time, 1), ' Monday'), '%x%v %W')                           AS week_start,
        -- 周日
        DATE_ADD(
            STR_TO_DATE(CONCAT(YEARWEEK(a.off_clock_time, 1), ' Monday'), '%x%v %W'),
            INTERVAL 6 DAY
        )                                                                                                  AS week_end,
        SUM(a.order_actual_payment)                                                                        AS weekly_revenue
    FROM data_warehouse.dwd_sales_order_detail AS a
    LEFT JOIN dm_city AS b
        ON a.city_code = b.city_code
    WHERE a.off_clock_time IS NOT NULL
      AND a.off_clock_time >= '2024-01-01'
    GROUP BY
        b.statistics_city_name,
        year_week_key,
        sales_year,
        sales_week,
        week_start,
        week_end
)

SELECT
    curr.statistics_city_name,
    curr.sales_year                                                                                 AS `year`,
    curr.sales_week                                                                                 AS `week`,
    CONCAT(
        DATE_FORMAT(curr.week_start, '%Y-%m-%d'),
        ' ~ ',
        DATE_FORMAT(curr.week_end, '%Y-%m-%d')
    )                                                                                                AS `date_range`,
    curr.weekly_revenue                                                                             AS `current_value`,
    prev.weekly_revenue                                                                             AS `last_year_value`,
    IF(
        prev.weekly_revenue IS NULL OR prev.weekly_revenue = 0,
        NULL,
        ROUND(
            (curr.weekly_revenue - prev.weekly_revenue) / prev.weekly_revenue * 100,
            2
        )
    )                                                                                                AS `yoy_change`
FROM weekly_city_sales curr
LEFT JOIN weekly_city_sales prev
    ON curr.statistics_city_name = prev.statistics_city_name
   AND curr.sales_year = prev.sales_year + 1
   AND curr.sales_week = prev.sales_week
WHERE curr.sales_year >= 2025
  AND curr.statistics_city_name = ?
ORDER BY
    curr.statistics_city_name,
    curr.statistics_city_name,
    curr.sales_week DESC;
