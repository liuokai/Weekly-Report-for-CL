-- 按 ISO 周计算年度累计营业额（统一分组逻辑：year分区 + week排序）
WITH curr_weekly_sales AS (
    -- 【今年单周】按ISO周聚合今年的单周营业额
    SELECT
        STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W') AS week_start,
        DATE_ADD(STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W'), INTERVAL 6 DAY) AS week_end,
        YEAR(STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W')) AS sales_year,
        WEEK(STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W'), 1) AS sales_week,
        SUM(order_actual_payment) AS current_weekly_value
    FROM data_warehouse.dwd_sales_order_detail
    WHERE off_clock_time IS NOT NULL
      AND off_clock_time >= '2024-01-01'
      AND (order_type in ('01','03') or project_name='修脚')
    GROUP BY 1, 2, 3, 4
),
ly_data_prep AS (
    -- 【去年数据预处理】给去年每一行数据打映射标签
    SELECT
        order_actual_payment,
        STR_TO_DATE(CONCAT(YEARWEEK(DATE_ADD(off_clock_time, INTERVAL 1 YEAR), 1), ' Monday'), '%x%v %W') AS mapped_curr_week_start,
        DATE_ADD(STR_TO_DATE(CONCAT(YEARWEEK(DATE_ADD(off_clock_time, INTERVAL 1 YEAR), 1), ' Monday'), '%x%v %W'), INTERVAL 6 DAY) AS mapped_curr_week_end,
        WEEK(STR_TO_DATE(CONCAT(YEARWEEK(DATE_ADD(off_clock_time, INTERVAL 1 YEAR), 1), ' Monday'), '%x%v %W'), 1) AS mapped_curr_week
    FROM data_warehouse.dwd_sales_order_detail
    WHERE off_clock_time IS NOT NULL
      AND off_clock_time >= '2024-01-01'
      AND (order_type in ('01','03') or project_name='修脚')
),
ly_weekly_agg AS (
    -- 【去年单周】按映射后的周聚合，得到 last_year_weekly_value
    SELECT
        mapped_curr_week_start,
        mapped_curr_week_end,
        mapped_curr_week,
        SUM(order_actual_payment) AS last_year_weekly_value,
        ROW_NUMBER() OVER(PARTITION BY mapped_curr_week_start, mapped_curr_week_end ORDER BY mapped_curr_week) AS rn
    FROM ly_data_prep
    GROUP BY mapped_curr_week_start, mapped_curr_week_end, mapped_curr_week
),
matched_weekly AS (
    -- 【第一步：先匹配当周数据】把今年和去年的当周数据 JOIN 成一行
    SELECT
        curr.week_start,
        curr.week_end,
        curr.sales_year,
        curr.sales_week,
        curr.current_weekly_value,
        ly.last_year_weekly_value,
        ROW_NUMBER() OVER(PARTITION BY curr.week_start, curr.week_end ORDER BY curr.sales_week) AS rn
    FROM curr_weekly_sales curr
    LEFT JOIN ly_weekly_agg ly
        ON curr.week_start = ly.mapped_curr_week_start
       AND curr.week_end = ly.mapped_curr_week_end
       AND ly.rn = 1
)
-- 【第二步：再算累计】统一使用 sales_year 分区、sales_week 排序
SELECT
    sales_year AS `year`,
    sales_week AS `week`,
    CONCAT(DATE_FORMAT(week_start, '%Y-%m-%d'), ' ~ ', DATE_FORMAT(week_end, '%Y-%m-%d')) AS `date_range`,
    -- 【先匹配好的当周数据】
    current_weekly_value,
    last_year_weekly_value,
    -- 【后算的累计数据：统一分组逻辑】
    SUM(current_weekly_value) OVER (
        PARTITION BY sales_year
        ORDER BY sales_week
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS current_value,
    SUM(last_year_weekly_value) OVER (
        PARTITION BY sales_year -- 【统一修改：也用 sales_year 分区】
        ORDER BY sales_week
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS last_year_value,
    -- 【累计同比】
    IF(
        SUM(last_year_weekly_value) OVER (
            PARTITION BY sales_year
            ORDER BY sales_week
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) IS NULL
        OR SUM(last_year_weekly_value) OVER (
            PARTITION BY sales_year
            ORDER BY sales_week
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) = 0,
        NULL,
        ROUND(
            (SUM(current_weekly_value) OVER (
                PARTITION BY sales_year
                ORDER BY sales_week
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) - SUM(last_year_weekly_value) OVER (
                PARTITION BY sales_year
                ORDER BY sales_week
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ))
            / SUM(last_year_weekly_value) OVER (
                PARTITION BY sales_year
                ORDER BY sales_week
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) * 100,
            2
        )
    ) AS `yoy_change`,
    -- 【当周同比】
    IF(
        last_year_weekly_value IS NULL OR last_year_weekly_value = 0,
        NULL,
        ROUND((current_weekly_value - last_year_weekly_value) / last_year_weekly_value * 100, 2)
    ) AS `weekly_yoy_change`
FROM matched_weekly
WHERE sales_year >= 2025
  AND rn = 1 -- 防一对多
ORDER BY sales_year DESC, sales_week DESC;