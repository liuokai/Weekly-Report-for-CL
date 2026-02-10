-- 月度利润详情

WITH
-- 1. 实际值表：保留所有原始字段，并根据文件逻辑预计算汇总项
actual_data AS (
    select
        month                                 as `统计月份`,
        store_code                            as `门店编码`,
        case city_name
            when '德阳市' then '成都市'
            when '绵阳市' then '成都市'
            when '广汉市' then '成都市'
        else city_name
        end                                   as `城市名称`,
        store_name                            as `门店名称`,
        opening_date                          as `门店开业日期`,
        main_business_income                  as `主营业务收入`,
        service_fee                           as `服务费`,
        project_commission                    as `项目提成`,
        over_production_bonus                 as `超产值奖金`,
        promotion_subsidy                     as `促销补贴`,
        incentive_fee                         as `激励费用`,
        repeat_customer_incentive             as `回头客激励`,
        masseur_commission                    as `推拿师接待提成`,
        recruitment_fee                      as `招聘费`,
        training_fee                         as `岗前培训`,
        tech_housing_subsidy                 as `推拿师住房补贴`,
        tech_social_security                 as `推拿师社保费用`,
        uniform_fee                          as `工作服`,
        shift_commission                     as `客户经理班次提成`,
        new_customer_commission              as `客户经理新客提成`,
        manager_reception_commission         as `客户经理接待提成`,
        rating_commission                    as `客户经理评价提成`,
        supplies_commission                  as `客户经理物资提成`,
        manager_housing_subsidy              as `客户经理住房补贴`,
        manager_social_security              as `客户经理社保费用`,
        hygiene_maintenance                  as `卫生维护`,
        clean_toilet                         as `打扫厕所`,
        clean_room                           as `打扫房间`,
        overtime_subsidy                     as `加班补贴`,
        fixed_rent                           as `固定租金`,
        percentage_rent                     as `提成租金`,
        promotion_fee                        as `推广费`,
        property_fee                         as `物管费`,
        depreciation_fee                     as `折旧费`,
        linen_purchase_fee                   as `布草采购费`,
        consumables_purchase_fee             as `消耗品采购费`,
        asset_maintenance_fee                as `资产维护费`,
        offline_ad_fee                       as `线下广告费`,
        online_ad_fee                        as `线上广告费`,
        utilities_fee                        as `水电费`,
        broadband_fee                        as `宽带费`,
        tax_and_surcharge                    as `税金及附加费`,
        other_costs                          as `其他费用（需备注具体内容）`,
        after_sales_cost                     as `售后费用`,
        profit_before_tax                    as `税前利润`,
        income_tax                           as `所得税金额`,
        net_profit                           as `净利润`,
        profit_rate                          as `利润率`,
        cash_flow_target                     as `现金流目标`,
        net_cash_flow                        as `经营净现金流`,
        payback_period                       as `投资回收期`,
        washing_fee                          as `布草洗涤费`,
        store_profit                         as `门店利润`,
        other_subsidy_money                  as `其他补贴`,
        replace_schedule_subsidy             as `顶班补贴`,
        refund_subsidy                       as `退单补贴`,
        pre_job_training_reward              as `岗前培训奖励`,
        cleaning_income                      as `保洁工资收入`,
        manager_other_subsidy_money          as `客户经理其他补贴`,
        labor_cost                           as `人工成本`,
        fixed_cost                           as `固定成本`,
        variable_cost                        as `变动成本`,
        store_operation_status               as `门店经营阶段`,
        bean_exchange_difference             as `常乐豆兑换差异（归属到主门店）`,
        store_dinner_expenses                as `新店聚餐费`,
        dormitory_rental_cost                as `宿舍租金成本`,
        travel_expenses_supported            as `外部支援差旅费`,
        partner_gains_beans                  as `三级合伙人获豆`,
        monitoring_fee                       as `监控费`,
        team_building_expenses               as `团建费`,
        travel_expenses                     as `差旅费`,
        tech_minimum_beans                   as `调理师保底补贴豆`,
        cost_variance                        as `推拿师成本差异`,

        -- 汇总实际值计算
        (
            coalesce(project_commission, 0) + coalesce(over_production_bonus, 0) + coalesce(promotion_subsidy, 0) +
            coalesce(repeat_customer_incentive, 0) + coalesce(masseur_commission, 0) + coalesce(recruitment_fee, 0) +
            coalesce(training_fee, 0) + coalesce(tech_housing_subsidy, 0) + coalesce(tech_social_security, 0) +
            coalesce(uniform_fee, 0) + coalesce(tech_minimum_beans, 0) + coalesce(cost_variance, 0)
        ) as `推拿师成本实际`,
        (
            coalesce(shift_commission, 0) + coalesce(new_customer_commission, 0) + coalesce(manager_reception_commission, 0) +
            coalesce(rating_commission, 0) + coalesce(supplies_commission, 0) + coalesce(manager_housing_subsidy, 0) +
            coalesce(manager_social_security, 0) + coalesce(manager_other_subsidy_money, 0)
        ) as `客户经理成本实际`
    from dws_profit_store_detail_monthly a
    where month >= '2026-01'
    AND month <= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m')
    and length(store_code) = 6
),

-- 2. 预算值与占比关联表 (B + C)
budget_final AS (
    select
        b.month as `月份`,
        b.store_code as `门店编码`,
        round(b.revenue_budget, 2) as `营业额预算`,
        round(b.profit_budget, 2) as `净利润预算`,
        round(b.revenue_budget * c.average_cost, 2) as `推拿师成本预算`,
        round(b.revenue_budget * c.cost_ratio, 2) as `客户经理成本预算`,
        round(b.revenue_budget * c.service_fee, 2) as `服务费预算`,
        round(b.revenue_budget * c.material_cost, 2) as `物资成本预算`,
        round(b.revenue_budget * c.asset_maintenance_fee, 2) as `资产维护费预算`,
        round(b.revenue_budget * c.utility_fee, 2) as `水电费预算`,
        round(b.revenue_budget * c.broadband_fee, 2) as `宽带费预算`,
        round(b.revenue_budget * c.tax_and_surcharge, 2) as `税金及附加费预算`
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

-- 3. 最终汇总输出
select
    -- 基础信息
    a.`统计月份`,
    a.`门店编码`,
    a.`城市名称`,
    a.`门店名称`,
    a.`门店开业日期`,
    -- 【预算项目区】按：预算、实际、差异 顺序展示
    -- 1. 营业额
    bf.`营业额预算`,
    round(a.`主营业务收入`, 2) as `营业额实际`,
    round(a.`主营业务收入` - bf.`营业额预算`, 2) as `营业额差异`,

    -- 2. 利润
    bf.`净利润预算`,
    round(a.`净利润`, 2) as `净利润实际`,
    round(a.`净利润` - bf.`净利润预算`, 2) as `净利润差异`,

    -- 3. 推拿师成本
    bf.`推拿师成本预算`,
    round(a.`推拿师成本实际`, 2) as `推拿师成本实际`,
    round(a.`推拿师成本实际` - bf.`推拿师成本预算`, 2) as `推拿师成本差异`,

    -- 4. 客户经理成本
    bf.`客户经理成本预算`,
    round(a.`客户经理成本实际`, 2) as `客户经理成本实际`,
    round(a.`客户经理成本实际` - bf.`客户经理成本预算`, 2) as `客户经理成本差异`,

    -- 5. 服务费
    bf.`服务费预算`,
    round(a.`服务费`, 2) as `服务费实际`,
    round(a.`服务费` - bf.`服务费预算`, 2) as `服务费差异`,

    -- 6. 物资成本 (实际对应：消耗品采购费)
    bf.`物资成本预算`,
    round(a.`消耗品采购费`, 2) as `物资成本实际`,
    round(a.`消耗品采购费` - bf.`物资成本预算`, 2) as `物资成本差异`,

    -- 7. 资产维护费
    bf.`资产维护费预算`,
    round(a.`资产维护费`, 2) as `资产维护费实际`,
    round(a.`资产维护费` - bf.`资产维护费预算`, 2) as `资产维护费差异`,

    -- 8. 水电费
    bf.`水电费预算`,
    round(a.`水电费`, 2) as `水电费实际`,
    round(a.`水电费` - bf.`水电费预算`, 2) as `水电费差异`,

    -- 9. 宽带费
    bf.`宽带费预算`,
    round(a.`宽带费`, 2) as `宽带费实际`,
    round(a.`宽带费` - bf.`宽带费预算`, 2) as `宽带费差异`,

    -- 10. 税金及附加费
    bf.`税金及附加费预算`,
    round(a.`税金及附加费`, 2) as `税金及附加费实际`,
    round(a.`税金及附加费` - bf.`税金及附加费预算`, 2) as `税金及附加费差异`,

    -- 【非预算实际值区】展示 actual_data 中剩余的其他字段

    a.`项目提成`,
    a.`超产值奖金`,
    a.`促销补贴`,
    a.`激励费用`,
    a.`回头客激励`,
    a.`推拿师接待提成`,
    a.`招聘费`,
    a.`岗前培训`,
    a.`推拿师住房补贴`,
    a.`推拿师社保费用`,
    a.`工作服`,
    a.`客户经理班次提成`,
    a.`客户经理新客提成`,
    a.`客户经理接待提成`,
    a.`客户经理评价提成`,
    a.`客户经理物资提成`,
    a.`客户经理住房补贴`,
    a.`客户经理社保费用`,
    a.`卫生维护`,
    a.`打扫厕所`,
    a.`打扫房间`,
    a.`加班补贴`,
    a.`固定租金`,
    a.`提成租金`,
    a.`推广费`,
    a.`物管费`,
    a.`折旧费`,
    a.`布草采购费`,
    a.`线下广告费`,
    a.`线上广告费`,
    a.`其他费用（需备注具体内容）`,
    a.`售后费用`,
    a.`税前利润`,
    a.`所得税金额`,
    a.`利润率` as `实际利润率`,
    a.`现金流目标`,
    a.`经营净现金流`,
    a.`投资回收期`,
    a.`布草洗涤费`,
    a.`门店利润`,
    a.`其他补贴`,
    a.`顶班补贴`,
    a.`退单补贴`,
    a.`岗前培训奖励`,
    a.`保洁工资收入`,
    a.`客户经理其他补贴`,
    a.`人工成本`,
    a.`固定成本`,
    a.`变动成本`,
    a.`门店经营阶段`,
    a.`常乐豆兑换差异（归属到主门店）`,
    a.`新店聚餐费`,
    a.`宿舍租金成本`,
    a.`外部支援差旅费`,
    a.`三级合伙人获豆`,
    a.`监控费`,
    a.`团建费`,
    a.`差旅费`,
    a.`调理师保底补贴豆`,
    a.`推拿师成本差异` as `原始表推拿师成本差异`

from actual_data a
left join budget_final bf on a.`门店编码` = bf.`门店编码` and a.`统计月份` = bf.`月份`;