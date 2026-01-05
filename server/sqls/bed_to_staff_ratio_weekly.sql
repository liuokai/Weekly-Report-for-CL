-- 按周统计床位人员配置比

WITH weekly_last_day_data AS (
    -- 第一步：通过窗口函数找出每周日期最大（最后一天）的那行数据
    SELECT YEAR(STR_TO_DATE(CONCAT(YEARWEEK(date, 1), ' Monday'), '%x%v %W'))    AS s_year,
           WEEK(STR_TO_DATE(CONCAT(YEARWEEK(date, 1), ' Monday'), '%x%v %W'), 1) AS s_week,
           store_code,
           store_name,
           massager_on_duty_count,
           bed_count,
           bed_to_staff_ratio_on_duty,
           date          AS last_date_of_week,
           ROW_NUMBER() OVER (
               PARTITION BY YEAR(STR_TO_DATE(CONCAT(YEARWEEK(date, 1), ' Monday'), '%x%v %W')),
                            WEEK(STR_TO_DATE(CONCAT(YEARWEEK(date, 1), ' Monday'), '%x%v %W'), 1)
               ORDER BY date DESC
               )         AS rn
    FROM dws_indicator_bed_staffing_table_daily
    WHERE date IS NOT NULL
),
     filtered_weekly_data AS (
         -- 第二步：只保留每周最后一天的数据
         SELECT *
         FROM weekly_last_day_data
         WHERE rn = 1
     )
-- 第三步：自连接计算 2025 年对比 2024 年同周的数据
SELECT curr.s_year                                                                 AS stat_year,
       curr.s_week                                                                 AS stat_week,
       curr.last_date_of_week                                                      AS snapshot_date,
       curr.massager_on_duty_count                                                 AS massager_on_duty_count,
       curr.bed_count                                                              AS bed_count,
       curr.bed_to_staff_ratio_on_duty                                             AS current_week_ratio,
       prev.bed_to_staff_ratio_on_duty                                             AS last_year_same_week_ratio,
       -- 计算绝对值差异
       ROUND(curr.bed_to_staff_ratio_on_duty - prev.bed_to_staff_ratio_on_duty, 2) AS yoy_difference
FROM filtered_weekly_data curr
         LEFT JOIN filtered_weekly_data prev
                   ON curr.s_year = prev.s_year + 1
                       AND curr.s_week = prev.s_week
                       AND curr.store_code = prev.store_code
WHERE curr.s_year >= 2025
ORDER BY curr.s_week DESC;
