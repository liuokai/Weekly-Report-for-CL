-- 月度利润详情（修正字段重命名错误，返回完整代码）
WITH
-- 1. 实际值表：修正所有字段重命名，确保AS后的别名与原始表字段名一致
actual_data AS (
    select month                        as report_month,                 -- 原字段：统计维度-统计月份
       store_code                   as store_code,                   -- 原字段：统计维度-门店编码
       case city_name
           when '德阳市' then '成都市'
           when '绵阳市' then '成都市'
           when '广汉市' then '成都市'
           else city_name
           end                      as city_name,                    -- 原字段：统计维度-城市名称
       store_name                   as store_name,                   -- 原字段：统计维度-门店名称
       opening_date                 as opening_date,                 -- 原字段：统计维度-门店开业日期
       main_business_income         as revenue,                      -- 原字段：统计维度-主营业务收入

       -- 服务费类（修正重命名，保持原始字段名）
       service_fee                  as service_fee,                  -- 原字段：服务费-服务费

       -- 推拿师成本类（修正所有重命名错误）
       project_commission           as project_commission,           -- 原字段：推拿师成本-项目提成
       over_production_bonus        as over_production_bonus,        -- 原字段：推拿师成本-超产值奖金
       promotion_subsidy            as promotion_subsidy,            -- 原字段：推拿师成本-促销补贴
       cost_variance                as cost_variance,                -- 原字段：推拿师成本-推拿师成本差异
       repeat_customer_incentive    as repeat_customer_incentive,    -- 原字段：推拿师成本-回头客激励
       masseur_commission           as masseur_commission,           -- 原字段：推拿师成本-推拿师接待提成
       recruitment_fee              as recruitment_fee,              -- 原字段：推拿师成本-招聘费
       other_subsidy_money          as other_subsidy_money,          -- 原字段：推拿师成本-其他补贴
       tech_housing_subsidy         as tech_housing_subsidy,         -- 原字段：推拿师成本-推拿师住房补贴
       tech_social_security         as tech_social_security,         -- 原字段：推拿师成本-推拿师社保费用
       replace_schedule_subsidy     as replace_schedule_subsidy,     -- 原字段：推拿师成本-推拿师顶班补贴
       refund_subsidy               as refund_subsidy,               -- 原字段：推拿师成本-退单补贴
       pre_job_training_reward      as pre_job_training_reward,      -- 原字段：推拿师成本-岗前培训奖励
       uniform_fee                  as uniform_fee,                  -- 原字段：推拿师成本-工作服
       dormitory_rental_cost        as dormitory_rental_cost,        -- 原字段：推拿师成本-宿舍租金成本
       travel_expenses_supported    as travel_expenses_supported,    -- 原字段：推拿师成本-外部员工支援差旅费
       store_dinner_expenses        as store_dinner_expenses,        -- 原字段：推拿师成本-新店聚餐费用
       partner_gains_beans          as partner_gains_beans,          -- 原字段：推拿师成本-三级合伙人获豆
       tech_minimum_beans           as tech_minimum_beans,           -- 原字段：推拿师成本-保底获豆

       -- 客户经理成本类（修正所有重命名错误）
       cleaning_income              as cleaning_income,              -- 原字段：客户经理成本-保洁工资收入
       shift_commission             as shift_commission,             -- 原字段：客户经理成本-客户经理班次提成
       new_customer_commission      as new_customer_commission,      -- 原字段：客户经理成本-客户经理新客提成
       manager_reception_commission as manager_reception_commission, -- 原字段：客户经理成本-客户经理接待提成
       rating_commission            as rating_commission,            -- 原字段：客户经理成本-客户经理评价提成
       supplies_commission          as supplies_commission,          -- 原字段：客户经理成本-客户经理物资提成
       manager_housing_subsidy      as manager_housing_subsidy,      -- 原字段：客户经理成本-客户经理住房补贴
       manager_social_security      as manager_social_security,      -- 原字段：客户经理成本-客户经理社保费用
       hygiene_maintenance          as hygiene_maintenance,          -- 原字段：客户经理成本-卫生维护
       clean_toilet                 as clean_toilet,                 -- 原字段：客户经理成本-打扫厕所
       clean_room                   as clean_room,                   -- 原字段：客户经理成本-打扫房间
       overtime_subsidy             as overtime_subsidy,             -- 原字段：客户经理成本-加班补贴
       manager_other_subsidy_money  as manager_other_subsidy_money,  -- 原字段：客户经理成本-客户经理其他补贴

       -- 固定成本类（修正所有重命名错误）
       fixed_rent                   as fixed_rent,                   -- 原字段：固定成本-固定租金
       percentage_rent              as percentage_rent,              -- 原字段：固定成本-提成租金
       promotion_fee                as promotion_fee,                -- 原字段：固定成本-推广费
       property_fee                 as property_fee,                 -- 原字段：固定成本-物管费
       depreciation_fee             as depreciation_fee,             -- 原字段：固定成本-折旧费

       -- 变动成本类（修正所有重命名错误）
       linen_purchase_fee           as linen_purchase_fee,           -- 原字段：变动成本-布草采购费
       washing_fee                  as washing_fee,                  -- 原字段：变动成本-布草洗涤费
       consumables_purchase_fee     as consumables_purchase_fee,     -- 原字段：变动成本-消耗品采购费
       asset_maintenance_fee        as asset_maintenance_fee,        -- 原字段：变动成本-资产维护费
       offline_ad_fee               as offline_ad_fee,               -- 原字段：变动成本-线下广告费
       online_ad_fee                as online_ad_fee,                -- 原字段：变动成本-线上广告费
       utilities_fee                as utilities_fee,                -- 原字段：变动成本-水电费
       broadband_fee                as broadband_fee,                -- 原字段：变动成本-宽带费
       tax_and_surcharge            as tax_and_surcharge,            -- 原字段：变动成本-税金及附加费
       other_costs                  as other_costs,                  -- 原字段：变动成本-其他
       after_sales_cost             as after_sales_cost,             -- 原字段：变动成本-售后费用
       travel_expenses              as travel_expenses,              -- 原字段：变动成本-差旅费
       team_building_expenses       as team_building_expenses,       -- 原字段：变动成本-团建费
       monitoring_fee               as monitoring_fee,               -- 原字段：变动成本-监控费

       -- 总计类（修正所有重命名错误）
       labor_cost                   as labor_cost,                   -- 原字段：总计类-人工成本总计
       fixed_cost                   as fixed_cost,                   -- 原字段：总计类-固定成本总计
       variable_cost                as variable_cost,                -- 原字段：总计类-变动成本总计
       profit_before_tax            as profit_before_tax,            -- 原字段：总计类-税前利润
       income_tax                   as income_tax,                   -- 原字段：总计类-所得税金额
       net_profit                   as net_profit,                   -- 原字段：总计类-净利润
       profit_rate                  as profit_rate,                  -- 原字段：总计类-利润率
       cash_flow_target             as cash_flow_target,             -- 原字段：总计类-现金流目标
       net_cash_flow                as net_cash_flow,                -- 原字段：总计类-经营净现金流
       payback_period               as payback_period,               -- 原字段：总计类-投资回收期
       store_profit                 as store_profit,                 -- 原字段：总计类-门店利润
       store_operation_status       as store_operation_status,       -- 原字段：总计类-门店经营阶段
       bean_exchange_difference     as bean_exchange_difference,     -- 原字段：总计类-常乐豆兑换差异（归属到主门店）
       incentive_fee                as incentive_fee,                -- 原字段：总计类-激励费用

        -- 汇总实际值计算（修正为原始表字段名）
        (
            coalesce(project_commission, 0) + coalesce(over_production_bonus, 0) + coalesce(promotion_subsidy, 0) +
            coalesce(cost_variance, 0) + coalesce(repeat_customer_incentive, 0) + coalesce(masseur_commission, 0) +
            coalesce(recruitment_fee, 0) + coalesce(other_subsidy_money, 0) + coalesce(tech_housing_subsidy, 0) +
            coalesce(tech_social_security, 0) + coalesce(replace_schedule_subsidy, 0) + coalesce(refund_subsidy, 0) +
            coalesce(pre_job_training_reward, 0) + coalesce(uniform_fee, 0) + coalesce(dormitory_rental_cost, 0) +
            coalesce(travel_expenses_supported, 0) + coalesce(store_dinner_expenses, 0) + coalesce(partner_gains_beans, 0) +
            coalesce(tech_minimum_beans, 0)
        ) as masseur_cost_actual, -- 原字段：推拿师成本-推拿师成本实际
        (
            coalesce(cleaning_income, 0) + coalesce(shift_commission, 0) + coalesce(new_customer_commission, 0) +
            coalesce(manager_reception_commission, 0) + coalesce(rating_commission, 0) + coalesce(supplies_commission, 0) +
            coalesce(manager_housing_subsidy, 0) + coalesce(manager_social_security, 0) + coalesce(hygiene_maintenance, 0) +
            coalesce(clean_toilet, 0) + coalesce(clean_room, 0) + coalesce(overtime_subsidy, 0) +
            coalesce(manager_other_subsidy_money, 0)
        ) as manager_cost_actual -- 原字段：客户经理成本-客户经理成本实际
    from dws_profit_store_detail_monthly a
    where month >= '2026-01'
      AND month <= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m')
      and length(store_code) = 6
),

-- 2. 预算值与占比关联表 (B + C)：完全保留原有逻辑，无修改
budget_final AS (
    select b.month                                              as report_month,                 -- 原字段：月份
        b.store_code                                         as store_code,                   -- 原字段：门店编码
        round(b.revenue_budget, 2)                           as revenue_budget,               -- 原字段：营业额预算
        round(b.profit_budget, 2)                            as net_profit_budget,            -- 原字段：净利润预算
        round(b.revenue_budget * c.average_cost, 2)          as masseur_cost_budget,          -- 原字段：推拿师成本预算
        round(b.revenue_budget * c.cost_ratio, 2)            as manager_cost_budget,          -- 原字段：客户经理成本预算
        round(b.revenue_budget * c.service_fee, 2)           as service_fee_budget,           -- 原字段：服务费预算
        round(b.revenue_budget * c.material_cost, 2)         as material_cost_budget,         -- 原字段：物资成本预算
        round(b.revenue_budget * c.asset_maintenance_fee, 2) as asset_maintenance_fee_budget, -- 原字段：资产维护费预算
        round(b.revenue_budget * c.utility_fee, 2)           as utility_fee_budget,           -- 原字段：水电费预算
        c.broadband_fee                                      as broadband_fee_budget,         -- 原字段：宽带费预算
        round(b.revenue_budget * c.tax_and_surcharge, 2)     as tax_and_surcharge_budget      -- 原字段：税金及附加费预算
    from dws_store_revenue_estimate b
    left join (
        select
            t1.store_code, t1.average_cost, t2.cost_ratio,
            t3.service_fee, t3.material_cost, t3.asset_maintenance_fee,
            t3.utility_fee, t3.broadband_fee, t3.tax_and_surcharge
        from dws_store_cost_statistics t1
        left join (select * from dws_store_business_manager_cost_statistics where date = date_sub(curdate(),interval 1 day)) t2 on t1.store_code = t2.store_code
        left join dws_city_profit_model_config t3 on t1.city_code = t3.city_code
        where t1.date = date_sub(curdate(),interval 1 day)
    ) c on b.store_code = c.store_code
)

-- 3. 最终汇总输出：修正所有重命名错误，保持原有逻辑
select
    -- 基础信息：完全保留
    a.report_month,                                                                                        -- 原字段：统计月份
    a.store_code,                                                                                          -- 原字段：门店编码
    a.city_name,                                                                                           -- 原字段：城市名称
    a.store_name,                                                                                          -- 原字段：门店名称
    a.opening_date,                                                                                        -- 原字段：门店开业日期
    -- 【预算项目区】：完全保留原有预算/实际/差异逻辑
    -- 1. 营业额
    bf.revenue_budget,                                                                                     -- 原字段：营业额预算
    round(a.revenue, 2)                                                 as revenue_actual,                 -- 原字段：营业额实际
    round(a.revenue - bf.revenue_budget, 2)                             as revenue_variance,               -- 原字段：营业额差异

    -- 2. 利润
    bf.net_profit_budget,                                                                                  -- 原字段：净利润预算
    round(a.net_profit, 2)                                              as net_profit_actual,              -- 原字段：净利润实际
    round(a.net_profit - bf.net_profit_budget, 2)                       as net_profit_variance,            -- 原字段：净利润差异

    -- 3. 推拿师成本
    bf.masseur_cost_budget,                                                                                -- 原字段：推拿师成本预算
    round(a.masseur_cost_actual, 2)                                     as masseur_cost_actual,            -- 原字段：推拿师成本实际
    round(a.masseur_cost_actual - bf.masseur_cost_budget, 2)            as masseur_cost_variance,          -- 原字段：推拿师成本差异

    -- 4. 客户经理成本
    bf.manager_cost_budget,                                                                                -- 原字段：客户经理成本预算
    round(a.manager_cost_actual, 2)                                     as manager_cost_actual,            -- 原字段：客户经理成本实际
    round(a.manager_cost_actual - bf.manager_cost_budget, 2)            as manager_cost_variance,          -- 原字段：客户经理成本差异

    -- 5. 服务费
    bf.service_fee_budget,                                                                                 -- 原字段：服务费预算
    round(a.service_fee, 2)                                             as service_fee_actual,             -- 原字段：服务费实际
    round(a.service_fee - bf.service_fee_budget, 2)                     as service_fee_variance,           -- 原字段：服务费差异

    -- 6. 物资成本 (实际对应：消耗品采购费)
    bf.material_cost_budget,                                                                               -- 原字段：物资成本预算
    round(a.consumables_purchase_fee, 2)                                as material_cost_actual,           -- 适配年度字段：消耗品采购费
    round(a.consumables_purchase_fee - bf.material_cost_budget, 2)      as material_cost_variance,         -- 适配年度字段

    -- 7. 资产维护费
    bf.asset_maintenance_fee_budget,                                                                       -- 原字段：资产维护费预算
    round(a.asset_maintenance_fee, 2)                                   as asset_maintenance_fee_actual,   -- 原字段：资产维护费实际
    round(a.asset_maintenance_fee - bf.asset_maintenance_fee_budget, 2) as asset_maintenance_fee_variance, -- 原字段：资产维护费差异

    -- 8. 水电费
    bf.utility_fee_budget,                                                                                 -- 原字段：水电费预算
    round(a.utilities_fee, 2)                                           as utility_fee_actual,             -- 适配年度字段：水电费
    round(a.utilities_fee - bf.utility_fee_budget, 2)                   as utility_fee_variance,           -- 适配年度字段

    -- 9. 宽带费
    bf.broadband_fee_budget,                                                                               -- 原字段：宽带费预算
    round(a.broadband_fee, 2)                                           as broadband_fee_actual,           -- 原字段：宽带费实际
    round(a.broadband_fee - bf.broadband_fee_budget, 2)                 as broadband_fee_variance,         -- 原字段：宽带费差异

    -- 10. 税金及附加费
    bf.tax_and_surcharge_budget,                                                                           -- 原字段：税金及附加费预算
    round(a.tax_and_surcharge, 2)                                       as tax_and_surcharge_actual,       -- 原字段：税金及附加费实际
    round(a.tax_and_surcharge - bf.tax_and_surcharge_budget, 2)         as tax_and_surcharge_variance,     -- 原字段：税金及附加费差异

    -- 【非预算实际值区】：修正所有重命名错误
    -- 服务费类
    a.service_fee,                            -- 原字段：服务费-服务费

    -- 推拿师成本类
    a.project_commission,                     -- 原字段：推拿师成本-项目提成
    a.over_production_bonus,                  -- 原字段：推拿师成本-超产值奖金
    a.promotion_subsidy,                      -- 原字段：推拿师成本-促销补贴
    a.cost_variance,                          -- 原字段：推拿师成本-推拿师成本差异
    a.repeat_customer_incentive,              -- 原字段：推拿师成本-回头客激励
    a.masseur_commission,                     -- 原字段：推拿师成本-推拿师接待提成
    a.recruitment_fee,                        -- 原字段：推拿师成本-招聘费
    a.other_subsidy_money,                    -- 原字段：推拿师成本-其他补贴
    a.tech_housing_subsidy,                   -- 原字段：推拿师成本-推拿师住房补贴
    a.tech_social_security,                   -- 原字段：推拿师成本-推拿师社保费用
    a.replace_schedule_subsidy,               -- 原字段：推拿师成本-推拿师顶班补贴
    a.refund_subsidy,                         -- 原字段：推拿师成本-退单补贴
    a.pre_job_training_reward,                -- 原字段：推拿师成本-岗前培训奖励
    a.uniform_fee,                            -- 原字段：推拿师成本-工作服
    a.dormitory_rental_cost,                  -- 原字段：推拿师成本-宿舍租金成本
    a.travel_expenses_supported,              -- 原字段：推拿师成本-外部员工支援差旅费
    a.store_dinner_expenses,                  -- 原字段：推拿师成本-新店聚餐费用
    a.partner_gains_beans,                    -- 原字段：推拿师成本-三级合伙人获豆
    a.tech_minimum_beans,                     -- 原字段：推拿师成本-保底获豆

    -- 客户经理成本类
    a.cleaning_income,                        -- 原字段：客户经理成本-保洁工资收入
    a.shift_commission,                       -- 原字段：客户经理成本-客户经理班次提成
    a.new_customer_commission,                -- 原字段：客户经理成本-客户经理新客提成
    a.manager_reception_commission,           -- 原字段：客户经理成本-客户经理接待提成
    a.rating_commission,                      -- 原字段：客户经理成本-客户经理评价提成
    a.supplies_commission,                    -- 原字段：客户经理成本-客户经理物资提成
    a.manager_housing_subsidy,                -- 原字段：客户经理成本-客户经理住房补贴
    a.manager_social_security,                -- 原字段：客户经理成本-客户经理社保费用
    a.hygiene_maintenance,                    -- 原字段：客户经理成本-卫生维护
    a.clean_toilet,                           -- 原字段：客户经理成本-打扫厕所
    a.clean_room,                             -- 原字段：客户经理成本-打扫房间
    a.overtime_subsidy,                       -- 原字段：客户经理成本-加班补贴
    a.manager_other_subsidy_money,            -- 原字段：客户经理成本-客户经理其他补贴

    -- 固定成本类
    a.fixed_rent,                             -- 原字段：固定成本-固定租金
    a.percentage_rent,                        -- 原字段：固定成本-提成租金
    a.promotion_fee,                          -- 原字段：固定成本-推广费
    a.property_fee,                           -- 原字段：固定成本-物管费
    a.depreciation_fee,                       -- 原字段：固定成本-折旧费

    -- 变动成本类
    a.linen_purchase_fee,                     -- 原字段：变动成本-布草采购费
    a.washing_fee,                            -- 原字段：变动成本-布草洗涤费
    a.consumables_purchase_fee,               -- 原字段：变动成本-消耗品采购费
    a.asset_maintenance_fee,                  -- 原字段：变动成本-资产维护费
    a.offline_ad_fee,                         -- 原字段：变动成本-线下广告费
    a.online_ad_fee,                          -- 原字段：变动成本-线上广告费
    a.utilities_fee,                          -- 原字段：变动成本-水电费
    a.broadband_fee,                          -- 原字段：变动成本-宽带费
    a.tax_and_surcharge,                      -- 原字段：变动成本-税金及附加费
    a.other_costs,                            -- 原字段：变动成本-其他
    a.after_sales_cost,                       -- 原字段：变动成本-售后费用
    a.travel_expenses,                        -- 原字段：变动成本-差旅费
    a.team_building_expenses,                 -- 原字段：变动成本-团建费
    a.monitoring_fee,                         -- 原字段：变动成本-监控费

    -- 总计类
    a.labor_cost,                             -- 原字段：总计类-人工成本总计
    a.fixed_cost,                             -- 原字段：总计类-固定成本总计
    a.variable_cost,                          -- 原字段：总计类-变动成本总计
    a.profit_before_tax,                      -- 原字段：总计类-税前利润
    a.income_tax,                             -- 原字段：总计类-所得税金额
    a.profit_rate as actual_profit_rate,      -- 原字段：总计类-实际利润率
    a.cash_flow_target,                       -- 原字段：总计类-现金流目标
    a.net_cash_flow,                          -- 原字段：总计类-经营净现金流
    a.payback_period,                         -- 原字段：总计类-投资回收期
    a.store_profit,                           -- 原字段：总计类-门店利润
    a.store_operation_status,                 -- 原字段：总计类-门店经营阶段
    a.bean_exchange_difference,               -- 原字段：总计类-常乐豆兑换差异（归属到主门店）
    a.incentive_fee                           -- 原字段：总计类-激励费用

from actual_data a
left join budget_final bf on a.store_code = bf.store_code and a.report_month = bf.report_month;