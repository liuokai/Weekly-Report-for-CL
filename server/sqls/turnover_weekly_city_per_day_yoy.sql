-- -- Get weekly city per day YOY trend data
-- -- Columns: statistics_city_name, year, week, date_range, 周天均营业额, 去年同期天均营业额, 天均同比(%)
WITH weekly_city_base AS (
    -- 第一步：基礎聚合（年、周、城市）
    SELECT
        YEAR(a.off_clock_time) AS s_year,
        WEEK(a.off_clock_time, 1) AS s_week,
        b.statistics_city_name,
        SUM(a.order_actual_payment) AS weekly_revenue,
        COUNT(DISTINCT DATE(a.off_clock_time)) AS active_days
    FROM data_warehouse.dwd_sales_order_detail AS a
    LEFT JOIN data_warehouse.dm_city AS b ON a.city_code = b.city_code
    WHERE a.off_clock_time IS NOT NULL
      AND a.off_clock_time >= '2024-01-01'
      AND b.statistics_city_name = ?
    GROUP BY 1, 2, 3
),
weekly_city_avg AS (
    -- 第二步：計算天均營業額
    SELECT
        *,
        ROUND(weekly_revenue / NULLIF(active_days, 0), 2) AS daily_avg_revenue
    FROM weekly_city_base
)
-- 第三步：自連接計算同比
SELECT
    curr.statistics_city_name AS `statistics_city_name`,
    curr.s_year AS `year`,
    curr.s_week AS `week`,
    -- 動態生成日期範圍標籤
    CONCAT(
        DATE_FORMAT(STR_TO_DATE(CONCAT(curr.s_year, curr.s_week, ' Monday'), '%X%V %W'), '%Y-%m-%d'),
        ' ~ ',
        DATE_FORMAT(DATE_ADD(STR_TO_DATE(CONCAT(curr.s_year, curr.s_week, ' Monday'), '%X%V %W'), INTERVAL 6 DAY), '%Y-%m-%d')
    ) AS `date_range`,
    curr.daily_avg_revenue AS `周天均营业额`,
    prev.daily_avg_revenue AS `去年同期天均营业额`,
    ROUND((curr.daily_avg_revenue - prev.daily_avg_revenue) / NULLIF(prev.daily_avg_revenue, 0) * 100, 2) AS `天均同比(%)`
FROM weekly_city_avg curr
LEFT JOIN weekly_city_avg prev
    ON curr.s_year = prev.s_year + 1
    AND curr.s_week = prev.s_week
    AND curr.statistics_city_name = prev.statistics_city_name
WHERE curr.s_year = 2025
ORDER BY curr.s_week DESC, curr.daily_avg_revenue DESC;