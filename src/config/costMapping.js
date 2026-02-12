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
            'project_commission','overproduction_bonus','promotion_subsidy','repeat_customer_incentive','masseur_reception_commission',
            'recruitment_fee','pre_job_training','masseur_housing_subsidy','masseur_social_security','uniform_fee','masseur_minimum_guarantee_beans','masseur_cost_variance'
          ] 
        },
        { 
          name: '客户经理成本', 
          columns: [
            'manager_shift_commission','manager_new_customer_commission','manager_reception_commission','manager_rating_commission',
            'manager_supplies_commission','manager_housing_subsidy','manager_social_security','manager_other_subsidy'
          ] 
        }
      ]
    },
    { 
      name: '变动成本', 
      subCategories: [
        {
          name: '租金',
          columns: ['fixed_rent', 'percentage_rent', 'property_management_fee', 'promotion_fee']
        },
        {
          name: '其他',
          columns: ['depreciation_fee', 'linen_purchase_fee', 'washing_fee', 'consumables_purchase_fee', 'utilities_fee', 'broadband_fee', 'asset_maintenance_fee']
        }
      ]
    }
  ],
  fieldLabels: {
    'service_fee': '服务费',
    'project_commission': '项目提成',
    'overproduction_bonus': '超产值奖金',
    'promotion_subsidy': '促销补贴',
    'repeat_customer_incentive': '回头客激励',
    'masseur_reception_commission': '推拿师接待提成',
    'recruitment_fee': '招聘费',
    'pre_job_training': '岗前培训',
    'masseur_housing_subsidy': '推拿师住房补贴',
    'masseur_social_security': '推拿师社保费用',
    'uniform_fee': '工作服',
    'masseur_minimum_guarantee_beans': '推拿师保底补贴豆',
    'masseur_cost_variance': '推拿师成本差异',
    'manager_shift_commission': '客户经理班次提成',
    'manager_new_customer_commission': '客户经理新客提成',
    'manager_reception_commission': '客户经理接待提成',
    'manager_rating_commission': '客户经理评价提成',
    'manager_supplies_commission': '客户经理物资提成',
    'manager_housing_subsidy': '客户经理住房补贴',
    'manager_social_security': '客户经理社保费用',
    'manager_other_subsidy': '客户经理其他补贴',
    'fixed_rent': '固定租金',
    'percentage_rent': '提成租金',
    'property_management_fee': '物管费',
    'promotion_fee': '推广费',
    'depreciation_fee': '折旧费',
    'linen_purchase_fee': '布草采购费',
    'washing_fee': '布草洗涤费',
    'consumables_purchase_fee': '消耗品采购费',
    'utilities_fee': '水电费',
    'broadband_fee': '宽带费',
    'asset_maintenance_fee': '资产维护费'
  }
};
