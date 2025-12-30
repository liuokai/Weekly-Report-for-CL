-- 按城市、周计算周累计营业额（同比）
WITH weekly_city_sales AS (
    -- 第一步：分城市、按周聚合营业额
    SELECT
        b.statistics_city_name,
        YEARWEEK(a.off_clock_time, 1)                                                                      AS year_week_key,
        YEAR(a.off_clock_time)                                                                             AS sales_year,
        WEEK(a.off_clock_time, 1)                                                                          AS sales_week,
        STR_TO_DATE(CONCAT(YEARWEEK(a.off_clock_time, 1), ' Monday'), '%x%v %W')                           AS week_start,
        DATE_ADD(
            STR_TO_DATE(CONCAT(YEARWEEK(a.off_clock_time, 1), ' Monday'), '%x%v %W'),
            INTERVAL 6 DAY
        )                                                                                                  AS week_end,
        SUM(a.order_actual_payment)                                                                        AS weekly_revenue
    FROM data_warehouse.dwd_sales_order_detail a
    LEFT JOIN dm_city b
        ON a.city_code = b.city_code
    WHERE a.off_clock_time IS NOT NULL
      AND a.off_clock_time >= '2025-01-01'
      AND b.statistics_city_name = ?
    GROUP BY
        b.statistics_city_name,
        year_week_key,
        sales_year,
        sales_week,
        week_start,
        week_end
),

cumulative_city_sales AS (
    -- 第二步：按城市 + 年份计算周累计营业额
    SELECT
        *,
        SUM(weekly_revenue) OVER (
            PARTITION BY statistics_city_name, sales_year
            ORDER BY sales_week
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS running_total_revenue
    FROM weekly_city_sales
)

-- 第三步：输出结果
SELECT
    statistics_city_name,
    sales_year                                AS `year`,
    sales_week                                AS `week`,
    CONCAT(
        DATE_FORMAT(week_start, '%Y-%m-%d'),
        ' ~ ',
        DATE_FORMAT(week_end, '%Y-%m-%d')
    )                                         AS `date_range`,
    weekly_revenue                            AS `weekly_revenue`,
    running_total_revenue                     AS `running_total_revenue`
FROM cumulative_city_sales
WHERE sales_year = 2025
ORDER BY
    statistics_city_name,
    sales_year,
    sales_week;
