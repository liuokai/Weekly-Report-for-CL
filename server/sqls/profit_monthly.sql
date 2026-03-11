-- 总部月度利润统计
SELECT
       SUM(management_income)                                AS total_management_income,           -- 管理费收入
       SUM(rental_income)                                    AS total_rental_income,               -- 租金收入
       SUM(goods_sales_income)                               AS total_goods_sales_income,          -- 商品销售收入
       SUM(total_income)                                     AS total_income,                      -- 收入(总计)
       SUM(massage_home_budget)                              AS total_massage_home_budget,         -- 推拿之家
       SUM(user_center_budget)                               AS total_user_center_budget,          -- 用户中心
       SUM(investment_financing_budget)                      AS total_investment_financing_budget, -- 投融资管理
       SUM(digital_platform_budget)                          AS total_digital_platform_budget,     -- 数字化平台
       SUM(labor_cost)                                       AS total_labor_cost,                  -- 人工成本(总计)
       SUM(rent_fee)                                         AS total_rent_fee,                    -- 房租费
       SUM(depreciation_fee)                                 AS total_depreciation_fee,            -- 折旧费
       SUM(recruitment_channel_fee)                          AS total_recruitment_channel_fee,     -- 招聘渠道费
       SUM(office_fee)                                       AS total_office_fee,                  -- 办公费
       SUM(utilities_fee)                                    AS total_utilities_fee,               -- 水电费
       SUM(server_leasing_fee)                               AS total_server_leasing_fee,          -- 服务器租赁
       SUM(handling_fee)                                     AS total_handling_fee,                -- 手续费
       SUM(tax_and_surcharge)                                AS total_tax_and_surcharge,           -- 税金
       SUM(fixed_cost)                                       AS total_fixed_cost,                  -- 固定成本(总计)
       SUM(labor_cost) + SUM(fixed_cost)                     AS total_cost,                        -- 总支出(总计)
       SUM(total_income) - SUM(labor_cost) - SUM(fixed_cost) AS total_profit                       -- 总部利润
FROM data_warehouse.dws_headquarters_cost_budget_monthly
where month between '2026-01' and date_format(now(),'%Y-%m')