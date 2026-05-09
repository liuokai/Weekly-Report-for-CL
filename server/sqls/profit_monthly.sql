      
-- 总部月度利润统计
SELECT month,
       SUM(nvl(management_income, 0))                                                                 AS total_management_income,           -- 管理费收入
       CASE WHEN SUM(nvl(total_income, 0)) = 0 THEN 0 ELSE ROUND(SUM(nvl(management_income, 0)) / SUM(nvl(total_income, 0)), 6) END AS total_management_income_ratio,    -- 管理费收入占比
       SUM(nvl(rental_income, 0))                                                                     AS total_rental_income,               -- 租金收入
       CASE WHEN SUM(nvl(total_income, 0)) = 0 THEN 0 ELSE ROUND(SUM(nvl(rental_income, 0)) / SUM(nvl(total_income, 0)), 6) END     AS total_rental_income_ratio,         -- 租金收入占比
       SUM(nvl(goods_sales_income, 0))                                                                AS total_goods_sales_income,          -- 商品销售收入
       CASE WHEN SUM(nvl(total_income, 0)) = 0 THEN 0 ELSE ROUND(SUM(nvl(goods_sales_income, 0)) / SUM(nvl(total_income, 0)), 6) END AS total_goods_sales_income_ratio,    -- 商品销售收入占比
       SUM(nvl(total_income, 0))                                                                      AS total_income,                      -- 收入 (总计)
       SUM(nvl(massage_home_budget, 0))                                                               AS total_massage_home_budget,         -- 支出 - 推拿之家
       CASE WHEN (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))) = 0 THEN 0 ELSE ROUND(SUM(nvl(massage_home_budget, 0)) / (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))), 6) END AS total_massage_home_budget_ratio,  -- 支出 - 推拿之家占比
       SUM(nvl(user_center_budget, 0))                                                                AS total_user_center_budget,          -- 支出 - 用户中心
       CASE WHEN (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))) = 0 THEN 0 ELSE ROUND(SUM(nvl(user_center_budget, 0)) / (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))), 6) END  AS total_user_center_budget_ratio,   -- 支出 - 用户中心占比
       SUM(nvl(investment_financing_budget, 0))                                                       AS total_investment_financing_budget, -- 支出 - 投融资管理
       CASE WHEN (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))) = 0 THEN 0 ELSE ROUND(SUM(nvl(investment_financing_budget, 0)) / (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))), 6) END AS total_investment_financing_budget_ratio, -- 支出 - 投融资管理占比
       SUM(nvl(digital_platform_budget, 0))                                                           AS total_digital_platform_budget,     -- 支出 - 数字化平台
       CASE WHEN (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))) = 0 THEN 0 ELSE ROUND(SUM(nvl(digital_platform_budget, 0)) / (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))), 6) END AS total_digital_platform_budget_ratio, -- 支出 - 数字化平台占比
       SUM(nvl(labor_cost, 0))                                                                        AS total_labor_cost,                  -- 支出 - 人工成本 (总计)
       CASE WHEN (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))) = 0 THEN 0 ELSE ROUND(SUM(nvl(labor_cost, 0)) / (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))), 6) END AS total_labor_cost_ratio,             -- 支出 - 人工成本占比
       SUM(nvl(rent_fee, 0))                                                                          AS total_rent_fee,                    -- 支出 - 房租费
       CASE WHEN (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))) = 0 THEN 0 ELSE ROUND(SUM(nvl(rent_fee, 0)) / (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))), 6) END       AS total_rent_fee_ratio,               -- 支出 - 房租费占比
       SUM(nvl(depreciation_fee, 0))                                                                  AS total_depreciation_fee,            -- 支出 - 折旧费
       CASE WHEN (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))) = 0 THEN 0 ELSE ROUND(SUM(nvl(depreciation_fee, 0)) / (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))), 6) END AS total_depreciation_fee_ratio,       -- 支出 - 折旧费占比
       SUM(nvl(recruitment_channel_fee, 0))                                                           AS total_recruitment_channel_fee,     -- 支出 - 招聘渠道费
       CASE WHEN (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))) = 0 THEN 0 ELSE ROUND(SUM(nvl(recruitment_channel_fee, 0)) / (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))), 6) END AS total_recruitment_channel_fee_ratio, -- 支出 - 招聘渠道费占比
       SUM(nvl(office_fee, 0))                                                                        AS total_office_fee,                  -- 支出 - 办公费
       CASE WHEN (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))) = 0 THEN 0 ELSE ROUND(SUM(nvl(office_fee, 0)) / (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))), 6) END       AS total_office_fee_ratio,             -- 支出 - 办公费占比
       SUM(nvl(utilities_fee, 0))                                                                     AS total_utilities_fee,               -- 支出 - 水电费
       CASE WHEN (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))) = 0 THEN 0 ELSE ROUND(SUM(nvl(utilities_fee, 0)) / (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))), 6) END    AS total_utilities_fee_ratio,          -- 支出 - 水电费占比
       SUM(nvl(server_leasing_fee, 0))                                                                AS total_server_leasing_fee,          -- 支出 - 服务器租赁
       CASE WHEN (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))) = 0 THEN 0 ELSE ROUND(SUM(nvl(server_leasing_fee, 0)) / (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))), 6) END AS total_server_leasing_fee_ratio,     -- 支出 - 服务器租赁占比
       SUM(nvl(handling_fee, 0))                                                                      AS total_handling_fee,                -- 支出 - 手续费
       CASE WHEN (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))) = 0 THEN 0 ELSE ROUND(SUM(nvl(handling_fee, 0)) / (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))), 6) END    AS total_handling_fee_ratio,           -- 支出 - 手续费占比
       SUM(nvl(tax_and_surcharge, 0))                                                                 AS total_tax_and_surcharge,           -- 支出 - 税金
       CASE WHEN (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))) = 0 THEN 0 ELSE ROUND(SUM(nvl(tax_and_surcharge, 0)) / (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))), 6) END AS total_tax_and_surcharge_ratio,      -- 支出 - 税金占比
       SUM(nvl(fixed_cost, 0))                                                                        AS total_fixed_cost,                  -- 支出 - 固定成本 (总计)
       CASE WHEN (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))) = 0 THEN 0 ELSE ROUND(SUM(nvl(fixed_cost, 0)) / (SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))), 6) END      AS total_fixed_cost_ratio,             -- 支出 - 固定成本占比
       SUM(nvl(labor_cost, 0)) + SUM(nvl(fixed_cost, 0))                                              AS total_cost,                         -- 总支出 (总计)
       SUM(nvl(total_income, 0)) - SUM(nvl(labor_cost, 0)) - SUM(nvl(fixed_cost, 0))                  AS total_profit                         -- 总部利润
FROM data_warehouse.dws_headquarters_cost_budget_monthly a
WHERE month >= '2026-01'
  AND month < DATE_FORMAT(CURDATE(), '%Y-%m')
GROUP BY month
ORDER BY month;

    