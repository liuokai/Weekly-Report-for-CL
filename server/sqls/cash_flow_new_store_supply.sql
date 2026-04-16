      
-- 新店供应总结
WITH query_bed_depreciation AS (
    -- 床位、折旧、单床位成本（含合计行）
    SELECT
        statistics_city_name,
        IFNULL(statistics_city_name, '合计') AS city_name_for_display,
        SUM(CASE WHEN YEAR(t.opening_time) = 2026 THEN t.bed_count ELSE 0 END) AS bed_count_2026, -- 2026年床位数
        SUM(CASE WHEN YEAR(t.opening_time) = 2025 THEN t.bed_count ELSE 0 END) AS bed_count_2025, -- 2025年床位数
        SUM(CASE WHEN YEAR(t.opening_time) = 2024 THEN t.bed_count ELSE 0 END) AS bed_count_2024, -- 2024年床位数
        SUM(CASE WHEN YEAR(t.opening_time) = 2023 THEN t.bed_count ELSE 0 END) AS bed_count_2023, -- 2023年床位数
        SUM(CASE WHEN YEAR(t.opening_time) = 2026 THEN b.depreciation_charge ELSE 0 END) AS depreciation_2026, -- 2026年折旧
        SUM(CASE WHEN YEAR(t.opening_time) = 2025 THEN b.depreciation_charge ELSE 0 END) AS depreciation_2025, -- 2025年折旧
        SUM(CASE WHEN YEAR(t.opening_time) = 2024 THEN b.depreciation_charge ELSE 0 END) AS depreciation_2024, -- 2024年折旧
        SUM(CASE WHEN YEAR(t.opening_time) = 2023 THEN b.depreciation_charge ELSE 0 END) AS depreciation_2023, -- 2023年折旧
        ROUND(CASE WHEN SUM(CASE WHEN YEAR(t.opening_time) = 2026 THEN t.bed_count ELSE 0 END) > 0
             THEN SUM(CASE WHEN YEAR(t.opening_time) = 2026 THEN b.depreciation_charge ELSE 0 END) / SUM(CASE WHEN YEAR(t.opening_time) = 2026 THEN t.bed_count ELSE 0 END)
             ELSE 0 END, 2) AS cost_per_bed_2026, -- 2026年单床位装修成本
        ROUND(CASE WHEN SUM(CASE WHEN YEAR(t.opening_time) = 2025 THEN t.bed_count ELSE 0 END) > 0
             THEN SUM(CASE WHEN YEAR(t.opening_time) = 2025 THEN b.depreciation_charge ELSE 0 END) / SUM(CASE WHEN YEAR(t.opening_time) = 2025 THEN t.bed_count ELSE 0 END)
             ELSE 0 END, 2) AS cost_per_bed_2025, -- 2025年单床位装修成本
        ROUND(CASE WHEN SUM(CASE WHEN YEAR(t.opening_time) = 2024 THEN t.bed_count ELSE 0 END) > 0
             THEN SUM(CASE WHEN YEAR(t.opening_time) = 2024 THEN b.depreciation_charge ELSE 0 END) / SUM(CASE WHEN YEAR(t.opening_time) = 2024 THEN t.bed_count ELSE 0 END)
             ELSE 0 END, 2) AS cost_per_bed_2024, -- 2024年单床位装修成本
        ROUND(CASE WHEN SUM(CASE WHEN YEAR(t.opening_time) = 2023 THEN t.bed_count ELSE 0 END) > 0
             THEN SUM(CASE WHEN YEAR(t.opening_time) = 2023 THEN b.depreciation_charge ELSE 0 END) / SUM(CASE WHEN YEAR(t.opening_time) = 2023 THEN t.bed_count ELSE 0 END)
             ELSE 0 END, 2) AS cost_per_bed_2023 -- 2023年单床位装修成本
    FROM (SELECT *,
                 ROW_NUMBER() OVER (PARTITION BY store_code ORDER BY store_info_record_time DESC) AS rn
          FROM data_warehouse.dwd_store_info) t
             LEFT JOIN tmp_store_depreciation_charge b ON t.store_code = b.store_code
             LEFT JOIN dm_city dt ON t.city_code = dt.city_code
    WHERE rn = 1
    GROUP BY dt.statistics_city_name WITH ROLLUP
),
query_store_area AS (
    -- 门店面积、床位数、利用率（含合计行）
    SELECT
        statistics_city_name,
        IFNULL(statistics_city_name, '合计') AS city_name,
        COUNT(store_code) AS store_count, -- 门店数量
        ROUND(SUM(suite_area) / COUNT(store_code), 0) AS avg_area_per_store, -- 店均面积
        ROUND(SUM(total_investment_amt) / COUNT(total_investment_amt), 2) AS avg_investment_per_store, -- 店均投资
        ROUND(SUM(bed_count) / COUNT(store_code), 0) AS avg_bed_per_store, -- 店均床位数
        ROUND(SUM(suite_area) / SUM(bed_count), 2) AS area_per_bed, -- 单床位面积
        CONCAT(ROUND((SUM(bed_count) * 10 / SUM(suite_area)) * 100, 0), '%') AS space_utilization_rate -- 空间利用率
    FROM (
        SELECT
            dt.statistics_city_name,
            a.store_code,
            a.store_name,
            a.suite_area,
            a.bed_count,
            b1.total_investment_amt,
            ROW_NUMBER() OVER (PARTITION BY a.store_code ORDER BY a.store_info_record_time DESC) AS rn
        FROM data_warehouse.dwd_store_info a
            left join data_warehouse.dws_store_initial_investment b1 on a.store_code = b1.store_code
            left join dm_city dt on a.city_code = dt.city_code
        inner join (
                    SELECT store_code,store_name,city_code,city_name,opening_date,month AS start_month,ramp_up_period
                    FROM dws_new_store_commission_monthly
                    WHERE opening_date > '2026-01-01' AND LEFT(month, 4) = '2026' AND ramp_up_month_count = 1
                        ) b on a.store_code = b.store_code
        WHERE date(a.store_info_record_time) = date_sub(curdate(), interval 0 day)
          AND (a.is_invalid_store = '否' OR (a.opening_time >= '2026-01-01 00:00:00' AND a.opening_time <= NOW()))
          AND a.closing_date IS NULL
          AND a.store_name NOT LIKE '%能量%'
          AND a.store_operation_status IN ('正常', '营业')
          AND a.opening_time >= '2026-01-01 00:00:00'
    ) t
    WHERE rn = 1
    GROUP BY statistics_city_name WITH ROLLUP
)
-- 最终关联：严格匹配表格列顺序
SELECT
    COALESCE(q2.city_name, q1.city_name_for_display) AS city, -- 城市
    q2.store_count, -- 门店数量
    q2.avg_area_per_store AS avg_area_per_store, -- 店均面积
    q2.avg_bed_per_store AS avg_bed_per_store, -- 店均床位数
    q2.space_utilization_rate AS space_utilization_rate, -- 空间利用率
    -- 店均投资（用总折旧/门店数，匹配表格逻辑）
    avg_investment_per_store AS avg_investment_per_store, -- 店均投资
    -- 店均工期（示例：按固定值32/31，可替换为实际工期字段）
    null AS avg_construction_period, -- 店均工期
    q1.cost_per_bed_2026 AS cost_per_bed_2026, -- 2026年单床位装修成本
    q1.cost_per_bed_2025 AS cost_per_bed_2025, -- 2025年单床位装修成本
    q1.cost_per_bed_2024 AS cost_per_bed_2024, -- 2024年单床位装修成本
    q1.cost_per_bed_2023 AS cost_per_bed_2023 -- 2023年单床位装修成本
FROM query_bed_depreciation q1
FULL OUTER JOIN query_store_area q2
    ON COALESCE(q1.statistics_city_name, '合计') = COALESCE(q2.statistics_city_name, '合计')
ORDER BY
    -- 严格按指定顺序：四川、重庆、深圳、杭州、南京、宁波、广州、上海、北京、合计
    FIELD(COALESCE(q2.city_name, q1.city_name_for_display),
          '四川省', '重庆市', '深圳市', '杭州市', '南京市', '宁波市', '广州市', '上海市', '北京市', '合计');



    