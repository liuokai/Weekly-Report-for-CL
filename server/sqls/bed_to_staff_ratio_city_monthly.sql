-- 按月、城市统计床位人员配置比（修复NULL问题 + 年月同比逻辑）
WITH monthly_city_base AS (
    SELECT
        a.store_feature_record_time,
        YEAR(STR_TO_DATE(a.store_feature_record_time, '%Y-%m-%d')) AS s_year,
        MONTH(STR_TO_DATE(a.store_feature_record_time, '%Y-%m-%d')) AS s_month,
        b.statistics_city_name AS city_name,
        SUM(a.bed_count) AS total_bed_count,
        SUM(a.massager_on_duty_count) AS total_staff_on_duty,
        ROUND(SUM(a.massager_on_duty_count) / SUM(a.bed_count), 2) AS city_staff_bed_ratio
    FROM data_warehouse.dws_store_store_topic_table_monthly a
    LEFT JOIN data_warehouse.dm_city b
        ON a.city_code = b.city_code
    WHERE a.bed_count > 0
      AND a.store_feature_record_time IS NOT NULL -- 过滤空日期无效数据
    -- 【修复】GROUP BY包含所有非聚合字段，适配数仓严格模式
    GROUP BY a.store_feature_record_time, s_year, s_month, b.statistics_city_name
)
-- 自连接实现同比：月相等、年=年+1、城市相等
SELECT
    curr.s_year AS stat_year,
    curr.s_month AS stat_month,
    curr.store_feature_record_time AS stat_month_date,
    prev.store_feature_record_time AS last_stat_month_date,
    curr.city_name,
    curr.total_staff_on_duty,
    curr.total_bed_count,
    curr.city_staff_bed_ratio AS current_month_ratio,
    prev.city_staff_bed_ratio AS last_year_same_month_ratio,
    ROUND(curr.city_staff_bed_ratio - prev.city_staff_bed_ratio, 2) AS yoy_diff_value,
    -- 补充同比增长率（可选）
    IF(prev.city_staff_bed_ratio = 0 OR prev.city_staff_bed_ratio IS NULL,
       NULL,
       ROUND((curr.city_staff_bed_ratio - prev.city_staff_bed_ratio) / prev.city_staff_bed_ratio * 100, 2)
    ) AS yoy_diff_pct
FROM monthly_city_base curr
LEFT JOIN monthly_city_base prev
    ON curr.s_year = prev.s_year + 1
   AND curr.s_month = prev.s_month
   AND curr.city_name = prev.city_name
WHERE curr.s_year >= 2025
ORDER BY curr.store_feature_record_time DESC, curr.city_name ASC;