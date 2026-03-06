export default {
  revenueColumn: 'total_revenue',
  netProfitColumn: 'total_profit',
  categories: [
    { name: '服务费', columns: ['service_fee'] },
    { 
      name: '人工成本', 
      subCategories: [
        { 
          name: '推拿师成本', 
          columns: [
            'project_commission', 'overproduction_bonus', 'promotion_subsidy', 'masseur_cost_variance',
            'repeat_customer_incentive', 'masseur_reception_commission', 'recruitment_fee', 'other_subsidy',
            'masseur_housing_subsidy', 'masseur_social_security', 'masseur_shift_subsidy', 'order_refund_subsidy',
            'pre_job_training_reward', 'uniform_fee', 'dormitory_rental_cost', 'travel_expenses_supported',
            'store_dinner_expenses', 'partner_gains_beans', 'masseur_minimum_guarantee_beans'
          ] 
        },
        { 
          name: '客户经理成本', 
          columns: [
            'cleaning_salary_income', 'manager_shift_commission', 'manager_new_customer_commission',
            'manager_reception_commission', 'manager_rating_commission', 'manager_supplies_commission',
            'manager_housing_subsidy', 'manager_social_security', 'hygiene_maintenance', 'toilet_cleaning_fee',
            'room_cleaning_fee', 'overtime_subsidy', 'manager_other_subsidy'
          ] 
        }
      ]
    },
    { 
      name: '固定成本', 
      columns: ['fixed_rent', 'percentage_rent', 'promotion_fee', 'property_management_fee', 'depreciation_fee']
    },
    { 
      name: '变动成本', 
      columns: [
        'linen_purchase_fee', 'washing_fee', 'consumables_purchase_fee', 'asset_maintenance_fee',
        'offline_ad_fee', 'online_ad_fee', 'utilities_fee', 'broadband_fee', 'tax_and_surcharge',
        'other_costs', 'after_sales_cost', 'travel_expenses', 'team_building_expenses', 'monitoring_fee'
      ]
    },
    { 
      name: '所得税金额', 
      columns: ['income_tax' ]
    }
  ],
  fieldLabels: {
    // 服务费类
    'service_fee': '服务费',
    
    // 推拿师成本类
    'project_commission': '项目提成',
    'overproduction_bonus': '超产值奖金',
    'promotion_subsidy': '促销补贴',
    'masseur_cost_variance': '推拿师成本差异',
    'repeat_customer_incentive': '回头客激励',
    'masseur_reception_commission': '推拿师接待提成',
    'recruitment_fee': '招聘费',
    'other_subsidy': '其他补贴',
    'masseur_housing_subsidy': '推拿师住房补贴',
    'masseur_social_security': '推拿师社保费用',
    'masseur_shift_subsidy': '推拿师顶班补贴',
    'order_refund_subsidy': '退单补贴',
    'pre_job_training_reward': '岗前培训奖励',
    'uniform_fee': '工作服',
    'dormitory_rental_cost': '宿舍租金成本',
    'travel_expenses_supported': '外部员工支援差旅费',
    'store_dinner_expenses': '新店聚餐费用',
    'partner_gains_beans': '三级合伙人获豆',
    'masseur_minimum_guarantee_beans': '保底获豆',
    
    // 客户经理成本类
    'cleaning_salary_income': '保洁工资收入',
    'manager_shift_commission': '客户经理班次提成',
    'manager_new_customer_commission': '客户经理新客提成',
    'manager_reception_commission': '客户经理接待提成',
    'manager_rating_commission': '客户经理评价提成',
    'manager_supplies_commission': '客户经理物资提成',
    'manager_housing_subsidy': '客户经理住房补贴',
    'manager_social_security': '客户经理社保费用',
    'hygiene_maintenance': '卫生维护',
    'toilet_cleaning_fee': '打扫厕所',
    'room_cleaning_fee': '打扫房间',
    'overtime_subsidy': '加班补贴',
    'manager_other_subsidy': '客户经理其他补贴',
    
    // 固定成本类
    'fixed_rent': '固定租金',
    'percentage_rent': '提成租金',
    'promotion_fee': '推广费',
    'property_management_fee': '物管费',
    'depreciation_fee': '折旧费',
    
    // 变动成本类
    'linen_purchase_fee': '布草采购费',
    'washing_fee': '布草洗涤费',
    'consumables_purchase_fee': '消耗品采购费',
    'asset_maintenance_fee': '资产维护费',
    'offline_ad_fee': '线下广告费',
    'online_ad_fee': '线上广告费',
    'utilities_fee': '水电费',
    'broadband_fee': '宽带费',
    'tax_and_surcharge': '税金及附加费',
    'other_costs': '其他',
    'after_sales_cost': '售后费用',
    'travel_expenses': '差旅费',
    'team_building_expenses': '团建费',
    'monitoring_fee': '监控费',
    
    // 总计类
    'labor_cost': '人工成本总计',
    'fixed_cost': '固定成本总计',
    'variable_cost': '变动成本总计',
    'profit_before_tax': '税前利润',
    'income_tax': '所得税金额',
    'net_cash_flow': '经营净现金流'
  }
};
