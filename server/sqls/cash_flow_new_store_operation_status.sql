-- 新店经营情况总结
SELECT r.city_code                                                              AS city_codee,                    -- 城市编码
       r.city_name                                                              AS city_name,                     -- 城市
       r.store_name                                                             AS store_name,                    -- 门店名称
       r.store_code                                                             AS store_code,                    -- 门店编码
       r.opening_date                                                           AS opening_date,                  -- 开业日期
       m.city_manager_name                                                      AS city_manager_name,             -- 城市经理
       m.technology_vice_name                                                   AS tech_vice_president_name,      -- 技术副总
       MAX(r.city_store_order)                                                  AS city_store_order,              -- 城市门店排序
       r.ramp_up_period                                                         AS ramp_up_period_months,         -- 爬坡期长度(月)
       MAX(r.ramp_up_month_count)                                               AS current_ramp_up_month_index,   -- 当前爬坡期月数（取最大值）

       -- 1. 现金流数据（求和聚合）
       ROUND(SUM(NVL(r.cash_flow_target, 0)), 2)                                AS cash_flow_budget_total,        -- 现金流目标值（求和）
       ROUND(SUM(NVL(a.net_cash_flow, 0)), 2)                                   AS cash_flow_actual_to_date,      -- 爬坡期现金流实际值（求和）
       ROUND(SUM(NVL(a.net_cash_flow, 0)) - SUM(NVL(r.cash_flow_budget, 0)), 2) AS cash_flow_variance,            -- 现金流差异（求和后计算）

       -- 2. 营销费用相关（求和聚合）
       ROUND(SUM(NVL(c.marketing_est, 0)), 2)                                   AS marketing_budget_total,        -- 营销费预算（求和）
       ROUND(
               SUM(NVL(c.ad_fee, 0)) +
               SUM(NVL(c.group_buy_discount, 0)) +
               SUM(NVL(c.offline_ad_fee, 0)) +
               SUM(NVL(c.new_guest_discount, 0)) +
               SUM(NVL(c.exhibition_fee, 0)) +
               SUM(NVL(c.masseur_commission, 0))
           ,
               2)                                                               AS marketing_actual_total,        -- 营销费实际合计（求和后累加）

       -- 营销费使用率：sum(实际)/sum(预算) 重新计算（保留1位小数的百分数）
       CASE
           WHEN SUM(NVL(c.marketing_est, 0)) = 0 THEN '0%'
           ELSE CONCAT(ROUND(
                               (SUM(NVL(c.ad_fee, 0)) + SUM(NVL(c.group_buy_discount, 0)) +
                                SUM(NVL(c.offline_ad_fee, 0)) +
                                SUM(NVL(c.new_guest_discount, 0)) + SUM(NVL(c.exhibition_fee, 0)) +
                                SUM(NVL(c.masseur_commission, 0)))
                                   / SUM(c.marketing_est) * 100
                           , 1), '%')
           END                                                                  AS marketing_usage_ratio_display, -- 营销费使用率（sum分子/sum分母）

       -- 营销费差异值：sum(预算) - sum(实际)
       ROUND(
               SUM(NVL(c.marketing_est, 0)) -
               (SUM(NVL(c.ad_fee, 0)) + SUM(NVL(c.group_buy_discount, 0)) + SUM(NVL(c.offline_ad_fee, 0)) +
                SUM(NVL(c.new_guest_discount, 0)) + SUM(NVL(c.exhibition_fee, 0)) + SUM(NVL(c.masseur_commission, 0)))
           ,
               2)                                                               AS marketing_usage_diff,          -- 营销费差异值（求和后计算）

       -- 营销费用明细（求和聚合）
       ROUND(SUM(NVL(c.ad_fee, 0)), 2)                                          AS ad_fee_actual,                 -- 广告费实际值（求和）
       ROUND(SUM(NVL(c.group_buy_discount, 0)), 2)                              AS group_buy_discount_actual,     -- 团购优惠实际值（求和）
       ROUND(SUM(NVL(c.offline_ad_fee, 0)), 2)                                  AS offline_ad_fee_actual,         -- 线下广告实际值（求和）
       ROUND(SUM(NVL(c.new_guest_discount, 0)), 2)                              AS new_guest_discount_actual,     -- 新客优惠实际值（求和）
       ROUND(SUM(NVL(c.exhibition_fee, 0)), 2)                                  AS exhibition_fee_actual,         -- 布展费实际值（求和）
       ROUND(SUM(NVL(c.masseur_commission, 0)), 2)                              AS masseur_commission_actual,     -- 推拿师提成实际值（求和）

       -- 3. 激励费用相关（求和聚合）
       ROUND(SUM(NVL(c.incentive_est, 0)), 2)                                   AS incentive_budget_total,        -- 激励费预算（求和）
       ROUND(SUM(NVL(c.incentive_actual, 0)), 2)                                AS incentive_actual_total,        -- 激励费实际值（求和）

       -- 激励费使用率：sum(实际)/sum(预算) 重新计算（保留1位小数的百分数）
       CASE
           WHEN SUM(NVL(c.incentive_est, 0)) = 0 THEN '0%'
           ELSE CONCAT(ROUND(SUM(NVL(c.incentive_actual, 0)) / SUM(c.incentive_est) * 100, 1), '%')
           END                                                                  AS incentive_usage_ratio_display, -- 激励费使用率（sum分子/sum分母）

       -- 激励费差异值：sum(实际) - sum(预算)
       ROUND(SUM(NVL(c.incentive_actual, 0)) - SUM(NVL(c.incentive_est, 0)), 2) AS incentive_variance             -- 激励费差异值（求和后计算）

-- 纯表直接关联，无嵌套子查询
FROM data_warehouse.dws_new_store_commission_monthly r
    LEFT JOIN data_warehouse.dws_store_revenue_estimate b ON r.store_code = b.store_code AND r.month = b.month
    LEFT JOIN data_warehouse.dws_profit_store_detail_monthly a ON r.store_code = a.store_code AND r.month = a.month
    LEFT JOIN data_warehouse.dws_new_store_ramp_up_cost_execution_statistics c ON r.store_code = c.store_code AND r.month = c.month
    LEFT JOIN data_warehouse.tmp_manager_store_mapping m ON r.store_code = m.store_code

-- 所有筛选条件集中管理
WHERE r.opening_date >= '2025-01-01'
  AND r.month >= '2025-01'
  AND r.ramp_up_period >= r.ramp_up_month_count
  AND r.ramp_up_month_count > 0
  AND (a.month IS NULL OR a.month <= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m'))
  AND (c.month IS NULL OR c.month <= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m'))

-- 核心：按指定8个字段分组
GROUP BY r.city_code,r.city_name,r.store_name,r.store_code,r.opening_date,m.city_manager_name,m.technology_vice_name,r.ramp_up_period

ORDER BY r.city_code ASC NULLS LAST, r.store_code ASC NULLS LAST
;