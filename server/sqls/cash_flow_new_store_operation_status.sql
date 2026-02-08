-- 新店经营情况总结：爬坡期现金流预算与实际对比

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
    WHERE opening_date > '2026-01-01'
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
      -- 属于爬坡期内
      ((CAST(LEFT(a.month, 4) AS INT) * 12 + CAST(RIGHT(a.month, 2) AS INT)) -
       (CAST(LEFT(r.start_month, 4) AS INT) * 12 + CAST(RIGHT(r.start_month, 2) AS INT)) + 1
      ) BETWEEN 1 AND r.ramp_up_period
      -- 截止到昨日所在的自然月
      AND a.month <= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m')
    GROUP BY a.store_code
)

-- 4. 最终合并结果集
SELECT
    r.city_name                             AS `城市`,
    r.store_name                            AS `门店名称`,
    r.store_code                            AS `门店编码`,
    r.opening_date                          AS `开业日期`,
    m.city_manager_name                     AS `城市经理`,
    m.technology_vice_name                  AS `技术副总`,
    r.ramp_up_period                        AS `爬坡期长度`,
    -- 计算当前月份对应的爬坡期序号
    ( (CAST(LEFT(DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m'), 4) AS INT) * 12
       + CAST(RIGHT(DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m'), 2) AS INT))
      - (CAST(LEFT(r.start_month, 4) AS INT) * 12 + CAST(RIGHT(r.start_month, 2) AS INT)) + 1
    )                                       AS `当前爬坡期`,
    ROUND(b.total_cash_flow_budget, 2)      AS `现金流目标值`,
    ROUND(COALESCE(a.actual_cash_flow_to_date, 0), 2) AS `爬坡期现金流实际值`,
    ROUND((COALESCE(a.actual_cash_flow_to_date, 0) - b.total_cash_flow_budget), 2) AS `现金流差异`
FROM ramp_config r
LEFT JOIN budget_agg b ON r.store_code = b.store_code
LEFT JOIN actual_agg a ON r.store_code = a.store_code
-- 关联管理人员映射表
LEFT JOIN tmp_manager_store_mapping m ON r.store_code = m.store_code
ORDER BY r.city_code, r.store_code;
