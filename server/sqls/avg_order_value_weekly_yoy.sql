WITH curr_week_data AS (
    -- 【完全保留你的原始SQL】
    SELECT
        YEARWEEK(off_clock_time, 1)                                                                      AS year_week_key,
        YEAR(STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W'))                    AS sales_year,
        WEEK(STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W'), 1)                 AS sales_week,
        STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W')                           AS week_start,
        DATE_ADD(STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W'), INTERVAL 6 DAY) AS week_end,
        SUM(order_actual_payment)                                                                         AS weekly_revenue,
        COUNT(if(service_duration >= 40, order_uid, null))                                               AS weekly_order_count
    FROM data_warehouse.dwd_sales_order_detail
    WHERE off_clock_time IS NOT NULL
      AND off_clock_time >= '2024-01-01'
      AND (order_type in ('01', '03') or project_name = '修脚')
    GROUP BY 1, 2, 3, 4, 5
),
ly_data_prep AS (
    -- 【去年数据预处理】给去年每一行数据，打上“对应今年的周起始/结束”标签
    SELECT
        order_actual_payment,
        service_duration,
        order_uid,
        order_type,
        project_name,
        -- 核心逻辑：把去年的日期加1年，找到它属于今年的哪一周
        STR_TO_DATE(CONCAT(YEARWEEK(DATE_ADD(off_clock_time, INTERVAL 1 YEAR), 1), ' Monday'), '%x%v %W') AS mapped_curr_week_start,
        DATE_ADD(STR_TO_DATE(CONCAT(YEARWEEK(DATE_ADD(off_clock_time, INTERVAL 1 YEAR), 1), ' Monday'), '%x%v %W'), INTERVAL 6 DAY) AS mapped_curr_week_end
    FROM data_warehouse.dwd_sales_order_detail
    WHERE off_clock_time IS NOT NULL
      AND off_clock_time >= '2024-01-01'
      AND (order_type in ('01', '03') or project_name = '修脚')
),
ly_agg AS (
    -- 【去年数据聚合】按“对应今年的周”分组，确保一周一行
    SELECT
        mapped_curr_week_start,
        mapped_curr_week_end,
        SUM(order_actual_payment) AS ly_weekly_revenue,
        COUNT(if(service_duration >= 40, order_uid, null)) AS ly_weekly_order_count
    FROM ly_data_prep
    GROUP BY mapped_curr_week_start, mapped_curr_week_end
)
-- 【最终输出】新增去年日期范围、同比差异、同比增幅
SELECT
    curr.sales_year,
    curr.sales_week,
    -- 今年日期范围
    CONCAT(DATE_FORMAT(curr.week_start, '%Y-%m-%d'), ' ~ ', DATE_FORMAT(curr.week_end, '%Y-%m-%d')) AS week_date_range,
    -- 【新增】去年同期日期范围
    CONCAT(DATE_FORMAT(DATE_SUB(curr.week_start, INTERVAL 1 YEAR), '%Y-%m-%d'), ' ~ ', DATE_FORMAT(DATE_SUB(curr.week_end, INTERVAL 1 YEAR), '%Y-%m-%d')) AS last_year_date_range,
    -- 今年数据
    curr.weekly_revenue,
    curr.weekly_order_count,
    ROUND(curr.weekly_revenue / curr.weekly_order_count, 2) AS current_week_aov,
    -- 去年数据
    ly.ly_weekly_revenue,
    ly.ly_weekly_order_count,
    ROUND(ly.ly_weekly_revenue / ly.ly_weekly_order_count, 2) AS last_year_week_aov,
    -- 【新增】同比差异（今年AOV - 去年AOV）
    ROUND(
        ROUND(curr.weekly_revenue / curr.weekly_order_count, 2) - ROUND(ly.ly_weekly_revenue / ly.ly_weekly_order_count, 2),
        2
    ) AS aov_yoy_diff,
    -- 【新增】同比增幅（(今年-去年)/去年*100，处理空值/0值）
    IF(
        ly.ly_weekly_revenue IS NULL OR ly.ly_weekly_order_count = 0 OR ly.ly_weekly_revenue = 0,
        NULL,
        ROUND(
            (ROUND(curr.weekly_revenue / curr.weekly_order_count, 2) - ROUND(ly.ly_weekly_revenue / ly.ly_weekly_order_count, 2))
            / (ly.ly_weekly_revenue / ly.ly_weekly_order_count) * 100,
            2
        )
    ) AS aov_yoy_pct
FROM curr_week_data curr
LEFT JOIN ly_agg ly
    ON curr.week_start = ly.mapped_curr_week_start
   AND curr.week_end = ly.mapped_curr_week_end
WHERE curr.sales_year >= 2025
ORDER BY curr.year_week_key DESC;