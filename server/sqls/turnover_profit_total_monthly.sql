-- 2026年利润汇总(门店和总部一起)
SELECT all_months.month                                                        AS month,                -- 月份
       COALESCE(store.main_business_income, 0)                                 AS main_business_income, -- 营业额
       COALESCE(hq.hq_total_profit, 0)                                         AS hq_total_profit,      -- 总部利润
       -- 总部利润率（总部利润/营业额，分母为0返回0，保留4位小数）
       CASE
           WHEN COALESCE(store.main_business_income, 0) = 0 THEN 0
           ELSE ROUND(COALESCE(hq.hq_total_profit, 0) / COALESCE(store.main_business_income, 0), 4)
           END                                                                 AS hq_profit_margin,     -- 总部利润率
       COALESCE(store.store_total_profit, 0)                                   AS store_total_profit,   -- 门店利润
       -- 门店利润率（门店利润/营业额，分母为0返回0，保留4位小数）
       CASE
           WHEN COALESCE(store.main_business_income, 0) = 0 THEN 0
           ELSE ROUND(COALESCE(store.store_total_profit, 0) / COALESCE(store.main_business_income, 0), 4)
           END                                                                 AS store_profit_margin,  -- 门店利润率
       -- 合计利润（总部利润+门店利润）
       COALESCE(hq.hq_total_profit, 0) + COALESCE(store.store_total_profit, 0) AS total_profit,         -- 合计利润
       -- 合计利润率（合计利润/营业额，分母为0返回0，保留4位小数）
       CASE
           WHEN COALESCE(store.main_business_income, 0) = 0 THEN 0
           ELSE ROUND((COALESCE(hq.hq_total_profit, 0) + COALESCE(store.store_total_profit, 0)) /
                      COALESCE(store.main_business_income, 0), 4)
           END                                                                 AS total_profit_margin   -- 合计利润率
FROM (
         -- 合并两个表的所有月份（确保无遗漏）
         SELECT month
         FROM data_warehouse.dws_headquarters_cost_budget_monthly
         WHERE month BETWEEN '2026-01' AND DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m')
         GROUP BY month
         UNION
         SELECT month
         FROM data_warehouse.dws_profit_store_detail_monthly
         WHERE length(store_code) = 6
           AND month BETWEEN '2026-01' AND DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m')
         GROUP BY month) all_months
         LEFT JOIN (
    -- 总部月度利润统计子查询（移除不需要的总部收入字段）
    SELECT month,
           SUM(nvl(total_income, 0)) - SUM(nvl(labor_cost, 0)) - SUM(nvl(fixed_cost, 0)) AS hq_total_profit
    FROM data_warehouse.dws_headquarters_cost_budget_monthly
    WHERE month BETWEEN '2026-01' AND DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m')
    GROUP BY month) hq ON all_months.month = hq.month
         LEFT JOIN (
    -- 门店月度利润统计子查询
    SELECT month,
           SUM(nvl(main_business_income, 0)) AS main_business_income,
           SUM(nvl(net_profit, 0))           AS store_total_profit
    FROM data_warehouse.dws_profit_store_detail_monthly
    WHERE length(store_code) = 6
      AND month BETWEEN '2026-01' AND DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m')
    GROUP BY month) store ON all_months.month = store.month
ORDER BY all_months.month;