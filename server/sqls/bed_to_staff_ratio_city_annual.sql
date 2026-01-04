-- 按年、城市维度统计床位人员配置比

WITH yearly_snapshot_date AS (
    -- 第一步：找出每年有数据的最后一天
    SELECT
        YEAR(date) AS s_year,
        MAX(date)  AS last_date_of_year
    FROM dws_indicator_bed_staffing_table_daily
    WHERE date IS NOT NULL
    GROUP BY YEAR(date)
),
yearly_city_aggregated_metrics AS (
    -- 第二步：按年、城市汇总最后一天的总人数和总床位
    SELECT
        y.s_year,
        y.last_date_of_year,
        d.statistics_city_name AS city_name,
        SUM(d.massager_on_duty_count) AS total_massager_count,
        SUM(d.bed_count) AS total_bed_count
    FROM yearly_snapshot_date y
    JOIN dws_indicator_bed_staffing_table_daily d ON DATE_SUB(y.last_date_of_year, INTERVAL 1 DAY) = d.date
    GROUP BY y.s_year, y.last_date_of_year, d.statistics_city_name
),
yearly_city_ratios AS (
    -- 第三步：计算每个城市在该年的配置比
    SELECT
        s_year,
        last_date_of_year,
        city_name,
        total_massager_count,
        total_bed_count,
        ROUND(total_massager_count / NULLIF(total_bed_count, 0), 2) AS city_ratio
    FROM yearly_city_aggregated_metrics
)
-- 第四步：自连接进行同比计算（按年份+城市匹配）
SELECT
    curr.s_year               AS stat_year,
    curr.city_name            AS city_name,
    curr.last_date_of_year    AS snapshot_date,
    curr.total_massager_count AS total_staff_on_duty,
    curr.total_bed_count      AS total_bed_count,
    curr.city_ratio           AS current_year_ratio,
    prev.city_ratio           AS last_year_ratio,
    ROUND(curr.city_ratio - prev.city_ratio, 2) AS yoy_difference
FROM yearly_city_ratios curr
LEFT JOIN yearly_city_ratios prev
    ON curr.s_year = prev.s_year + 1
    AND curr.city_name = prev.city_name -- 增加城市维度的匹配
ORDER BY curr.s_year DESC, curr.city_name ASC;