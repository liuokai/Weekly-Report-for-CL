-- 按周、城市的维度统计床位人员配置比

WITH weekly_snapshot_date AS (
    -- 第一步：找出每年、每周有数据的最后一天
    SELECT
        YEAR(STR_TO_DATE(CONCAT(YEARWEEK(date, 1), ' Monday'), '%x%v %W'))    AS s_year,
        WEEK(STR_TO_DATE(CONCAT(YEARWEEK(date, 1), ' Monday'), '%x%v %W'), 1) AS s_week,
        -- 该周的起始日期（周一，保持原逻辑）
        STR_TO_DATE(CONCAT(YEARWEEK(date, 1),' Monday'),'%x%v %W') AS week_start,
        -- 该周的结束日期（周日，保持原逻辑）
        DATE_ADD( STR_TO_DATE(CONCAT(YEARWEEK(date, 1), 'Monday'),'%x%v %W'), INTERVAL 6 DAY ) AS week_end,
        MAX(date)     AS last_date_of_week
    FROM dws_indicator_bed_staffing_table_daily
    WHERE date IS NOT NULL
    GROUP BY YEAR(STR_TO_DATE(CONCAT(YEARWEEK(date, 1), 'Monday'), '%x%v %W')),
             WEEK(STR_TO_DATE(CONCAT(YEARWEEK(date, 1), 'Monday'), '%x%v %W'), 1),3,4
),
weekly_city_aggregated_metrics AS (
    -- 第二步：按年、周、城市汇总该周最后一天的总人数和总床位
    SELECT
        w.s_year,
        w.s_week,
        CONCAT(DATE_FORMAT(week_start, '%Y-%m-%d'),' ~ ',DATE_FORMAT(week_end, '%Y-%m-%d')) AS `date_range`,
        w.last_date_of_week,
        d.statistics_city_name AS city_name,
        SUM(d.massager_on_duty_count) AS total_massager_count,
        SUM(d.bed_count) AS total_bed_count
    FROM weekly_snapshot_date w
    JOIN dws_indicator_bed_staffing_table_daily d ON w.last_date_of_week = d.date
    GROUP BY w.s_year, w.s_week,date_range, w.last_date_of_week, d.statistics_city_name
),
weekly_city_ratios AS (
    -- 第三步：计算每个城市在每周的配置比
    SELECT
        s_year,
        s_week,date_range,
        last_date_of_week,
        city_name,
        total_massager_count,
        total_bed_count,
        ROUND(total_massager_count / NULLIF(total_bed_count, 0), 2) AS city_ratio
    FROM weekly_city_aggregated_metrics
)
-- 第四步：自连接进行同比计算（按年份偏移1年，且周数和城市必须匹配）
SELECT
    curr.s_year               AS stat_year,
    curr.s_week               AS stat_week,
    curr.date_range           AS week_date_range,
    curr.city_name            AS city_name,
    curr.last_date_of_week    AS snapshot_date,
    curr.total_massager_count AS total_staff_on_duty,
    curr.total_bed_count      AS total_bed_count,
    curr.city_ratio           AS current_week_ratio,
    prev.city_ratio           AS last_year_same_week_ratio,
    ROUND(curr.city_ratio - prev.city_ratio, 2) AS yoy_difference
FROM weekly_city_ratios curr
LEFT JOIN weekly_city_ratios prev
    ON curr.s_year = prev.s_year + 1
    AND curr.s_week = prev.s_week
    AND curr.city_name = prev.city_name
-- 按照你的习惯，通常会筛选当前年份，例如 2025
WHERE curr.s_year >= 2025
ORDER BY curr.s_year DESC, curr.s_week DESC,curr.city_name ASC

;
