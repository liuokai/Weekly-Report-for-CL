-- 按周、城市维度统计周均营业额（天均），并计算同比（日期映射精准匹配 + 显式分子分母 + 保留?代码）
WITH weekly_city_base AS (
    -- 第一步：基础聚合（ISO 年、ISO 周、城市）【今年数据】
    SELECT
        STR_TO_DATE(CONCAT(YEARWEEK(a.off_clock_time, 1), ' Monday'), '%x%v %W') AS week_start_date,
        YEAR(STR_TO_DATE(CONCAT(YEARWEEK(a.off_clock_time, 1), ' Monday'), '%x%v %W')) AS s_year,
        WEEK(STR_TO_DATE(CONCAT(YEARWEEK(a.off_clock_time, 1), ' Monday'), '%x%v %W'), 1) AS s_week,
        b.statistics_city_name,
        SUM(a.order_actual_payment) AS total_weekly_revenue, -- 【当期分子】周总营业额
        COUNT(DISTINCT CONCAT(DATE(a.off_clock_time), '_', store_code)) AS active_day_count -- 【当期分母】营业天数
    FROM data_warehouse.dwd_sales_order_detail AS a
    LEFT JOIN data_warehouse.dm_city AS b
        ON a.city_code = b.city_code
    WHERE a.off_clock_time IS NOT NULL
      AND a.off_clock_time >= '2024-01-01'
      AND (order_type in ('01','03') or project_name='修脚')
     AND b.statistics_city_name = ? -- 【完全保留，未删除】
    GROUP BY
        week_start_date,
        s_year,
        s_week,
        b.statistics_city_name
),
ly_data_prep AS (
    -- 【去年数据预处理】给【去年】每一行数据，打上“映射到今年的周”标签
    SELECT
        a.order_actual_payment,
        DATE(a.off_clock_time) AS ly_order_date, -- 用于计算去年的营业天数
        a.store_code,
        b.statistics_city_name,
        -- 核心逻辑：严格照搬参考SQL，把去年的日期加1年
        STR_TO_DATE(CONCAT(YEARWEEK(DATE_ADD(a.off_clock_time, INTERVAL 1 YEAR), 1), ' Monday'), '%x%v %W') AS mapped_curr_week_start,
        DATE_ADD(STR_TO_DATE(CONCAT(YEARWEEK(DATE_ADD(a.off_clock_time, INTERVAL 1 YEAR), 1), ' Monday'), '%x%v %W'), INTERVAL 6 DAY) AS mapped_curr_week_end
    FROM data_warehouse.dwd_sales_order_detail AS a
    LEFT JOIN data_warehouse.dm_city AS b
        ON a.city_code = b.city_code
    WHERE a.off_clock_time IS NOT NULL
      AND a.off_clock_time >= '2024-01-01'
      AND (order_type in ('01','03') or project_name='修脚')
     AND b.statistics_city_name = ?
),
ly_agg AS (
    -- 【去年数据聚合】按“映射到今年的周 + 城市”分组，聚合【去年】数据
    SELECT
        mapped_curr_week_start,
        mapped_curr_week_end,
        statistics_city_name,
        SUM(order_actual_payment) AS ly_total_weekly_revenue, -- 【去年分子】
        COUNT(DISTINCT CONCAT(ly_order_date, '_', store_code)) AS ly_active_day_count -- 【去年分母】
    FROM ly_data_prep
    GROUP BY mapped_curr_week_start, mapped_curr_week_end, statistics_city_name
),
weekly_city_avg AS (
    -- 第二步：计算【今年】的天均营业额，字段名完全不变
    SELECT
        *,
        ROUND(total_weekly_revenue / NULLIF(active_day_count, 0), 2) AS daily_avg_revenue
    FROM weekly_city_base
)
-- 【最终关联：严格对应参考SQL，只用日期映射 + 城市关联】
SELECT
    curr.statistics_city_name AS city_name,
    curr.s_year               AS stat_year,
    curr.s_week               AS stat_week,
    -- ISO 周日期范围
    CONCAT(
        DATE_FORMAT(curr.week_start_date, '%Y-%m-%d'),
        ' ~ ',
        DATE_FORMAT(DATE_ADD(curr.week_start_date, INTERVAL 6 DAY), '%Y-%m-%d')
    ) AS week_date_range,
    -- 【新增：显式展示当期分子分母】
    curr.total_weekly_revenue AS current_weekly_total_revenue, -- 当期分子：周总营业额
    curr.active_day_count AS current_active_day_count, -- 当期分母：营业天数
    -- 【完全保留原字段】今年天均值
    curr.daily_avg_revenue    AS weekly_daily_avg_revenue,
    -- 【新增：显式展示去年同期分子分母】
    ly.ly_total_weekly_revenue AS last_year_weekly_total_revenue, -- 去年分子
    ly.ly_active_day_count AS last_year_active_day_count, -- 去年分母
    -- 【完全保留原字段】去年同期天均值
    ROUND(ly.ly_total_weekly_revenue / NULLIF(ly.ly_active_day_count, 0), 2) AS last_year_daily_avg_revenue,
    -- 【完全保留原字段】天均同比(%)
    ROUND(
        (curr.daily_avg_revenue - ROUND(ly.ly_total_weekly_revenue / NULLIF(ly.ly_active_day_count, 0), 2))
        / NULLIF(ROUND(ly.ly_total_weekly_revenue / NULLIF(ly.ly_active_day_count, 0), 2), 0) * 100,
        2
    ) AS daily_avg_yoy_rate
FROM weekly_city_avg curr
LEFT JOIN ly_agg ly
    -- 【核心修改：严格对应参考SQL，只用日期映射 + 城市关联】
    ON curr.week_start_date = ly.mapped_curr_week_start
   AND DATE_ADD(curr.week_start_date, INTERVAL 6 DAY) = ly.mapped_curr_week_end
   AND curr.statistics_city_name = ly.statistics_city_name
WHERE curr.s_year >= 2025
ORDER BY
    curr.s_year desc ,
    curr.s_week desc;