-- 年度利润统计
WITH annual_aggregate AS (
SELECT
    SUBSTR(month, 1, 4)               AS stat_year,                     -- 按年聚合：截取月份的前4位作为统计年度
    SUM(main_business_income)         AS total_revenue,                 -- 年度主营业务收入（对应原total_revenue）

    -- 服务费类
    SUM(service_fee)                  AS service_fee,                   -- 原字段：服务费-服务费

    -- 推拿师成本类
    SUM(project_commission)           AS project_commission,            -- 原字段：推拿师成本-项目提成
    SUM(over_production_bonus)        AS overproduction_bonus,          -- 原字段：推拿师成本-超产值奖金
    SUM(promotion_subsidy)            AS promotion_subsidy,             -- 原字段：推拿师成本-促销补贴
    SUM(cost_variance)                AS masseur_cost_variance,         -- 原字段：推拿师成本-推拿师成本差异
    SUM(repeat_customer_incentive)    AS repeat_customer_incentive,     -- 原字段：推拿师成本-回头客激励
    SUM(masseur_commission)           AS masseur_reception_commission,  -- 原字段：推拿师成本-推拿师接待提成
    SUM(recruitment_fee)              AS recruitment_fee,               -- 原字段：推拿师成本-招聘费
    SUM(other_subsidy_money)          AS other_subsidy,                 -- 原字段：推拿师成本-其他补贴
    SUM(tech_housing_subsidy)         AS masseur_housing_subsidy,       -- 原字段：推拿师成本-推拿师住房补贴
    SUM(tech_social_security)         AS masseur_social_security,       -- 原字段：推拿师成本-推拿师社保费用
    SUM(replace_schedule_subsidy)     AS masseur_shift_subsidy,         -- 原字段：推拿师成本-推拿师顶班补贴
    SUM(refund_subsidy)               AS order_refund_subsidy,          -- 原字段：推拿师成本-退单补贴
    SUM(pre_job_training_reward)      AS pre_job_training_reward,       -- 原字段：推拿师成本-岗前培训奖励
    SUM(uniform_fee)                  AS uniform_fee,                   -- 原字段：推拿师成本-工作服
    SUM(dormitory_rental_cost)        AS dormitory_rental_cost,         -- 原字段：推拿师成本-宿舍租金成本
    SUM(travel_expenses_supported)    AS travel_expenses_supported,     -- 原字段：推拿师成本-外部员工支援差旅费
    SUM(store_dinner_expenses)        AS store_dinner_expenses,         -- 原字段：推拿师成本-新店聚餐费用
    SUM(partner_gains_beans)          AS partner_gains_beans,           -- 原字段：推拿师成本-三级合伙人获豆
    SUM(tech_minimum_beans)           AS masseur_minimum_guarantee_beans, -- 原字段：推拿师成本-保底获豆

    -- 客户经理成本类
    SUM(cleaning_income)              AS cleaning_salary_income,        -- 原字段：客户经理成本-保洁工资收入
    SUM(shift_commission)             AS manager_shift_commission,      -- 原字段：客户经理成本-客户经理班次提成
    SUM(new_customer_commission)      AS manager_new_customer_commission, -- 原字段：客户经理成本-客户经理新客提成
    SUM(manager_reception_commission) AS manager_reception_commission,  -- 原字段：客户经理成本-客户经理接待提成
    SUM(rating_commission)            AS manager_rating_commission,     -- 原字段：客户经理成本-客户经理评价提成
    SUM(supplies_commission)          AS manager_supplies_commission,   -- 原字段：客户经理成本-客户经理物资提成
    SUM(manager_housing_subsidy)      AS manager_housing_subsidy,       -- 原字段：客户经理成本-客户经理住房补贴
    SUM(manager_social_security)      AS manager_social_security,       -- 原字段：客户经理成本-客户经理社保费用
    SUM(hygiene_maintenance)          AS hygiene_maintenance,           -- 原字段：客户经理成本-卫生维护
    SUM(clean_toilet)                 AS toilet_cleaning_fee,           -- 原字段：客户经理成本-打扫厕所
    SUM(clean_room)                   AS room_cleaning_fee,             -- 原字段：客户经理成本-打扫房间
    SUM(overtime_subsidy)             AS overtime_subsidy,              -- 原字段：客户经理成本-加班补贴
    SUM(manager_other_subsidy_money)  AS manager_other_subsidy,         -- 原字段：客户经理成本-客户经理其他补贴

    -- 固定成本类
    SUM(fixed_rent)                   AS fixed_rent,                    -- 原字段：固定成本-固定租金
    SUM(percentage_rent)              AS percentage_rent,               -- 原字段：固定成本-提成租金
    SUM(promotion_fee)                AS promotion_fee,                 -- 原字段：固定成本-推广费
    SUM(property_fee)                 AS property_management_fee,       -- 原字段：固定成本-物管费
    SUM(depreciation_fee)             AS depreciation_fee,              -- 原字段：固定成本-折旧费

    -- 变动成本类
    SUM(linen_purchase_fee)           AS linen_purchase_fee,            -- 原字段：变动成本-布草采购费
    SUM(washing_fee)                  AS washing_fee,                   -- 原字段：变动成本-布草洗涤费
    SUM(consumables_purchase_fee)     AS consumables_purchase_fee,      -- 原字段：变动成本-消耗品采购费
    SUM(asset_maintenance_fee)        AS asset_maintenance_fee,         -- 原字段：变动成本-资产维护费
    SUM(offline_ad_fee)               AS offline_ad_fee,                -- 原字段：变动成本-线下广告费
    SUM(online_ad_fee)                AS online_ad_fee,                 -- 原字段：变动成本-线上广告费
    SUM(utilities_fee)                AS utilities_fee,                 -- 原字段：变动成本-水电费
    SUM(broadband_fee)                AS broadband_fee,                 -- 原字段：变动成本-宽带费
    SUM(tax_and_surcharge)            AS tax_and_surcharge,             -- 原字段：变动成本-税金及附加费
    SUM(other_costs)                  AS other_costs,                   -- 原字段：变动成本-其他
    SUM(after_sales_cost)             AS after_sales_cost,              -- 原字段：变动成本-售后费用
    SUM(travel_expenses)              AS travel_expenses,               -- 原字段：变动成本-差旅费
    SUM(team_building_expenses)       AS team_building_expenses,        -- 原字段：变动成本-团建费
    SUM(monitoring_fee)               AS monitoring_fee,                -- 原字段：变动成本-监控费

    -- 总计类
    SUM(labor_cost)                   AS labor_cost,                    -- 原字段：总计类-人工成本总计
    SUM(fixed_cost)                   AS fixed_cost,                    -- 原字段：总计类-固定成本总计
    SUM(variable_cost)                AS variable_cost,                 -- 原字段：总计类-变动成本总计
    SUM(profit_before_tax)            AS profit_before_tax,             -- 原字段：总计类-税前利润
    SUM(income_tax)                   AS income_tax,                    -- 原字段：总计类-所得税金额
    -- SUM(net_profit)                   AS total_profit,                  -- 年度净利润（对应原total_profit）
    SUM(NVL(main_business_income,0) - NVL(service_fee,0) - NVL(income_tax,0) - round(NVL(labor_cost,0) + NVL(variable_cost,0)
                                                   + NVL(fixed_cost,0) / DAY(LAST_DAY(STR_TO_DATE(CONCAT(month, '-01'), '%Y-%m-%d')))
                                                   * CASE
                                                         WHEN DATE_FORMAT(STR_TO_DATE(CONCAT(month, '-01'), '%Y-%m-%d'), '%Y-%m')
                                                             = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m')
                                                             THEN DAY(DATE_SUB(CURDATE(), INTERVAL 1 DAY))
                                                         ELSE DAY(LAST_DAY(STR_TO_DATE(CONCAT(month, '-01'), '%Y-%m-%d')))
                                                         END,2))                   AS total_profit,                  -- 年度净利润（当前月份租金和折旧按照实际进行天数折算）
    SUM(net_cash_flow)                AS net_cash_flow                  -- 原字段：总计类-经营净现金流

FROM dws_profit_store_detail_monthly
WHERE
    month >= '2025-01'
  AND month <= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m')
  AND LENGTH(store_code) = 6
GROUP BY SUBSTR(month, 1, 4)
)
SELECT
    stat_year,
    -- 核心收入/利润字段
    total_revenue,
    total_profit,

    -- 服务费类
    service_fee,

    -- 推拿师成本类
    project_commission, overproduction_bonus, promotion_subsidy, masseur_cost_variance,
    repeat_customer_incentive, masseur_reception_commission, recruitment_fee, other_subsidy,
    masseur_housing_subsidy, masseur_social_security, masseur_shift_subsidy, order_refund_subsidy,
    pre_job_training_reward, uniform_fee, dormitory_rental_cost, travel_expenses_supported,
    store_dinner_expenses, partner_gains_beans, masseur_minimum_guarantee_beans,

    -- 客户经理成本类
    cleaning_salary_income, manager_shift_commission, manager_new_customer_commission,
    manager_reception_commission, manager_rating_commission, manager_supplies_commission,
    manager_housing_subsidy, manager_social_security, hygiene_maintenance, toilet_cleaning_fee,
    room_cleaning_fee, overtime_subsidy, manager_other_subsidy,

    -- 固定成本类
    fixed_rent, percentage_rent, promotion_fee, property_management_fee, depreciation_fee,

    -- 变动成本类
    linen_purchase_fee, washing_fee, consumables_purchase_fee, asset_maintenance_fee,
    offline_ad_fee, online_ad_fee, utilities_fee, broadband_fee, tax_and_surcharge,
    other_costs, after_sales_cost, travel_expenses, team_building_expenses, monitoring_fee,

    -- 总计类
    labor_cost, fixed_cost, variable_cost, profit_before_tax, income_tax, net_cash_flow,

    -- 1. 利润率：计算值 * 100，保留 2 位小数
    ROUND(IF(total_revenue = 0, 0, total_profit / total_revenue) * 100, 2) AS profit_rate,

    -- 2. 去年利润率：取上一年的计算结果并转换
    LAG(
        ROUND(IF(total_revenue = 0, 0, total_profit / total_revenue) * 100, 2)
    ) OVER (ORDER BY stat_year) AS last_year_profit_rate,

    -- 3. 利润同比：计算增长率 * 100，保留 2 位小数
    ROUND(
        IF(
            LAG(total_profit) OVER (ORDER BY stat_year) = 0,
            NULL,
            (total_profit - LAG(total_profit) OVER (ORDER BY stat_year)) / ABS(LAG(total_profit) OVER (ORDER BY stat_year))
        ) * 100,
    2) AS yoy_growth
FROM annual_aggregate
ORDER BY stat_year DESC;