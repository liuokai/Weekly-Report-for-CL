-- 按门店维度统计最近一周累计平均客单价（去年同期日期精准匹配）
WITH store_weekly_stats AS (
    -- 【完全保留你的原始SQL】按门店和周汇总【今年】的基础指标
    SELECT
        a.store_code AS store_code,
        a.store_name AS store_name,
        b.statistics_city_name AS city_name,
        YEARWEEK(a.off_clock_time, 1) AS year_week_key,
        YEAR(STR_TO_DATE(CONCAT(YEARWEEK(a.off_clock_time, 1), ' Monday'), '%x%v %W')) AS sales_year,
        WEEK(STR_TO_DATE(CONCAT(YEARWEEK(a.off_clock_time, 1), ' Monday'), '%x%v %W'), 1) AS sales_week,
        STR_TO_DATE(CONCAT(YEARWEEK(a.off_clock_time, 1), ' Monday'), '%x%v %W') AS week_start,
        DATE_ADD(STR_TO_DATE(CONCAT(YEARWEEK(a.off_clock_time, 1), ' Monday'), '%x%v %W'), INTERVAL 6 DAY) AS week_end,
        SUM(a.order_actual_payment) AS weekly_revenue,
        COUNT(if(service_duration >= 40, order_uid, null))   AS weekly_order_count
    FROM dwd_sales_order_detail AS a
    LEFT JOIN dm_city AS b
           ON a.city_code = b.city_code
    WHERE a.off_clock_time IS NOT NULL
      AND a.off_clock_time >= '2024-01-01'
      AND (order_type in ('01', '03') or project_name = '修脚')
    GROUP BY
        a.store_code,
        a.store_name,
        b.statistics_city_name,
        year_week_key,
        sales_year,
        sales_week,
        week_start,
        week_end
),
ly_store_weekly_stats AS (
    -- 【新增】按门店和周汇总【去年】的基础指标，并打上“对应今年的周”标签
    SELECT
        a.store_code AS store_code,
        a.store_name AS store_name,
        b.statistics_city_name AS city_name,
        -- 核心逻辑：把去年的日期加1年，映射成今年的周起始/结束，用于关联
        STR_TO_DATE(CONCAT(YEARWEEK(DATE_ADD(a.off_clock_time, INTERVAL 1 YEAR), 1), ' Monday'), '%x%v %W') AS mapped_curr_week_start,
        DATE_ADD(STR_TO_DATE(CONCAT(YEARWEEK(DATE_ADD(a.off_clock_time, INTERVAL 1 YEAR), 1), ' Monday'), '%x%v %W'), INTERVAL 6 DAY) AS mapped_curr_week_end,
        SUM(a.order_actual_payment) AS ly_weekly_revenue,
        COUNT(if(service_duration >= 40, order_uid, null))   AS ly_weekly_order_count
    FROM dwd_sales_order_detail AS a
    LEFT JOIN dm_city AS b
           ON a.city_code = b.city_code
    WHERE a.off_clock_time IS NOT NULL
      AND a.off_clock_time >= '2024-01-01'
      AND (order_type in ('01', '03') or project_name = '修脚')
    GROUP BY
        a.store_code,
        a.store_name,
        b.statistics_city_name,
        mapped_curr_week_start,
        mapped_curr_week_end
),
-- 【分别计算今年和去年的累计值】
curr_cumulative AS (
    SELECT
        *,
        SUM(weekly_revenue) OVER (
            PARTITION BY store_code, sales_year
            ORDER BY sales_week
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS cumulative_revenue,
        SUM(weekly_order_count) OVER (
            PARTITION BY store_code, sales_year
            ORDER BY sales_week
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS cumulative_order_count,
        IF(
            SUM(weekly_order_count) OVER (
                PARTITION BY store_code, sales_year
                ORDER BY sales_week
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) = 0,
            0,
            ROUND(
                SUM(weekly_revenue) OVER (
                    PARTITION BY store_code, sales_year
                    ORDER BY sales_week
                    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                ) / SUM(weekly_order_count) OVER (
                    PARTITION BY store_code, sales_year
                    ORDER BY sales_week
                    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                ),
                2
            )
        ) AS cumulative_aov
    FROM store_weekly_stats
),
ly_cumulative AS (
    SELECT
        *,
        SUM(ly_weekly_revenue) OVER (
            PARTITION BY store_code, YEAR(DATE_SUB(mapped_curr_week_start, INTERVAL 1 YEAR))
            ORDER BY WEEK(DATE_SUB(mapped_curr_week_start, INTERVAL 1 YEAR), 1)
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS ly_cumulative_revenue,
        SUM(ly_weekly_order_count) OVER (
            PARTITION BY store_code, YEAR(DATE_SUB(mapped_curr_week_start, INTERVAL 1 YEAR))
            ORDER BY WEEK(DATE_SUB(mapped_curr_week_start, INTERVAL 1 YEAR), 1)
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS ly_cumulative_order_count,
        IF(
            SUM(ly_weekly_order_count) OVER (
                PARTITION BY store_code, YEAR(DATE_SUB(mapped_curr_week_start, INTERVAL 1 YEAR))
                ORDER BY WEEK(DATE_SUB(mapped_curr_week_start, INTERVAL 1 YEAR), 1)
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) = 0,
            0,
            ROUND(
                SUM(ly_weekly_revenue) OVER (
                    PARTITION BY store_code, YEAR(DATE_SUB(mapped_curr_week_start, INTERVAL 1 YEAR))
                    ORDER BY WEEK(DATE_SUB(mapped_curr_week_start, INTERVAL 1 YEAR), 1)
                    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                ) / SUM(ly_weekly_order_count) OVER (
                    PARTITION BY store_code, YEAR(DATE_SUB(mapped_curr_week_start, INTERVAL 1 YEAR))
                    ORDER BY WEEK(DATE_SUB(mapped_curr_week_start, INTERVAL 1 YEAR), 1)
                    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                ),
                2
            )
        ) AS ly_cumulative_aov
    FROM ly_store_weekly_stats
)
-- 【最终关联】用门店代码 + 日期映射关联，确保精准匹配
SELECT
    curr.city_name AS city_name,
    curr.store_code AS store_code,
    curr.store_name AS store_name,
    curr.sales_year AS sales_year,
    curr.sales_week AS sales_week,
    -- 今年日期范围
    CONCAT(DATE_FORMAT(curr.week_start, '%Y-%m-%d'), ' ~ ', DATE_FORMAT(curr.week_end, '%Y-%m-%d')) AS week_date_range,
    -- 【新增】去年同期日期范围
    CONCAT(
        DATE_FORMAT(DATE_SUB(curr.week_start, INTERVAL 1 YEAR), '%Y-%m-%d'),
        ' ~ ',
        DATE_FORMAT(DATE_SUB(curr.week_end, INTERVAL 1 YEAR), '%Y-%m-%d')
    ) AS last_year_date_range,
    curr.cumulative_aov AS current_year_cumulative_aov,
    ly.ly_cumulative_aov AS last_year_cumulative_aov,
    ROUND(curr.cumulative_aov - ly.ly_cumulative_aov, 2) AS cumulative_aov_yoy_diff,
    IF(ly.ly_cumulative_aov IS NULL OR ly.ly_cumulative_aov = 0,
       NULL,
       ROUND((curr.cumulative_aov - ly.ly_cumulative_aov) / ly.ly_cumulative_aov * 100, 2)
    ) AS cumulative_aov_yoy_pct
FROM curr_cumulative curr
LEFT JOIN ly_cumulative ly
    -- 【核心修改】关联条件：门店代码 + 日期映射
    ON curr.store_code = ly.store_code
   AND curr.week_start = ly.mapped_curr_week_start
   AND curr.week_end = ly.mapped_curr_week_end
WHERE curr.sales_year >= (SELECT MAX(sales_year) - 1 FROM store_weekly_stats)
ORDER BY
    curr.store_code,
    curr.sales_year DESC,
    curr.sales_week DESC;