-- 年度利润统计

WITH annual_aggregate AS (
    SELECT
        SUBSTR(month, 1, 4) AS stat_year,
        SUM(main_business_income) AS total_revenue,
        SUM(net_profit) AS total_profit,
        
        -- Cost Breakdown Columns (Mapped to costMapping.js)
        SUM(service_fee) AS service_fee, -- 原字段：服务费
        
        -- Labor Cost: Masseur
        SUM(project_commission) AS project_commission, -- 原字段：项目提成
        SUM(over_production_bonus) AS overproduction_bonus, -- 原字段：超产值奖金
        SUM(promotion_subsidy) AS promotion_subsidy, -- 原字段：促销补贴
        SUM(repeat_customer_incentive) AS repeat_customer_incentive, -- 原字段：回头客激励
        SUM(masseur_commission) AS masseur_reception_commission, -- 原字段：推拿师接待提成
        SUM(recruitment_fee) AS recruitment_fee, -- 原字段：招聘费
        SUM(training_fee) AS pre_job_training, -- 原字段：岗前培训
        SUM(tech_housing_subsidy) AS masseur_housing_subsidy, -- 原字段：推拿师住房补贴
        SUM(tech_social_security) AS masseur_social_security, -- 原字段：推拿师社保费用
        SUM(uniform_fee) AS uniform_fee, -- 原字段：工作服
        SUM(tech_minimum_beans) AS masseur_minimum_guarantee_beans, -- 原字段：推拿师保底补贴豆
        SUM(cost_variance) AS masseur_cost_variance, -- 原字段：推拿师成本差异
        
        -- Labor Cost: Manager
        SUM(shift_commission) AS manager_shift_commission, -- 原字段：客户经理班次提成
        SUM(new_customer_commission) AS manager_new_customer_commission, -- 原字段：客户经理新客提成
        SUM(manager_reception_commission) AS manager_reception_commission, -- 原字段：客户经理接待提成
        SUM(rating_commission) AS manager_rating_commission, -- 原字段：客户经理评价提成
        SUM(supplies_commission) AS manager_supplies_commission, -- 原字段：客户经理物资提成
        SUM(manager_housing_subsidy) AS manager_housing_subsidy, -- 原字段：客户经理住房补贴
        SUM(manager_social_security) AS manager_social_security, -- 原字段：客户经理社保费用
        SUM(manager_other_subsidy_money) AS manager_other_subsidy, -- 原字段：客户经理其他补贴
        
        -- Variable Cost: Rent
        SUM(fixed_rent) AS fixed_rent, -- 原字段：固定租金
        SUM(percentage_rent) AS percentage_rent, -- 原字段：提成租金
        SUM(property_fee) AS property_management_fee, -- 原字段：物管费
        SUM(promotion_fee) AS promotion_fee, -- 原字段：推广费
        
        -- Variable Cost: Other
        SUM(depreciation_fee) AS depreciation_fee, -- 原字段：折旧费
        SUM(linen_purchase_fee) AS linen_purchase_fee, -- 原字段：布草采购费
        SUM(washing_fee) AS washing_fee, -- 原字段：布草洗涤费
        SUM(consumables_purchase_fee) AS consumables_purchase_fee, -- 原字段：消耗品采购费
        SUM(utilities_fee) AS utilities_fee, -- 原字段：水电费
        SUM(broadband_fee) AS broadband_fee, -- 原字段：宽带费
        SUM(asset_maintenance_fee) AS asset_maintenance_fee -- 原字段：资产维护费

    FROM dws_profit_store_detail_monthly
    WHERE
        month >= '2025-01'
        AND month <= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m')
        AND LENGTH(store_code) = 6
    GROUP BY 1
)
SELECT
    stat_year,
    total_revenue,
    total_profit,
    service_fee,
    project_commission, overproduction_bonus, promotion_subsidy, repeat_customer_incentive, masseur_reception_commission, recruitment_fee, pre_job_training, masseur_housing_subsidy, masseur_social_security, uniform_fee, masseur_minimum_guarantee_beans, masseur_cost_variance,
    manager_shift_commission, manager_new_customer_commission, manager_reception_commission, manager_rating_commission, manager_supplies_commission, manager_housing_subsidy, manager_social_security, manager_other_subsidy,
    fixed_rent, percentage_rent, property_management_fee, promotion_fee,
    depreciation_fee, linen_purchase_fee, washing_fee, consumables_purchase_fee, utilities_fee, broadband_fee, asset_maintenance_fee,

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