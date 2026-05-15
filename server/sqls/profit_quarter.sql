-- 总部季度利润统计
-- 
WITH base_data AS (
    -- 第一步：基础聚合，将月度数据按季度汇总
    SELECT 
        -- 转换为 2026 Q1 格式
        concat(substr(month, 1, 4), ' Q', QUARTER(CAST(concat(month, '-01') AS DATE))) AS quarter,
        SUM(nvl(management_income, 0))          AS q_management_income,           -- 管理费收入
        SUM(nvl(rental_income, 0))              AS q_rental_income,               -- 租金收入
        SUM(nvl(goods_sales_income, 0))         AS q_goods_sales_income,          -- 商品销售收入
        SUM(nvl(total_income, 0))               AS q_total_income,                -- 收入 (总计)
        SUM(nvl(massage_home_budget, 0))        AS q_massage_home_budget,         -- 支出 - 推拿之家
        SUM(nvl(user_center_budget, 0))         AS q_user_center_budget,          -- 支出 - 用户中心
        SUM(nvl(investment_financing_budget, 0))AS q_investment_financing_budget, -- 支出 - 投融资管理
        SUM(nvl(digital_platform_budget, 0))    AS q_digital_platform_budget,     -- 支出 - 数字化平台
        SUM(nvl(labor_cost, 0))                 AS q_labor_cost,                  -- 支出 - 人工成本 (总计)
        SUM(nvl(fixed_cost, 0))                 AS q_fixed_cost,                  -- 支出 - 固定成本 (总计)
        SUM(nvl(rent_fee, 0))                   AS q_rent_fee,                    -- 支出 - 房租费
        SUM(nvl(depreciation_fee, 0))           AS q_depreciation_fee,            -- 支出 - 折旧费
        SUM(nvl(recruitment_channel_fee, 0))    AS q_recruitment_channel_fee,     -- 支出 - 招聘渠道费
        SUM(nvl(office_fee, 0))                 AS q_office_fee,                  -- 支出 - 办公费
        SUM(nvl(utilities_fee, 0))              AS q_utilities_fee,               -- 支出 - 水电费
        SUM(nvl(server_leasing_fee, 0))         AS q_server_leasing_fee,          -- 支出 - 服务器租赁
        SUM(nvl(handling_fee, 0))               AS q_handling_fee,                -- 支出 - 手续费
        SUM(nvl(tax_and_surcharge, 0))          AS q_tax_and_surcharge            -- 支出 - 税金
    FROM data_warehouse.dws_headquarters_cost_budget_monthly
    WHERE month >= '2026-01'
  AND month < DATE_FORMAT(CURDATE(), '%Y-%m')
    GROUP BY 1
)
SELECT 
    quarter AS month, -- 保持字段名一致或改为 quarter
    
    -- 收入部分
    q_management_income                                     AS total_management_income,            -- 管理费收入
    ROUND(q_management_income / NULLIF(q_total_income, 0), 6) AS total_management_income_ratio,     -- 管理费收入占比
    q_rental_income                                         AS total_rental_income,                -- 租金收入
    ROUND(q_rental_income / NULLIF(q_total_income, 0), 6)   AS total_rental_income_ratio,          -- 租金收入占比
    q_goods_sales_income                                    AS total_goods_sales_income,           -- 商品销售收入
    ROUND(q_goods_sales_income / NULLIF(q_total_income, 0), 6) AS total_goods_sales_income_ratio,  -- 商品销售收入占比
    q_total_income                                          AS total_income,                       -- 收入 (总计)
    
    -- 预算/支出中心部分 (占比分母 = 人工成本 + 固定成本)
    q_massage_home_budget                                   AS total_massage_home_budget,          -- 支出 - 推拿之家
    ROUND(q_massage_home_budget / NULLIF(q_labor_cost + q_fixed_cost, 0), 6) AS total_massage_home_budget_ratio, -- 支出 - 推拿之家占比
    q_user_center_budget                                    AS total_user_center_budget,           -- 支出 - 用户中心
    ROUND(q_user_center_budget / NULLIF(q_labor_cost + q_fixed_cost, 0), 6)  AS total_user_center_budget_ratio,  -- 支出 - 用户中心占比
    q_investment_financing_budget                           AS total_investment_financing_budget,  -- 支出 - 投融资管理
    ROUND(q_investment_financing_budget / NULLIF(q_labor_cost + q_fixed_cost, 0), 6) AS total_investment_financing_budget_ratio, -- 支出 - 投融资管理占比
    q_digital_platform_budget                               AS total_digital_platform_budget,      -- 支出 - 数字化平台
    ROUND(q_digital_platform_budget / NULLIF(q_labor_cost + q_fixed_cost, 0), 6) AS total_digital_platform_budget_ratio, -- 支出 - 数字化平台占比
    
    -- 支出明细部分
    q_labor_cost                                            AS total_labor_cost,                   -- 支出 - 人工成本 (总计)
    ROUND(q_labor_cost / NULLIF(q_labor_cost + q_fixed_cost, 0), 6) AS total_labor_cost_ratio,      -- 支出 - 人工成本占比
    q_rent_fee                                              AS total_rent_fee,                     -- 支出 - 房租费
    ROUND(q_rent_fee / NULLIF(q_labor_cost + q_fixed_cost, 0), 6)   AS total_rent_fee_ratio,       -- 支出 - 房租费占比
    q_depreciation_fee                                      AS total_depreciation_fee,             -- 支出 - 折旧费
    ROUND(q_depreciation_fee / NULLIF(q_labor_cost + q_fixed_cost, 0), 6) AS total_depreciation_fee_ratio, -- 支出 - 折旧费占比
    q_recruitment_channel_fee                               AS total_recruitment_channel_fee,      -- 支出 - 招聘渠道费
    ROUND(q_recruitment_channel_fee / NULLIF(q_labor_cost + q_fixed_cost, 0), 6) AS total_recruitment_channel_fee_ratio, -- 支出 - 招聘渠道费占比
    q_office_fee                                            AS total_office_fee,                   -- 支出 - 办公费
    ROUND(q_office_fee / NULLIF(q_labor_cost + q_fixed_cost, 0), 6)   AS total_office_fee_ratio,       -- 支出 - 办公费占比
    q_utilities_fee                                         AS total_utilities_fee,                -- 支出 - 水电费
    ROUND(q_utilities_fee / NULLIF(q_labor_cost + q_fixed_cost, 0), 6)    AS total_utilities_fee_ratio,  -- 支出 - 水电费占比
    q_server_leasing_fee                                    AS total_server_leasing_fee,           -- 支出 - 服务器租赁
    ROUND(q_server_leasing_fee / NULLIF(q_labor_cost + q_fixed_cost, 0), 6) AS total_server_leasing_fee_ratio, -- 支出 - 服务器租赁占比
    q_handling_fee                                          AS total_handling_fee,                 -- 支出 - 手续费
    ROUND(q_handling_fee / NULLIF(q_labor_cost + q_fixed_cost, 0), 6)    AS total_handling_fee_ratio,   -- 支出 - 手续费占比
    q_tax_and_surcharge                                     AS total_tax_and_surcharge,            -- 支出 - 税金
    ROUND(q_tax_and_surcharge / NULLIF(q_labor_cost + q_fixed_cost, 0), 6) AS total_tax_and_surcharge_ratio, -- 支出 - 税金占比
    
    -- 汇总项
    q_fixed_cost                                            AS total_fixed_cost,                   -- 支出 - 固定成本 (总计)
    ROUND(q_fixed_cost / NULLIF(q_labor_cost + q_fixed_cost, 0), 6)      AS total_fixed_cost_ratio,      -- 支出 - 固定成本占比
    (q_labor_cost + q_fixed_cost)                           AS total_cost,                         -- 总支出 (总计)
    (q_total_income - q_labor_cost - q_fixed_cost)          AS total_profit                        -- 总部利润

FROM base_data
ORDER BY 1;