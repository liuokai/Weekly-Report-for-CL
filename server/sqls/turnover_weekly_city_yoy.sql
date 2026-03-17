-- 按城市、周维度统计营业额（日期映射精准匹配 + 保留?代码）
WITH weekly_city_sales AS (
    -- 【对应参考SQL的curr_week_data】按城市、周聚合【今年】数据
    SELECT
        b.statistics_city_name,
        YEARWEEK(a.off_clock_time, 1) AS year_week_key,
        YEAR(STR_TO_DATE(CONCAT(YEARWEEK(a.off_clock_time, 1), ' Monday'), '%x%v %W')) AS sales_year,
        WEEK(STR_TO_DATE(CONCAT(YEARWEEK(a.off_clock_time, 1), ' Monday'), '%x%v %W'), 1) AS sales_week,
        STR_TO_DATE(CONCAT(YEARWEEK(a.off_clock_time, 1), ' Monday'), '%x%v %W') AS week_start,
        DATE_ADD(STR_TO_DATE(CONCAT(YEARWEEK(a.off_clock_time, 1), ' Monday'), '%x%v %W'), INTERVAL 6 DAY) AS week_end,
        SUM(a.order_actual_payment) AS weekly_revenue
    FROM data_warehouse.dwd_sales_order_detail AS a
    LEFT JOIN dm_city AS b
        ON a.city_code = b.city_code
    WHERE a.off_clock_time IS NOT NULL
      AND a.off_clock_time >= '2024-01-01'
      AND (order_type in ('01','03') or project_name='修脚')
    GROUP BY
        b.statistics_city_name,
        year_week_key,
        sales_year,
        sales_week,
        week_start,
        week_end
),
ly_data_prep AS (
    -- 【对应参考SQL的ly_data_prep】给【去年】每一行数据，打上“映射到今年的周”标签
    SELECT
        a.order_actual_payment,
        b.statistics_city_name,
        -- 核心逻辑：严格照搬参考SQL，把去年的日期加1年
        STR_TO_DATE(CONCAT(YEARWEEK(DATE_ADD(a.off_clock_time, INTERVAL 1 YEAR), 1), ' Monday'), '%x%v %W') AS mapped_curr_week_start,
        DATE_ADD(STR_TO_DATE(CONCAT(YEARWEEK(DATE_ADD(a.off_clock_time, INTERVAL 1 YEAR), 1), ' Monday'), '%x%v %W'), INTERVAL 6 DAY) AS mapped_curr_week_end
    FROM data_warehouse.dwd_sales_order_detail AS a
    LEFT JOIN dm_city AS b
        ON a.city_code = b.city_code
    WHERE a.off_clock_time IS NOT NULL
      AND a.off_clock_time >= '2024-01-01'
      AND (order_type in ('01','03') or project_name='修脚')
),
ly_agg AS (
    -- 【对应参考SQL的ly_agg】按“映射到今年的周 + 城市”分组，聚合【去年】数据
    SELECT
        mapped_curr_week_start,
        mapped_curr_week_end,
        statistics_city_name,
        SUM(order_actual_payment) AS ly_weekly_revenue
    FROM ly_data_prep
    GROUP BY mapped_curr_week_start, mapped_curr_week_end, statistics_city_name
)
-- 【最终关联：严格对应参考SQL，只用日期映射 + 城市关联】
SELECT
    curr.statistics_city_name,
    curr.sales_year AS `year`,
    curr.sales_week AS `week`,
    CONCAT(
        DATE_FORMAT(curr.week_start, '%Y-%m-%d'),
        ' ~ ',
        DATE_FORMAT(curr.week_end, '%Y-%m-%d')
    ) AS `date_range`,
    curr.weekly_revenue AS `current_value`, -- 【当期单指标，无分子分母区分，直接保留】
    ly.ly_weekly_revenue AS `last_year_value`, -- 【去年同期单指标，直接保留】
    IF(
        ly.ly_weekly_revenue IS NULL OR ly.ly_weekly_revenue = 0,
        NULL,
        ROUND(
            (curr.weekly_revenue - ly.ly_weekly_revenue)
            / ly.ly_weekly_revenue * 100,
            2
        )
    ) AS `yoy_change`
FROM weekly_city_sales curr
LEFT JOIN ly_agg ly
    -- 【核心修改：严格对应参考SQL，只用日期映射 + 城市关联】
    ON curr.week_start = ly.mapped_curr_week_start
   AND curr.week_end = ly.mapped_curr_week_end
   AND curr.statistics_city_name = ly.statistics_city_name
WHERE curr.sales_year >= 2025
   AND curr.statistics_city_name = ? -- 【完全保留，未删除】
ORDER BY
    curr.statistics_city_name,
    curr.sales_year desc ,
    curr.sales_week desc ;