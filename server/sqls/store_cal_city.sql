-- 按城市维度统计门店数量

WITH date_config AS (
    -- 动态计算关键时间点
    SELECT DATE_FORMAT(NOW(), '%Y-%m')                       as this_month_str,   -- 当前月
           TIMESTAMP(CONCAT(YEAR(NOW()), '-01-01 00:00:00')) as year_start,       -- 今年年初
           DATE(CONCAT(YEAR(NOW()) - 1, '-12-31'))           as last_day_of_year, -- 去年最后一天
           NOW()                                             as current_ts -- 当前时间
),
     latest_snapshots AS (
         -- 筛选门店快照基础数据
         SELECT city_code,
                store_code,
                store_info_record_time,
                opening_time,
                closing_date,
                CASE
                    WHEN DATE(store_info_record_time) = (SELECT last_day_of_year FROM date_config)
                        THEN 'PREVIOUS_YEAR_END'
                    WHEN DATE_FORMAT(store_info_record_time, '%Y-%m') = (SELECT this_month_str FROM date_config)
                        THEN 'CURRENT_MONTH'
                    END AS period_type
         FROM dwd_store_info
         WHERE (DATE(store_info_record_time) = (SELECT last_day_of_year FROM date_config))
            OR (DATE_FORMAT(store_info_record_time, '%Y-%m') = (SELECT this_month_str FROM date_config))
             and store_operation_status in ('正常', '营业') and store_name not like '%能量舱%'),
     metrics AS (SELECT c.statistics_city_name,
                        -- 1. 门店数量：当前月最新去重门店总数
                        COUNT(DISTINCT CASE WHEN s.period_type = 'CURRENT_MONTH' THEN s.store_code END) as total_now,
                        -- 2. 去年底门店数量
                        COUNT(DISTINCT CASE
                                           WHEN s.period_type = 'PREVIOUS_YEAR_END'
                                               THEN s.store_code END)                                   as total_last_year,
                        -- 3. 今年新开门店数量：开业时间在 [今年初, 现在] 之间
                        COUNT(DISTINCT CASE
                                           WHEN s.opening_time >= (SELECT year_start FROM date_config)
                                               AND s.opening_time <= (SELECT current_ts FROM date_config)
                                               THEN s.store_code END)                                   as year_new_open_count,
                        -- 4. 今年新开门店总初始投资金额
                        -- 逻辑：仅当门店满足“今年新开”条件时，累加其投资金额
                        SUM(CASE
                                WHEN s.opening_time >= (SELECT year_start FROM date_config)
                                    AND s.opening_time <= (SELECT current_ts FROM date_config)
                                    THEN inv.initial_investment_amount
                                ELSE 0 END)                                                             as year_new_open_invest_amount,
                        -- 5. 今年闭店数量
                        COUNT(DISTINCT CASE
                                           WHEN s.closing_date >= DATE((SELECT year_start FROM date_config))
                                               AND s.closing_date <= DATE((SELECT current_ts FROM date_config))
                                               THEN s.store_code END)                                   as year_closed
                 FROM latest_snapshots s
                          LEFT JOIN dm_city c ON s.city_code = c.city_code
                     -- 关联投资金额表
                          LEFT JOIN dws_store_initial_investment inv ON s.store_code = inv.store_code
                 GROUP BY c.statistics_city_name)
SELECT IFNULL(statistics_city_name, '未知城市') AS "统计城市",
       total_now                                AS "门店数量",
       year_new_open_count                      AS "今年新开门店数量",
       year_new_open_invest_amount              AS "新开门店总投资金额",
       year_closed                              AS "今年闭店门店数量",
       (total_now - total_last_year)            AS "今年净增门店数量"
FROM metrics
WHERE statistics_city_name IS NOT NULL
ORDER BY total_now DESC;