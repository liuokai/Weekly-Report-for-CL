-- 新店经营情况总结

WITH ramp_config AS (
    -- 1. 锁定 2026 年新开门店爬坡期的起点、长度、开业日期及基础信息
    SELECT
        store_code,
        store_name,
        city_code,
        city_name,
        opening_date,
        month AS start_month,
        ramp_up_period
    FROM dws_new_store_commission_monthly
    WHERE opening_date >= '2026-01-01'
      AND LEFT(month, 4) = '2026'
      AND ramp_up_month_count = 1
),
budget_agg AS (
    -- 2. 汇总该门店整个爬坡周期内的预算总额（现金流目标值）
    SELECT
        b.store_code,
        SUM(b.cash_flow_budget) AS total_cash_flow_budget
    FROM dws_store_revenue_estimate b
    INNER JOIN ramp_config r ON b.store_code = r.store_code
    WHERE (
          (CAST(LEFT(b.month, 4) AS INT) * 12 + CAST(RIGHT(b.month, 2) AS INT)) -
          (CAST(LEFT(r.start_month, 4) AS INT) * 12 + CAST(RIGHT(r.start_month, 2) AS INT)) + 1
      ) BETWEEN 1 AND r.ramp_up_period
    GROUP BY b.store_code
),
actual_agg AS (
    -- 3. 汇总截止当前月份（昨日所在月）且在爬坡期内的实际现金流
    SELECT
        a.store_code,
        SUM(a.net_cash_flow) AS actual_cash_flow_to_date
    FROM dws_profit_store_detail_monthly a
    INNER JOIN ramp_config r ON a.store_code = r.store_code
    WHERE
      ((CAST(LEFT(a.month, 4) AS INT) * 12 + CAST(RIGHT(a.month, 2) AS INT)) -
       (CAST(LEFT(r.start_month, 4) AS INT) * 12 + CAST(RIGHT(r.start_month, 2) AS INT)) + 1
      ) BETWEEN 1 AND r.ramp_up_period
      AND a.month <= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m')
    GROUP BY a.store_code
),
cost_agg AS (
    -- 4. 汇总爬坡期内（截止昨日所在月）的各项费用预算与明细实际值
    SELECT
        c.store_code,
        SUM(c.marketing_est)      AS total_marketing_est,
        SUM(c.incentive_est)      AS total_incentive_est,
        SUM(c.ad_fee)             AS total_ad_fee,
        SUM(c.group_buy_discount) AS total_group_buy_discount,
        SUM(c.offline_ad_fee)     AS total_offline_ad_fee,
        SUM(c.new_guest_discount) AS total_new_guest_discount,
        SUM(c.exhibition_fee)     AS total_exhibition_fee,
        SUM(c.masseur_commission) AS total_masseur_commission,
        SUM(c.incentive_actual)   AS total_incentive_actual
    FROM dws_new_store_ramp_up_cost_execution_statistics c
    INNER JOIN ramp_config r ON c.store_code = r.store_code
    WHERE
      ((CAST(LEFT(c.month, 4) AS INT) * 12 + CAST(RIGHT(c.month, 2) AS INT)) -
       (CAST(LEFT(r.start_month, 4) AS INT) * 12 + CAST(RIGHT(r.start_month, 2) AS INT)) + 1
      ) BETWEEN 1 AND r.ramp_up_period
      AND c.month <= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m')
    GROUP BY c.store_code
)

-- 5. 最终合并结果集
SELECT
    r.city_name                             AS city_name, -- 原字段：城市
    r.store_name                            AS store_name, -- 原字段：门店名称
    r.store_code                            AS store_code, -- 原字段：门店编码
    r.opening_date                          AS opening_date, -- 原字段：开业日期
    m.city_manager_name                     AS city_manager_name, -- 原字段：城市经理
    m.technology_vice_name                  AS tech_vice_president_name, -- 原字段：技术副总
    r.ramp_up_period                        AS ramp_up_period_months, -- 原字段：爬坡期长度
    ( (CAST(LEFT(DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m'), 4) AS INT) * 12
       + CAST(RIGHT(DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m'), 2) AS INT))
      - (CAST(LEFT(r.start_month, 4) AS INT) * 12 + CAST(RIGHT(r.start_month, 2) AS INT)) + 1
    )                                       AS current_ramp_up_month_index, -- 原字段：当前爬坡期

    -- 1. 现金流数据
    ROUND(b.total_cash_flow_budget, 2)      AS cash_flow_budget_total, -- 原字段：现金流目标值
    ROUND(COALESCE(a.actual_cash_flow_to_date, 0), 2) AS cash_flow_actual_to_date, -- 原字段：爬坡期现金流实际值
    ROUND((COALESCE(a.actual_cash_flow_to_date, 0) - b.total_cash_flow_budget), 2) AS cash_flow_variance, -- 原字段：现金流差异

    -- 2. 营销费用相关
    ROUND(COALESCE(c.total_marketing_est, 0), 2)      AS marketing_budget_total, -- 原字段：营销费预算
    ROUND(
        COALESCE(c.total_ad_fee, 0) +
        COALESCE(c.total_group_buy_discount, 0) +
        COALESCE(c.total_offline_ad_fee, 0) +
        COALESCE(c.total_new_guest_discount, 0) +
        COALESCE(c.total_exhibition_fee, 0) +
        COALESCE(c.total_masseur_commission, 0)
    , 2)                                              AS marketing_actual_total, -- 原字段：营销费合计

    -- 营销费使用率：保留1位小数的百分数格式
    CASE
        WHEN c.total_marketing_est IS NULL OR c.total_marketing_est = 0 THEN NULL
        ELSE CONCAT(ROUND(
            (COALESCE(c.total_ad_fee, 0) + COALESCE(c.total_group_buy_discount, 0) + COALESCE(c.total_offline_ad_fee, 0) +
             COALESCE(c.total_new_guest_discount, 0) + COALESCE(c.total_exhibition_fee, 0) + COALESCE(c.total_masseur_commission, 0))
            / c.total_marketing_est * 100
        , 1), '%')
    END                                               AS marketing_usage_ratio_display, -- 原字段：营销费使用率

    ROUND(COALESCE(c.total_ad_fee, 0), 2)             AS ad_fee_actual, -- 原字段：广告费
    ROUND(COALESCE(c.total_group_buy_discount, 0), 2) AS group_buy_discount_actual, -- 原字段：团购优惠
    ROUND(COALESCE(c.total_offline_ad_fee, 0), 2)     AS offline_ad_fee_actual, -- 原字段：线下广告
    ROUND(COALESCE(c.total_new_guest_discount, 0), 2) AS new_guest_discount_actual, -- 原字段：新客优惠
    ROUND(COALESCE(c.total_exhibition_fee, 0), 2)     AS exhibition_fee_actual, -- 原字段：布展
    ROUND(COALESCE(c.total_masseur_commission, 0), 2) AS masseur_commission_actual, -- 原字段：推拿师提成

    -- 3. 激励费用相关
    ROUND(COALESCE(c.total_incentive_est, 0), 2)      AS incentive_budget_total, -- 原字段：激励费预算
    ROUND(COALESCE(c.total_incentive_actual, 0), 2)   AS incentive_actual_total, -- 原字段：激励费实际

    -- 激励费使用率：保留1位小数的百分数格式
    CASE
        WHEN c.total_incentive_est IS NULL OR c.total_incentive_est = 0 THEN NULL
        ELSE CONCAT(ROUND(COALESCE(c.total_incentive_actual, 0) / c.total_incentive_est * 100, 1), '%')
    END                                               AS incentive_usage_ratio_display, -- 原字段：激励费使用率

    ROUND(COALESCE(c.total_incentive_actual, 0) - COALESCE(c.total_incentive_est, 0), 2) AS incentive_variance -- 原字段：激励费差异

FROM ramp_config r
LEFT JOIN budget_agg b ON r.store_code = b.store_code
LEFT JOIN actual_agg a ON r.store_code = a.store_code
LEFT JOIN cost_agg c ON r.store_code = c.store_code
LEFT JOIN tmp_manager_store_mapping m ON r.store_code = m.store_code
ORDER BY r.city_code, r.store_code;