-- 新店供应总结

SELECT
    IFNULL(hidden_city_name, '合计') AS '统计城市',
    COUNT(store_code) AS '门店数量',
    -- 店均面积：城市总面积 / 门店数量
    ROUND(SUM(suite_area) / COUNT(store_code), 2) AS '店均面积',
    -- 店均床位数：城市总床位数 / 门店数量
    ROUND(SUM(bed_count) / COUNT(store_code), 2) AS '店均床位数',
    -- 单床位面积：店均面积 / 店均床位数
    ROUND(SUM(suite_area) / SUM(bed_count), 2) AS '单床位面积',
    -- 空间利用率：(店均床位数 * 10 / 店均面积) * 100%，保留整数百分数
    CONCAT(ROUND((SUM(bed_count) * 10 / SUM(suite_area)) * 100, 0), '%') AS '空间利用率'
FROM (
    -- 基础数据层：保留去重和过滤逻辑
    SELECT
        hidden_city_name,
        store_code,
        suite_area,
        bed_count,
        ROW_NUMBER() OVER (PARTITION BY store_code ORDER BY store_info_record_time DESC) AS rn
    FROM data_warehouse.dwd_store_info
    WHERE date(store_info_record_time) = date_sub(curdate(), interval 0 day)
      AND (is_invalid_store = '否' OR (opening_time >= '2026-01-01 00:00:00' AND opening_time <= NOW()))
      AND closing_date IS NULL
      AND store_name NOT LIKE '%能量%'
      AND store_operation_status IN ('正常', '营业')
      AND opening_time >= '2026-01-01 00:00:00'
) t
WHERE rn = 1
GROUP BY hidden_city_name WITH ROLLUP;