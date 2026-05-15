SELECT
        -- 判断是否为合计行，是则显示'合计'，否则显示城市名
        IF(GROUPING(statistics_city_name) = 1, '合计', statistics_city_name) AS '城市',

        -- 总部提取管理费
        CASE WHEN SUM(NVL(main_business_income, 0)) = 0 THEN 0 ELSE ROUND(SUM(NVL(service_fee, 0)) / SUM(NVL(main_business_income, 0)), 6) END AS '总部提取管理费',

        -- 人工成本-推拿师成本
        CASE WHEN SUM(NVL(main_business_income, 0)) = 0 THEN 0 ELSE ROUND(
            SUM(NVL(project_commission, 0) + NVL(over_production_bonus, 0) + NVL(promotion_subsidy, 0)-NVL(cost_variance, 0) + NVL(repeat_customer_incentive, 0) + NVL(masseur_commission, 0) +
                NVL(recruitment_fee, 0) + NVL(other_subsidy_money, 0) + NVL(tech_housing_subsidy, 0) + NVL(tech_social_security, 0) + NVL(replace_schedule_subsidy, 0) + NVL(refund_subsidy, 0) +
                NVL(pre_job_training_reward, 0) + NVL(uniform_fee, 0) + NVL(dormitory_rental_cost, 0) + NVL(travel_expenses_supported, 0) + NVL(store_dinner_expenses, 0) +
                NVL(partner_gains_beans, 0) + NVL(tech_minimum_beans, 0) + NVL(part_time_job_cost, 0)) / SUM(NVL(main_business_income, 0)), 6) END AS '人工成本-推拿师成本',

        -- 人工成本-后台成本
        CASE WHEN SUM(NVL(main_business_income, 0)) = 0 THEN 0 ELSE ROUND(
            SUM(NVL(cleaning_income, 0) + NVL(shift_commission, 0) + NVL(new_customer_commission, 0) + NVL(manager_reception_commission, 0) + NVL(rating_commission, 0) + NVL(supplies_commission, 0) +
                NVL(manager_housing_subsidy, 0) + NVL(manager_social_security, 0) + NVL(hygiene_maintenance, 0) + NVL(clean_toilet, 0) + NVL(clean_room, 0) + NVL(overtime_subsidy, 0) +
                NVL(manager_other_subsidy_money, 0)) / SUM(NVL(main_business_income, 0)), 6) END AS '人工成本-后台成本',

        -- 人工成本小计
        CASE WHEN SUM(NVL(main_business_income, 0)) = 0 THEN 0 ELSE ROUND(
            (SUM(NVL(project_commission, 0) + NVL(over_production_bonus, 0) + NVL(promotion_subsidy, 0)-NVL(cost_variance, 0) + NVL(repeat_customer_incentive, 0) + NVL(masseur_commission, 0) +
                 NVL(recruitment_fee, 0) + NVL(other_subsidy_money, 0) + NVL(tech_housing_subsidy, 0) + NVL(tech_social_security, 0) + NVL(replace_schedule_subsidy, 0) + NVL(refund_subsidy, 0) +
                 NVL(pre_job_training_reward, 0) + NVL(uniform_fee, 0) + NVL(dormitory_rental_cost, 0) + NVL(travel_expenses_supported, 0) + NVL(store_dinner_expenses, 0) +
                 NVL(partner_gains_beans, 0) + NVL(tech_minimum_beans, 0) + NVL(part_time_job_cost, 0)) +
             SUM(NVL(cleaning_income, 0) + NVL(shift_commission, 0) + NVL(new_customer_commission, 0) + NVL(manager_reception_commission, 0) + NVL(rating_commission, 0) + NVL(supplies_commission, 0) +
                 NVL(manager_housing_subsidy, 0) + NVL(manager_social_security, 0) + NVL(hygiene_maintenance, 0) + NVL(clean_toilet, 0) + NVL(clean_room, 0) + NVL(overtime_subsidy, 0) +
                 NVL(manager_other_subsidy_money, 0))) / SUM(NVL(main_business_income, 0)), 6) END AS '人工成本小计',

        -- 固定成本-房租成本
        CASE WHEN SUM(NVL(main_business_income, 0)) = 0 THEN 0 ELSE ROUND(SUM(NVL(fixed_rent, 0) + NVL(percentage_rent, 0) + NVL(promotion_fee, 0) + NVL(property_fee, 0)) / SUM(NVL(main_business_income, 0)), 6) END AS '固定成本-房租成本',

        -- 固定成本-折旧成本
        CASE WHEN SUM(NVL(main_business_income, 0)) = 0 THEN 0 ELSE ROUND(SUM(NVL(depreciation_fee, 0)) / SUM(NVL(main_business_income, 0)), 6) END AS '固定成本-折旧成本',

        -- 固定成本小计
        CASE WHEN SUM(NVL(main_business_income, 0)) = 0 THEN 0 ELSE ROUND((SUM(NVL(fixed_rent, 0) + NVL(percentage_rent, 0) + NVL(promotion_fee, 0) + NVL(property_fee, 0)) + SUM(NVL(depreciation_fee, 0))) / SUM(NVL(main_business_income, 0)), 6) END AS '固定成本小计',

        -- 变动成本-物资成本
        CASE WHEN SUM(NVL(main_business_income, 0)) = 0 THEN 0 ELSE ROUND(SUM(NVL(consumables_purchase_fee, 0) + NVL(linen_purchase_fee, 0) + NVL(washing_fee, 0)) / SUM(NVL(main_business_income, 0)), 6) END AS '变动成本-物资成本',

        -- 变动成本-资产维护
        CASE WHEN SUM(NVL(main_business_income, 0)) = 0 THEN 0 ELSE ROUND(SUM( NVL(asset_maintenance_fee, 0)) / SUM(NVL(main_business_income, 0)), 6) END AS '变动成本-资产维护',

        -- 变动成本-税金
        CASE WHEN SUM(NVL(main_business_income, 0)) = 0 THEN 0 ELSE ROUND(SUM(NVL(tax_and_surcharge, 0)) / SUM(NVL(main_business_income, 0)), 6) END AS '变动成本-税金',

        -- 变动成本-水电费
        CASE WHEN SUM(NVL(main_business_income, 0)) = 0 THEN 0 ELSE ROUND(SUM(NVL(utilities_fee, 0)) / SUM(NVL(main_business_income, 0)), 6) END AS '变动成本-水电费',

        -- 变动成本-其他
        CASE WHEN SUM(NVL(main_business_income, 0)) = 0 THEN 0 ELSE ROUND(
            SUM(NVL(offline_ad_fee, 0) + NVL(broadband_fee, 0) + NVL(after_sales_cost, 0) + NVL(travel_expenses, 0) +
                NVL(team_building_expenses, 0) + NVL(monitoring_fee, 0) + NVL(other_costs, 0)) / SUM(NVL(main_business_income, 0)), 6) END AS '变动成本-其他',

        -- 变动成本小计
        CASE WHEN SUM(NVL(main_business_income, 0)) = 0 THEN 0 ELSE ROUND(
            (SUM(NVL(consumables_purchase_fee, 0) + NVL(linen_purchase_fee, 0) + NVL(washing_fee, 0) + NVL(asset_maintenance_fee, 0)) + SUM(NVL(tax_and_surcharge, 0)) +
             SUM(NVL(utilities_fee, 0)) + SUM(NVL(offline_ad_fee, 0) + NVL(broadband_fee, 0) + NVL(after_sales_cost, 0) + NVL(travel_expenses, 0) +
                   NVL(team_building_expenses, 0) + NVL(monitoring_fee, 0) + NVL(other_costs, 0))) / SUM(NVL(main_business_income, 0)), 6) END AS '变动成本小计',

        -- 利润率
        CASE WHEN SUM(NVL(main_business_income, 0)) = 0 THEN 0 ELSE ROUND(SUM(NVL(net_profit, 0)) / SUM(NVL(main_business_income, 0)), 6) END AS '利润率'
    FROM data_warehouse.dws_profit_store_detail_monthly a
    LEFT JOIN data_warehouse.dm_city b ON a.city_code = b.city_code
    WHERE length(store_code) = 6
      AND month BETWEEN ? AND ?
    GROUP BY  statistics_city_name WITH ROLLUP
