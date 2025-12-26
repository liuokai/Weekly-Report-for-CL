select
    month                                 as `统计月份`,
    store_code                            as `门店编码`,
    case city_name
        when '德阳市' then '成都市'
        when '绵阳市' then '成都市'
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
    cost_variance                        as `推拿师成本差异`

from dws_profit_store_detail_monthly
where month = '2025-12'
  and length(store_code) = 6
