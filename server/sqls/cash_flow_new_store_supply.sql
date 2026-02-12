-- 新店供应总结

SELECT
    IFNULL(hidden_city_name, '合计') AS city_name, -- 原字段：统计城市
    COUNT(store_code) AS store_count, -- 原字段：门店数量
    -- 店均面积：城市总面积 / 门店数量
    ROUND(SUM(suite_area) / COUNT(store_code), 2) AS avg_area_per_store, -- 原字段：店均面积
    -- 店均床位数：城市总床位数 / 门店数量
    ROUND(SUM(bed_count) / COUNT(store_code), 2) AS avg_bed_per_store, -- 原字段：店均床位数
    -- 单床位面积：店均面积 / 店均床位数
    ROUND(SUM(suite_area) / SUM(bed_count), 2) AS area_per_bed, -- 原字段：单床位面积
    -- 空间利用率：(店均床位数 * 10 / 店均面积) * 100%，保留整数百分数
    CONCAT(ROUND((SUM(bed_count) * 10 / SUM(suite_area)) * 100, 0), '%') AS space_utilization_rate -- 原字段：空间利用率
FROM (
    -- 基础数据层：保留去重和过滤逻辑
    SELECT
        a.hidden_city_name,
        a.store_code,
        a.store_name,
        a.suite_area,
        a.bed_count,
        ROW_NUMBER() OVER (PARTITION BY a.store_code ORDER BY a.store_info_record_time DESC) AS rn
    FROM data_warehouse.dwd_store_info a
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
GROUP BY hidden_city_name WITH ROLLUP;