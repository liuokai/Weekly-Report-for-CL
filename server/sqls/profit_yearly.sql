-- 年度利润统计

WITH annual_aggregate AS (
    SELECT
        SUBSTR(month, 1, 4) AS stat_year,
        SUM(main_business_income) AS total_revenue,
        SUM(net_profit) AS total_profit,
        
        -- Cost Breakdown Columns (Mapped to costMapping.js)
        SUM(service_fee) AS `服务费`,
        
        -- Labor Cost: Masseur
        SUM(project_commission) AS `项目提成`,
        SUM(over_production_bonus) AS `超产值奖金`,
        SUM(promotion_subsidy) AS `促销补贴`,
        SUM(repeat_customer_incentive) AS `回头客激励`,
        SUM(masseur_commission) AS `推拿师接待提成`,
        SUM(recruitment_fee) AS `招聘费`,
        SUM(training_fee) AS `岗前培训`,
        SUM(tech_housing_subsidy) AS `推拿师住房补贴`,
        SUM(tech_social_security) AS `推拿师社保费用`,
        SUM(uniform_fee) AS `工作服`,
        SUM(tech_minimum_beans) AS `推拿师保底补贴豆`,
        SUM(cost_variance) AS `推拿师成本差异`,
        
        -- Labor Cost: Manager
        SUM(shift_commission) AS `客户经理班次提成`,
        SUM(new_customer_commission) AS `客户经理新客提成`,
        SUM(manager_reception_commission) AS `客户经理接待提成`,
        SUM(rating_commission) AS `客户经理评价提成`,
        SUM(supplies_commission) AS `客户经理物资提成`,
        SUM(manager_housing_subsidy) AS `客户经理住房补贴`,
        SUM(manager_social_security) AS `客户经理社保费用`,
        SUM(manager_other_subsidy_money) AS `客户经理其他补贴`,
        
        -- Variable Cost: Rent
        SUM(fixed_rent) AS `固定租金`,
        SUM(percentage_rent) AS `提成租金`,
        SUM(property_fee) AS `物管费`,
        SUM(promotion_fee) AS `推广费`,
        
        -- Variable Cost: Other
        SUM(depreciation_fee) AS `折旧费`,
        SUM(linen_purchase_fee) AS `布草采购费`,
        SUM(washing_fee) AS `布草洗涤费`,
        SUM(consumables_purchase_fee) AS `消耗品采购费`,
        SUM(utilities_fee) AS `水电费`,
        SUM(broadband_fee) AS `宽带费`,
        SUM(asset_maintenance_fee) AS `资产维护费`

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
    `服务费`,
    `项目提成`, `超产值奖金`, `促销补贴`, `回头客激励`, `推拿师接待提成`, `招聘费`, `岗前培训`, `推拿师住房补贴`, `推拿师社保费用`, `工作服`, `推拿师保底补贴豆`, `推拿师成本差异`,
    `客户经理班次提成`, `客户经理新客提成`, `客户经理接待提成`, `客户经理评价提成`, `客户经理物资提成`, `客户经理住房补贴`, `客户经理社保费用`, `客户经理其他补贴`,
    `固定租金`, `提成租金`, `物管费`, `推广费`,
    `折旧费`, `布草采购费`, `布草洗涤费`, `消耗品采购费`, `水电费`, `宽带费`, `资产维护费`,

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