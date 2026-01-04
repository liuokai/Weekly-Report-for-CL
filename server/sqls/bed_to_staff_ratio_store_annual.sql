-- 以年、门店维度统计床位人员配置比

WITH yearly_snapshot_date AS (
    -- 第一步：找出每年有数据的最后一天
    SELECT
        YEAR(date) AS s_year,
        MAX(date)  AS last_date_of_year
    FROM dws_indicator_bed_staffing_table_daily
    WHERE date IS NOT NULL
    GROUP BY YEAR(date)
),
yearly_store_metrics AS (
    -- 第二步：提取各门店在每年最后一天的在岗人数和床位数
    SELECT
        y.s_year,
        y.last_date_of_year,
        d.store_code,
        d.store_name,
        d.statistics_city_name AS city_name,
        d.massager_on_duty_count,
        d.bed_count
    FROM yearly_snapshot_date y
    JOIN dws_indicator_bed_staffing_table_daily d ON y.last_date_of_year = d.date
),
yearly_store_ratios AS (
    -- 第三步：计算各门店配置比指标 (计算逻辑：人员 / 床位)
    SELECT
        s_year,
        last_date_of_year,
        store_code,
        store_name,
        city_name,
        massager_on_duty_count,
        bed_count,
        -- 指标逻辑：人员数量 / 床位数量
        ROUND(massager_on_duty_count / NULLIF(bed_count, 0), 2) AS store_ratio
    FROM yearly_store_metrics
)
-- 第四步：自连接进行同比计算（按年份+门店匹配）
SELECT
    curr.s_year               AS stat_year,
    curr.store_code           AS store_code,
    curr.store_name           AS store_name,
    curr.city_name            AS city_name,
    curr.last_date_of_year    AS snapshot_date,
    curr.massager_on_duty_count AS staff_on_duty,
    curr.bed_count            AS bed_count,
    curr.store_ratio          AS current_year_ratio,
    prev.store_ratio          AS last_year_ratio,
    ROUND(curr.store_ratio - prev.store_ratio, 2) AS yoy_difference
FROM yearly_store_ratios curr
LEFT JOIN yearly_store_ratios prev
    ON curr.s_year = prev.s_year + 1
    AND curr.store_code = prev.store_code
ORDER BY curr.s_year DESC, curr.store_code ASC;