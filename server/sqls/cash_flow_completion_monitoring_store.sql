-- 单店现金流完成情况监视
SELECT dc.statistics_city_name                                                AS city_name,        -- '城市名称'
       a.store_code                                                           AS store_code,       -- '门店编码'
       a.store_name                                                           AS store_name,       -- '门店名称'
       SUM(a.net_cash_flow)                                                   AS actual_value,     -- '实际值'
       SUM(a.cash_flow_target)                                                AS target_value,     -- '目标值'
       SUM(a.net_cash_flow) - SUM(a.cash_flow_target)                         AS diff_value,       -- '差异值'
       IF(SUM(a.net_cash_flow) > SUM(a.cash_flow_target), '已完成', '未完成') AS conclusion,       -- '结论'
       CASE
           WHEN SUM(a.cash_flow_target) > 0 AND SUM(a.net_cash_flow) >= 0
               THEN ROUND(SUM(a.net_cash_flow) / SUM(a.cash_flow_target), 4)
           WHEN SUM(a.cash_flow_target) > 0 AND SUM(a.net_cash_flow) < 0
               THEN ROUND((SUM(a.net_cash_flow) - SUM(a.cash_flow_target)) / SUM(a.cash_flow_target), 4)
           WHEN SUM(a.cash_flow_target) < 0
               THEN ROUND(1 + (SUM(a.net_cash_flow) - SUM(a.cash_flow_target)) / ABS(SUM(a.cash_flow_target)), 4)
           ELSE NULL
           END                                                                AS completion_ratio, -- '完成比例'
       CASE
           WHEN SUM(a.cash_flow_target) = 0 AND SUM(a.net_cash_flow) > 0 THEN '超额完成（目标为0）'
           WHEN SUM(a.cash_flow_target) = 0 AND SUM(a.net_cash_flow) < 0 THEN '未完成（目标为0）'
           WHEN SUM(a.cash_flow_target) = 0 AND SUM(a.net_cash_flow) = 0 THEN '已完成'
           WHEN SUM(a.cash_flow_target) > 0 AND SUM(a.net_cash_flow) >= 0 AND
                SUM(a.net_cash_flow) / SUM(a.cash_flow_target) >= 2 THEN '超额完成'
           WHEN SUM(a.cash_flow_target) > 0 AND SUM(a.net_cash_flow) >= 0 AND
                SUM(a.net_cash_flow) / SUM(a.cash_flow_target) >= 1 THEN '已完成'
           WHEN SUM(a.cash_flow_target) > 0 AND SUM(a.net_cash_flow) >= 0 AND
                SUM(a.net_cash_flow) / SUM(a.cash_flow_target) < 1 THEN '未完成'
           WHEN SUM(a.cash_flow_target) > 0 AND SUM(a.net_cash_flow) < 0 THEN '未完成（亏损）'
           WHEN SUM(a.cash_flow_target) < 0 AND
                1 + (SUM(a.net_cash_flow) - SUM(a.cash_flow_target)) / ABS(SUM(a.cash_flow_target)) >= 1
               THEN '超额完成（扭亏）'
           WHEN SUM(a.cash_flow_target) < 0 AND
                1 + (SUM(a.net_cash_flow) - SUM(a.cash_flow_target)) / ABS(SUM(a.cash_flow_target)) < 1
               THEN '未完成（超亏）'
           ELSE '其他'
           END                                                                AS completion_status -- '完成情况描述'
FROM data_warehouse.dws_profit_store_detail_monthly a
         LEFT JOIN data_warehouse.dm_city dc
                   ON a.city_code = dc.city_code
WHERE LENGTH(a.store_code) = 6
  AND a.main_business_income > 0
  AND a.month >= '2026-01'
  AND a.month < LEFT(CURDATE(), 7)
GROUP BY dc.statistics_city_name,
         a.store_code,
         a.store_name
ORDER BY a.store_code;
