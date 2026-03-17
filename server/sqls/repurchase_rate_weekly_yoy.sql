-- 周维度的项目回头率统计（日期映射逻辑 + 保留所有原字段名 + 新增时间范围/上年分子分母）
WITH weekly_metrics AS (
    -- 【完全保留原SQL第一步，作为今年数据】按年、周维度汇总【今年】数据
    SELECT
        YEAR(STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W'))    AS s_year,
        WEEK(STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W'), 1) AS s_week,
        STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W') AS week_start,
        DATE_ADD(STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W'), INTERVAL 6 DAY) AS week_end,
        COUNT(DISTINCT order_uid) AS total_orders,
        SUM(IF(is_massager_project_return_customer = '是', 1, 0)) AS repurchase_orders
    FROM dwd_sales_order_detail
    WHERE off_clock_time IS NOT NULL
      AND off_clock_time >= '2024-01-01'
      AND service_duration >= 40
    GROUP BY 1, 2, 3, 4
),
ly_data_prep AS (
    -- 【新增：对应参考SQL的ly_data_prep】给【去年】每一行数据，打上“映射到今年的周”标签
    SELECT
        order_uid,
        is_massager_project_return_customer,
        service_duration,
        -- 核心逻辑：严格照搬参考SQL，把去年的日期加1年，找到对应今年的周
        STR_TO_DATE(CONCAT(YEARWEEK(DATE_ADD(off_clock_time, INTERVAL 1 YEAR), 1), ' Monday'), '%x%v %W') AS mapped_curr_week_start,
        DATE_ADD(STR_TO_DATE(CONCAT(YEARWEEK(DATE_ADD(off_clock_time, INTERVAL 1 YEAR), 1), ' Monday'), '%x%v %W'), INTERVAL 6 DAY) AS mapped_curr_week_end
    FROM dwd_sales_order_detail
    WHERE off_clock_time IS NOT NULL
      AND off_clock_time >= '2024-01-01'
      AND service_duration >= 40
),
ly_agg AS (
    -- 【新增：对应参考SQL的ly_agg】按“映射到今年的周”分组，聚合【去年】数据
    SELECT
        mapped_curr_week_start,
        mapped_curr_week_end,
        COUNT(DISTINCT order_uid) AS ly_total_orders,
        SUM(IF(is_massager_project_return_customer = '是', 1, 0)) AS ly_repurchase_orders
    FROM ly_data_prep
    GROUP BY mapped_curr_week_start, mapped_curr_week_end
),
rate_calculation AS (
    -- 【完全保留原SQL第二步】计算【今年】的回头率，字段名完全不变
    SELECT
        *,
        ROUND(repurchase_orders / NULLIF(total_orders, 0) * 100, 2) AS repurchase_rate
    FROM weekly_metrics
)
-- 【最终关联：严格对应参考SQL，只用日期映射关联】
SELECT
    curr.s_year,
    curr.s_week,
    -- 【完全保留原字段】今年周的时间范围
    CONCAT(DATE_FORMAT(curr.week_start, '%Y-%m-%d'), ' ~ ', DATE_FORMAT(curr.week_end, '%Y-%m-%d')) AS `week_date_range`,
    -- 【新增】上年同期周的时间范围
    CONCAT(
        DATE_FORMAT(DATE_SUB(curr.week_start, INTERVAL 1 YEAR), '%Y-%m-%d'),
        ' ~ ',
        DATE_FORMAT(DATE_SUB(curr.week_end, INTERVAL 1 YEAR), '%Y-%m-%d')
    ) AS last_year_date_range,
    -- 【完全保留原字段】今年分子分母
    curr.total_orders,
    curr.repurchase_orders,
    curr.repurchase_rate,
    -- 【新增】上年同期分子分母
    ly.ly_total_orders,
    ly.ly_repurchase_orders,
    -- 【完全保留原字段】上年同期回头率
    ROUND(ly.ly_repurchase_orders / NULLIF(ly.ly_total_orders, 0) * 100, 2) AS prev_year_rate,
    -- 【完全保留原字段】同比增减百分点
    ROUND(curr.repurchase_rate - ROUND(ly.ly_repurchase_orders / NULLIF(ly.ly_total_orders, 0) * 100, 2), 2) AS yoy_change_pct
FROM rate_calculation curr
LEFT JOIN ly_agg ly
    -- 【核心修改：严格对应参考SQL，只用日期映射关联】
    ON curr.week_start = ly.mapped_curr_week_start
   AND curr.week_end = ly.mapped_curr_week_end
ORDER BY curr.s_year DESC, curr.s_week DESC;