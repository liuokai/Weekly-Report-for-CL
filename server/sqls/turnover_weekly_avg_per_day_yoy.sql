-- 按周计算每周平均每天营业额（日期映射精准匹配 + ISO 年周口径）
WITH weekly_base AS (
    -- 【对应参考SQL的curr_week_data】按周聚合【今年】的基础数据
    SELECT
        YEARWEEK(off_clock_time, 1) AS year_week_key,
        YEAR(STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W')) AS sales_year,
        WEEK(STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W'), 1) AS sales_week,
        STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W') AS week_start,
        DATE_ADD(STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W'), INTERVAL 6 DAY) AS week_end,
        SUM(order_actual_payment) AS weekly_total_revenue,
        COUNT(DISTINCT DATE(off_clock_time),store_code) AS active_days
    FROM data_warehouse.dwd_sales_order_detail
    WHERE off_clock_time IS NOT NULL
      AND off_clock_time >= '2024-01-01'
      AND (order_type in ('01','03') or project_name='修脚')
    GROUP BY 1, 2, 3, 4, 5
),
ly_data_prep AS (
    -- 【对应参考SQL的ly_data_prep】给【去年】每一行数据，打上“映射到今年的周”标签
    SELECT
        order_actual_payment,
        order_type,
        project_name,
        DATE(off_clock_time) AS ly_order_date, -- 用于计算去年的营业天数
        store_code AS store_code,
        -- 核心逻辑：严格照搬参考SQL，把去年的日期加1年
        STR_TO_DATE(CONCAT(YEARWEEK(DATE_ADD(off_clock_time, INTERVAL 1 YEAR), 1), ' Monday'), '%x%v %W') AS mapped_curr_week_start,
        DATE_ADD(STR_TO_DATE(CONCAT(YEARWEEK(DATE_ADD(off_clock_time, INTERVAL 1 YEAR), 1), ' Monday'), '%x%v %W'), INTERVAL 6 DAY) AS mapped_curr_week_end
    FROM data_warehouse.dwd_sales_order_detail
    WHERE off_clock_time IS NOT NULL
      AND off_clock_time >= '2024-01-01'
      AND (order_type in ('01','03') or project_name='修脚')
),
ly_agg AS (
    -- 【对应参考SQL的ly_agg】按“映射到今年的周”分组，聚合【去年】数据
    SELECT
        mapped_curr_week_start,
        mapped_curr_week_end,
        SUM(order_actual_payment) AS ly_weekly_total_revenue,
        COUNT(DISTINCT ly_order_date,store_code)  AS ly_active_days
    FROM ly_data_prep
    GROUP BY mapped_curr_week_start, mapped_curr_week_end
),
weekly_avg AS (
    -- 【完全保留原SQL第二步】计算【今年】的天均营业额，字段名完全不变
    SELECT
        *,
        IF(active_days = 0, 0, ROUND(weekly_total_revenue / active_days, 2)) AS daily_avg_revenue
    FROM weekly_base
)
-- 【最终关联：严格对应参考SQL，只用日期映射关联】
SELECT
    curr.sales_year AS `year`,
    curr.sales_week AS `week`,
    -- 【完全保留原字段】今年日期范围
    CONCAT(DATE_FORMAT(curr.week_start, '%Y-%m-%d'), ' ~ ', DATE_FORMAT(curr.week_end, '%Y-%m-%d')) AS `date_range`,
    -- 【新增】去年同期日期范围
    CONCAT(
        DATE_FORMAT(DATE_SUB(curr.week_start, INTERVAL 1 YEAR), '%Y-%m-%d'),
        ' ~ ',
        DATE_FORMAT(DATE_SUB(curr.week_end, INTERVAL 1 YEAR), '%Y-%m-%d')
    ) AS `last_year_date_range`,
    -- 【完全保留原字段】今年数据
    curr.weekly_total_revenue AS `weekly_total`,
    curr.active_days AS `active_days`,
    curr.daily_avg_revenue AS `current_value`,
    -- 【新增】去年同期分子分母
    ly.ly_weekly_total_revenue AS `last_year_weekly_total`,
    ly.ly_active_days AS `last_year_active_days`,
    -- 【完全保留原字段】去年同期天均值
    IF(ly.ly_active_days = 0 OR ly.ly_active_days IS NULL, 0, ROUND(ly.ly_weekly_total_revenue / ly.ly_active_days, 2)) AS `last_year_value`,
    -- 【完全保留原字段】同比增幅
    IF(
        IF(ly.ly_active_days = 0 OR ly.ly_active_days IS NULL, 0, ROUND(ly.ly_weekly_total_revenue / ly.ly_active_days, 2)) IS NULL
        OR IF(ly.ly_active_days = 0 OR ly.ly_active_days IS NULL, 0, ROUND(ly.ly_weekly_total_revenue / ly.ly_active_days, 2)) = 0,
        NULL,
        ROUND(
            (curr.daily_avg_revenue - IF(ly.ly_active_days = 0 OR ly.ly_active_days IS NULL, 0, ROUND(ly.ly_weekly_total_revenue / ly.ly_active_days, 2)))
            / IF(ly.ly_active_days = 0 OR ly.ly_active_days IS NULL, 0, ROUND(ly.ly_weekly_total_revenue / ly.ly_active_days, 2)) * 100,
            2
        )
    ) AS `yoy_change`
FROM weekly_avg curr
LEFT JOIN ly_agg ly
    -- 【核心修改：严格对应参考SQL，只用日期映射关联】
    ON curr.week_start = ly.mapped_curr_week_start
   AND curr.week_end = ly.mapped_curr_week_end
WHERE curr.sales_year >= 2025
ORDER BY curr.sales_year DESC, curr.sales_week DESC;