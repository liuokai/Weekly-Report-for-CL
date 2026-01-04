-- 年度床位人员配置比统计

WITH yearly_snapshot_date AS (
    -- 第一步：找出每年有数据的最后一天
    SELECT
        YEAR(date) AS s_year,
        MAX(date)  AS last_date_of_year
    FROM dws_indicator_bed_staffing_table_daily
    WHERE date IS NOT NULL
    GROUP BY YEAR(date)
),
yearly_aggregated_metrics AS (
    -- 第二步：汇总全公司在每年最后一天的总人数和总床位
    SELECT
        y.s_year,
        y.last_date_of_year,
        SUM(d.massager_on_duty_count) AS total_massager_count,
        SUM(d.bed_count) AS total_bed_count
    FROM yearly_snapshot_date y
    JOIN dws_indicator_bed_staffing_table_daily d ON y.last_date_of_year = d.date
    GROUP BY y.s_year, y.last_date_of_year
),
yearly_ratios AS (
    -- 第三步：计算全公司的配置比
    SELECT
        s_year,
        last_date_of_year,
        total_massager_count,
        total_bed_count,
        ROUND(total_massager_count / NULLIF(total_bed_count, 0), 2) AS corp_ratio
    FROM yearly_aggregated_metrics
)
-- 第四步：自连接进行同比计算并输出英文别名
SELECT
    curr.s_year               AS stat_year,
    curr.last_date_of_year    AS snapshot_date,
    curr.total_massager_count AS total_staff_on_duty,
    curr.total_bed_count      AS total_bed_count,
    curr.corp_ratio           AS current_year_ratio,
    prev.corp_ratio           AS last_year_ratio,
    ROUND(curr.corp_ratio - prev.corp_ratio, 2) AS yoy_difference
FROM yearly_ratios curr
LEFT JOIN yearly_ratios prev
    ON curr.s_year = prev.s_year + 1
ORDER BY curr.s_year DESC;