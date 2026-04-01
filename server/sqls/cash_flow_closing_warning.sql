      
-- 闭店预警门店列表 

WITH quarterly_store_metrics AS (
    -- 本季度数据
    SELECT CONCAT(LEFT(a.month, 4), '-Q', CEIL(RIGHT(a.month, 2) / 3))                                                          AS quarter,
           -- 记录该季度数据所涵盖的最后一个月份
           CONCAT(LEFT(MAX(a.month), 4), '年', RIGHT(MAX(a.month), 2),
                  '月')                                                                                                         AS last_month_of_quarter,
           a.city_code,
           a.city_name,
           a.store_code,
           a.store_name,
           a.opening_date,
           sum(nvl(a.main_business_income, 0))                                                                                  AS revenue,       -- 原字段：主营业务收入
           sum(nvl(a.labor_cost, 0))                                                                                            AS labor_cost,    -- 原字段：人工成本
           sum(nvl(a.fixed_rent, 0) + nvl(a.percentage_rent, 0) + nvl(a.promotion_fee, 0) +
               nvl(a.property_fee, 0))                                                                                          AS rent_cost,     -- 原字段：租金成本
           sum(nvl(a.net_cash_flow, 0))                                                                                         AS net_cash_flow, -- 原字段：现金流
           CASE
               WHEN sum(nvl(a.main_business_income, 0)) = 0 THEN NULL
               ELSE (sum(nvl(a.fixed_rent, 0) + nvl(a.percentage_rent, 0) + nvl(a.promotion_fee, 0) +
                         nvl(a.property_fee, 0) + nvl(a.labor_cost, 0)
                     )) / sum(nvl(a.main_business_income, 0))
               END                                                                                                              AS cost_ratio,    -- 原字段：当期成本占比
           row_number() over ( partition by a.store_code order by CONCAT(LEFT(a.month, 4), '-Q', CEIL(RIGHT(a.month, 2) / 3)) ) AS rn
    FROM dws_profit_store_detail_monthly a
    WHERE a.month < DATE_FORMAT(date_sub(CURDATE(), interval 1 day), '%Y-%m')
    GROUP BY a.city_code,
             a.city_name,
             a.store_code,
             a.store_name,
             a.opening_date,
             CONCAT(LEFT(a.month, 4), '-Q', CEIL(RIGHT(a.month, 2) / 3))),
     quarterly_metrics AS (
         -- 2
         SELECT a.store_code,
                b.quarter,
                b.month,
                a.depreciation_charge      as total_depreciation,      -- 原字段：总折旧
                b.cum_net_cash_flow_mgmt as cum_net_cash_flow_mgmt -- 原字段：累计经营现金流
         FROM tmp_store_depreciation_charge a
                  LEFT JOIN (SELECT store_code,
                                    month,
                                    cum_net_cash_flow_mgmt,
                                    CONCAT(LEFT(month, 4), '-Q', CEIL(RIGHT(month, 2) / 3))                                                                    as quarter,
                                    ROW_NUMBER() OVER ( PARTITION BY store_code, CONCAT(LEFT(month, 4), '-Q', CEIL(RIGHT(month, 2) / 3)) ORDER BY month DESC ) AS rn
                             FROM dws_profit_store_detail_monthly
                             WHERE month < DATE_FORMAT(date_sub(CURDATE(), interval 1 day), '%Y-%m')) b
                            ON a.store_code = b.store_code AND b.rn = 1),
     calculated_results AS (SELECT q.quarter,
                                   q.last_month_of_quarter,
                                   q.city_code,
                                   q.city_name,
                                   q.store_code,
                                   q.store_name,
                                   q.opening_date,
                                   q.revenue,
                                   q.labor_cost,
                                   q.rent_cost,
                                   q.net_cash_flow,
                                   q.cost_ratio,
                                   -- 上季度财务指标与占比（更新为租金成本）
                                   LAG(q.revenue, 1) OVER ( PARTITION BY q.store_code ORDER BY q.rn )    AS revenue_last_quarter,           -- 原字段：上季度主营业务收入
                                   LAG(q.labor_cost, 1) OVER ( PARTITION BY q.store_code ORDER BY q.rn ) AS labor_cost_last_quarter,        -- 原字段：上季度人工成本
                                   LAG(q.rent_cost, 1) OVER ( PARTITION BY q.store_code ORDER BY q.rn )  AS rent_cost_last_quarter,         -- 原字段：上季度租金成本
                                   LAG(q.cost_ratio, 1) OVER ( PARTITION BY q.store_code ORDER BY q.rn ) AS cost_ratio_last_quarter,        -- 原字段：上季度成本占比
                                   -- 上上季度财务指标与占比（更新为租金成本）
                                   LAG(q.revenue, 2) OVER ( PARTITION BY q.store_code ORDER BY q.rn )    AS revenue_prev_last_quarter,      -- 原字段：上上季度主营业务收入
                                   LAG(q.labor_cost, 2) OVER ( PARTITION BY q.store_code ORDER BY q.rn ) AS labor_cost_prev_last_quarter,   -- 原字段：上上季度人工成本
                                   LAG(q.rent_cost, 2) OVER ( PARTITION BY q.store_code ORDER BY q.rn )  AS rent_cost_prev_last_quarter,    -- 原字段：上上季度租金成本
                                   LAG(q.cost_ratio, 2) OVER ( PARTITION BY q.store_code ORDER BY q.rn ) AS cost_ratio_prev_last_quarter,   -- 原字段：上上季度成本占比
                                   qm.total_depreciation,
                                   qm.cum_net_cash_flow_mgmt,
                                   (qm.cum_net_cash_flow_mgmt / NULLIF(qm.total_depreciation, 0))      as cumulative_cash_flow_loss_ratio -- 原字段：累计现金流亏损占比
                            FROM quarterly_store_metrics q
                                     LEFT JOIN quarterly_metrics qm
                                               ON q.quarter = qm.quarter AND q.store_code = qm.store_code),
     ramp_up_end_quarter AS (SELECT store_code,
                                    store_name,
                                    opening_date,
                                    ramp_up_period,
                                    -- 1. 爬坡期结束日期
                                    DATE_ADD(opening_date,
                                             INTERVAL (CASE
                                                           WHEN DAYOFMONTH(opening_date) > 15 THEN ramp_up_period + 1
                                                           ELSE ramp_up_period END) - 1 MONTH
                                    ) AS ramp_up_end_date,
                                    -- 2. 🔥 修正版：手动拼接季度，避免 %q 兼容问题
                                    CONCAT(YEAR(DATE_ADD(opening_date,
                                                         INTERVAL (CASE
                                                                       WHEN DAYOFMONTH(opening_date) > 15
                                                                           THEN ramp_up_period + 1
                                                                       ELSE ramp_up_period END) + 8 MONTH
                                                )), '-Q',
                                           QUARTER(DATE_ADD(opening_date,
                                                            INTERVAL (CASE
                                                                          WHEN DAYOFMONTH(opening_date) > 15
                                                                              THEN ramp_up_period + 1
                                                                          ELSE ramp_up_period END) + 8 MONTH
                                                   ))
                                    ) AS ramp_up_end_quarter
                             FROM dws_new_store_commission_monthly a
                             WHERE ramp_up_month_count IS NULL
                             GROUP BY store_code, store_name, ramp_up_period, opening_date
                             ORDER BY opening_date DESC)

SELECT res.quarter                                                      as quarter,                         -- 原字段：季度
       res.last_month_of_quarter                                        as quarter_end_month,               -- 原字段：季度末月份
       dc.statistics_city_name                                          as city_name,                       -- 原字段：城市名称
       res.store_name                                                   as store_name,                      -- 原字段：门店名称
       res.store_code                                                   as store_code,                      -- 原字段：门店编码
       res.opening_date                                                 as opening_date,                    -- 原字段：开业日期
       m.city_manager_name                                              as city_manager_name,               -- 原字段：城市总姓名
       m.technology_vice_name                                           as technology_vice_name,            -- 原字段：技术副总姓名
       -- 本季度指标
       res.revenue                                                      as revenue_current_quarter,         -- 原字段：主营业务收入（本季度完整月份）
       res.labor_cost                                                   as labor_cost_current_quarter,      -- 原字段：人工成本（本季度完整月份）
       res.rent_cost                                                    as rent_cost_current_quarter,       -- 原字段：租金成本（本季度完整月份）
       res.net_cash_flow                                                as net_cash_flow_current_quarter,   -- 原字段：现金流（本季度完整月份）
       CONCAT(ROUND(nvl(res.cost_ratio, 0) * 100, 1), '%')              as cost_ratio_current_quarter,      -- 原字段：当期成本占比（本季度完整月份）
       -- 上季度指标展示
       res.revenue_last_quarter                                         as revenue_last_quarter,            -- 原字段：上季度主营业务收入
       res.labor_cost_last_quarter                                      as labor_cost_last_quarter,         -- 原字段：上季度人工成本
       res.rent_cost_last_quarter                                       as rent_cost_last_quarter,          -- 原字段：上季度租金成本
       CONCAT(ROUND(nvl(res.cost_ratio_last_quarter, 0) * 100, 1), '%') as cost_ratio_last_quarter,         -- 原字段：上季度成本占比
       -- 上上季度指标展示
       res.revenue_prev_last_quarter                                    as revenue_prev_last_quarter,       -- 原字段：上上季度主营业务收入
       res.labor_cost_prev_last_quarter                                 as labor_cost_prev_last_quarter,    -- 原字段：上上季度人工成本
       res.rent_cost_prev_last_quarter                                  as rent_cost_prev_last_quarter,     -- 原字段：上上季度租金成本
       CONCAT(ROUND(nvl(res.cost_ratio_prev_last_quarter, 0) * 100, 1),
              '%')                                                      as cost_ratio_prev_last_quarter,    -- 原字段：上上季度成本占比
       -- 资产与现金流指标
       res.total_depreciation                                           as total_depreciation,              -- 原字段：总折旧
       res.cum_net_cash_flow_mgmt                                     as cum_net_cash_flow_mgmt,        -- 原字段：累计经营现金流
       CONCAT(ROUND(if(res.cumulative_cash_flow_loss_ratio<0,-cumulative_cash_flow_loss_ratio, null) * 100, 1),
              '%')                                                      as cumulative_cash_flow_loss_ratio, -- 原字段：累计现金流亏损占比
       CASE
           WHEN (res.cost_ratio > 1 AND res.cost_ratio_last_quarter > 1 AND res.cost_ratio_prev_last_quarter > 1 and
                 res.quarter >= rq.ramp_up_end_quarter)
               AND (res.cum_net_cash_flow_mgmt < 0 AND -res.cum_net_cash_flow_mgmt > res.total_depreciation * 0.5)
               THEN '连续三个季度人工+租金成本占比超过 100% 且 累计现金流亏损超过折旧的 50%'
           WHEN (res.cost_ratio > 1 AND res.cost_ratio_last_quarter > 1 AND res.cost_ratio_prev_last_quarter > 1 and
                 res.quarter >= rq.ramp_up_end_quarter)
               THEN '连续三个季度人工+租金成本占比超过 100%'
           WHEN (res.cum_net_cash_flow_mgmt < 0 AND -res.cum_net_cash_flow_mgmt > res.total_depreciation * 0.5)
               THEN '累计现金流亏损超过折旧的 50%'
           ELSE ''
           END                                                          AS warning_reason                   -- 原字段：预警原因
FROM calculated_results res
         LEFT JOIN tmp_manager_store_mapping m ON res.store_code = m.store_code
         LEFT JOIN dm_city dc ON res.city_code = dc.city_code
         left join ramp_up_end_quarter rq on rq.store_code = res.store_code
WHERE
    -- 动态筛选：始终取数据集中最新的一个季度
    res.quarter= CONCAT( YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)), '-Q', QUARTER(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)))
    and  ((res.cost_ratio > 1 AND res.cost_ratio_last_quarter > 1 AND res.cost_ratio_prev_last_quarter > 1 and res.quarter >= rq.ramp_up_end_quarter)
        OR (res.cum_net_cash_flow_mgmt < 0 AND -res.cum_net_cash_flow_mgmt > res.total_depreciation * 0.5))
ORDER BY res.quarter,res.city_code,
         res.store_code ;

    