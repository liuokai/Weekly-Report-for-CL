-- 按月统计床位人员配置比（全国层面 + 年月同比逻辑）
WITH monthly_base AS (
    SELECT
        a.store_feature_record_time,
        YEAR(STR_TO_DATE(a.store_feature_record_time, '%Y-%m-%d')) AS s_year,
        MONTH(STR_TO_DATE(a.store_feature_record_time, '%Y-%m-%d')) AS s_month,
        SUM(a.bed_count) AS total_bed_count,
        SUM(a.massager_on_duty_count) AS total_staff_on_duty,
        ROUND(SUM(a.massager_on_duty_count) / SUM(a.bed_count), 2) AS overall_staff_bed_ratio
    FROM data_warehouse.dws_store_store_topic_table_monthly a
    LEFT JOIN data_warehouse.dm_city b
        ON a.city_code = b.city_code
    WHERE a.bed_count > 0
      AND a.store_feature_record_time IS NOT NULL
    -- 【修改】去掉城市分组，只按时间分组
    GROUP BY a.store_feature_record_time, s_year, s_month
)
-- 自连接实现同比：月相等、年=年+1
SELECT
    curr.s_year AS stat_year,
    curr.s_month AS stat_month,
    curr.store_feature_record_time AS stat_month_date,
    prev.store_feature_record_time AS last_stat_month_date,
    curr.total_staff_on_duty,
    curr.total_bed_count,
    curr.overall_staff_bed_ratio AS current_month_ratio,
    prev.overall_staff_bed_ratio AS last_year_same_month_ratio,
    ROUND(curr.overall_staff_bed_ratio - prev.overall_staff_bed_ratio, 2) AS yoy_diff_value,
    -- 补充同比增长率
    IF(prev.overall_staff_bed_ratio = 0 OR prev.overall_staff_bed_ratio IS NULL,
       NULL,
       ROUND((curr.overall_staff_bed_ratio - prev.overall_staff_bed_ratio) / prev.overall_staff_bed_ratio * 100, 2)
    ) AS yoy_diff_pct
FROM monthly_base curr
LEFT JOIN monthly_base prev
    -- 【修改】去掉城市关联条件
    ON curr.s_year = prev.s_year + 1
   AND curr.s_month = prev.s_month
WHERE curr.s_year >= 2025
ORDER BY curr.store_feature_record_time DESC;