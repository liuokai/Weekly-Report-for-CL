/**
 * 业务目标值全局配置文件
 * 
 * 用途：
 * 统一管理和配置系统中各项业务指标的目标值、预算金额等手动录入数据。
 * 
 * 使用说明：
 * 根据财务或相关部门提供的数据，直接修改对应字段的数值即可。
 * 修改后，前端页面会自动引用新的目标值进行展示和进度计算。
 */

export const BusinessTargets = {
  // =================================================================
  // 营业额概览 (Turnover Overview)
  // =================================================================
  turnover: {
    // 统计年份参数
    targetYear: "2026",
    // 本年累计营业额目标值（单位：万元）
    annualTarget: 48000,
    // 城市年度营业额目标（单位：元），按城市名称映射
    cityTargets: {
      '四川省': 167010966,
      '重庆市': 53365585,
      '深圳市': 85732032,
      '杭州市': 35037613,
      '南京市': 10168795,
      '宁波市': 5924531,
      '广州市': 27066092,
      '上海市': 43772571,
      '北京市': 57631485
    },
    
    // 预算相关配置
    budget: {
      // 年度总预算金额（单位：万元）
      total: 6678.8, 
      
      // 实际已消耗预算金额（单位：万元）
      // 注：此处为手动录入值，如后续接入自动统计接口，可废弃此字段
      used: 0
    },

    // 客单价拆解 (Price Decomposition)
    priceDecomposition: {
      // 去年平均客单价（单位：元）
      lastYearAveragePrice: 288.7,
      
      // 客单价增长率目标值（单位：百分比）
      targetGrowthRate: 3,

      // 预算相关配置
      budget: {
        amount: 1219.7, // 预算金额（单位：万元）
        labor: 543.2, // 人工（单位：万元）
        training: 676.5 // 招培（单位：万元）
      }
    },

    // 客次量拆解 (Customer Volume Decomposition)
    volumeDecomposition: {
      // 年度累计客次量目标 (单位：万人次)
      annualCumulativeTarget: 2500000,
      
      // 预算相关配置
      budget: {
        amount: 5459.09, // 预算金额（单位：万元）
        labor: 682.63, // 人工成本（单位：万元）
        cost: 4776.46 // 预算费用（单位：万元）
      }
    },

    // 客单价·影响指标分析 (Price Impact Analysis)
    impactAnalysis: {
      // 项目回头率
      projectRetention: {
        target: 30.0, // 目标值（%）
        budget: {
          wage: 138, // 人力预算（万元）
          other: 77  // 其他预算（万元）
        }
      },
      // 床位人员配置比
      bedStaffRatio: {
        target: 0.5, // 目标值
        budget: {
          wage: 100,   // 人力预算（万元）- 暂无数据，预留填空
          other: 0   // 其他预算（万元）- 暂无数据，预留填空
        }
      },
      // 新员工回头率达标率
      newEmployeeRetention: {
        target: 87.0, // 目标值（%）
        budget: {
          wage: 0,    // 人力预算（万元）- 暂无数据，预留填空
          other: 0    // 其他预算（万元）- 暂无数据，预留填空
        }
      },
      // 推拿师产值达标率
      therapistOutput: {
        target: 80.0, // 目标值（%）
        budget: {
          wage: 0,    // 人力预算（万元）- 暂无数据，预留填空
          other: 0    // 其他预算（万元）- 暂无数据，预留填空
        }
      }
    }
  },

  // =================================================================
  // 成本与利润 (Cost & Profit)
  // =================================================================
  profit: {
    // 年度利润率目标值 (单位：%) 
    annualTargetRate: 6.3,
    budgetCostRatioTable: {
      title: '预算成本占比情况',
      headerGroups: [
        { title: '总部提取管理费', subHeaders: [{ key: 'hq_fee', label: '总部提取管理费' }] },
        {
          title: '人工成本',
          subHeaders: [
            { key: 'masseur_cost', label: '推拿师成本' },
            { key: 'backstage_cost', label: '后台成本' },
            { key: 'labor_subtotal', label: '小计' }
          ]
        },
        {
          title: '固定成本',
          subHeaders: [
            { key: 'rent_cost', label: '房租成本' },
            { key: 'depreciation_cost', label: '折旧成本' },
            { key: 'fixed_subtotal', label: '小计' }
          ]
        },
        {
          title: '变动成本',
          subHeaders: [
            { key: 'material_cost', label: '物资成本' },
            { key: 'tax_cost', label: '税金' },
            { key: 'asset_maintenance', label: '资产维护' },
            { key: 'utility_cost', label: '水电费' },
            { key: 'other_cost', label: '其他' },
            { key: 'variable_subtotal', label: '小计' }
          ]
        },
        { title: '利润率', subHeaders: [{ key: 'profit_rate', label: '利润率' }] }
      ],
      rows: [
        { city: '四川省', hq_fee: '2.50%', masseur_cost: '44.07%', backstage_cost: '6.45%', labor_subtotal: '50.52%', rent_cost: '16.00%', depreciation_cost: '9.59%', fixed_subtotal: '25.59%', material_cost: '6.00%', tax_cost: '1.69%', asset_maintenance: '0.50%', utility_cost: '1.20%', other_cost: '1.00%', variable_subtotal: '9.39%', profit_rate: '12.00%' },
        { city: '重庆市', hq_fee: '2.50%', masseur_cost: '44.28%', backstage_cost: '6.50%', labor_subtotal: '50.79%', rent_cost: '16.59%', depreciation_cost: '8.74%', fixed_subtotal: '25.33%', material_cost: '6.00%', tax_cost: '1.69%', asset_maintenance: '0.50%', utility_cost: '1.20%', other_cost: '1.00%', variable_subtotal: '9.39%', profit_rate: '12.00%' },
        { city: '深圳市', hq_fee: '2.50%', masseur_cost: '44.68%', backstage_cost: '7.68%', labor_subtotal: '52.36%', rent_cost: '18.93%', depreciation_cost: '4.82%', fixed_subtotal: '23.75%', material_cost: '6.00%', tax_cost: '1.69%', asset_maintenance: '0.50%', utility_cost: '1.20%', other_cost: '1.00%', variable_subtotal: '9.39%', profit_rate: '12.00%' },
        { city: '杭州市', hq_fee: '2.50%', masseur_cost: '45.89%', backstage_cost: '7.76%', labor_subtotal: '53.65%', rent_cost: '16.84%', depreciation_cost: '5.63%', fixed_subtotal: '22.47%', material_cost: '6.00%', tax_cost: '1.69%', asset_maintenance: '0.50%', utility_cost: '1.20%', other_cost: '1.00%', variable_subtotal: '9.39%', profit_rate: '12.00%' },
        { city: '南京市', hq_fee: '2.50%', masseur_cost: '45.63%', backstage_cost: '7.32%', labor_subtotal: '52.95%', rent_cost: '14.94%', depreciation_cost: '8.22%', fixed_subtotal: '23.17%', material_cost: '6.00%', tax_cost: '1.69%', asset_maintenance: '0.50%', utility_cost: '1.20%', other_cost: '1.00%', variable_subtotal: '9.39%', profit_rate: '12.00%' },
        { city: '宁波市', hq_fee: '2.50%', masseur_cost: '45.24%', backstage_cost: '7.46%', labor_subtotal: '52.70%', rent_cost: '16.41%', depreciation_cost: '7.00%', fixed_subtotal: '23.41%', material_cost: '6.00%', tax_cost: '1.69%', asset_maintenance: '0.50%', utility_cost: '1.20%', other_cost: '1.00%', variable_subtotal: '9.39%', profit_rate: '12.00%' },
        { city: '广州市', hq_fee: '2.50%', masseur_cost: '45.81%', backstage_cost: '8.15%', labor_subtotal: '53.96%', rent_cost: '17.48%', depreciation_cost: '4.67%', fixed_subtotal: '22.15%', material_cost: '6.00%', tax_cost: '1.69%', asset_maintenance: '0.50%', utility_cost: '1.20%', other_cost: '1.00%', variable_subtotal: '9.39%', profit_rate: '12.00%' },
        { city: '上海市', hq_fee: '2.50%', masseur_cost: '48.61%', backstage_cost: '8.05%', labor_subtotal: '56.66%', rent_cost: '15.32%', depreciation_cost: '4.14%', fixed_subtotal: '19.46%', material_cost: '6.00%', tax_cost: '1.69%', asset_maintenance: '0.50%', utility_cost: '1.20%', other_cost: '1.00%', variable_subtotal: '9.39%', profit_rate: '12.00%' },
        { city: '北京市', hq_fee: '2.50%', masseur_cost: '48.61%', backstage_cost: '8.27%', labor_subtotal: '56.87%', rent_cost: '13.86%', depreciation_cost: '5.38%', fixed_subtotal: '19.24%', material_cost: '6.00%', tax_cost: '1.69%', asset_maintenance: '0.50%', utility_cost: '1.20%', other_cost: '1.00%', variable_subtotal: '9.39%', profit_rate: '12.00%' },
        { city: '合计', hq_fee: '2.50%', masseur_cost: '45.42%', backstage_cost: '7.25%', labor_subtotal: '52.68%', rent_cost: '16.39%', depreciation_cost: '6.82%', fixed_subtotal: '23.21%', material_cost: '6.00%', tax_cost: '1.69%', asset_maintenance: '0.50%', utility_cost: '1.20%', other_cost: '1.00%', variable_subtotal: '9.39%', profit_rate: '12.00%', isSummary: true }
      ]
    },
     
    // 总部成本预算 (Headquarters Cost Budget)
    headquartersBudget: {
      financial_report: {
        labor_costs: {
          category: "人工成本",
          items: [
            { name: "人工成本-投融资管理", value: 5236512, ratio: "40.4%" },
            { name: "人工成本-推拿之家", value: 5431538, ratio: "41.9%" },
            { name: "人工成本-用户中心", value: 6826335, ratio: "52.7%" },
            { name: "人工成本-IT中心", value: 7142000, ratio: "55.1%" }
          ],
          subtotal: { value: 24636385, ratio: "190.1%" }
        },
        fixed_costs: {
          category: "固定成本",
          items: [
            { name: "房租费", value: 210252.93, ratio: "1.9%" },
            { name: "折旧费", value: 47884.62, ratio: "0.4%" },
            { name: "产品研发费", value: 2504710, ratio: "30.4%" },
            { name: "招聘费", value: 1029371, ratio: "9.6%" },
            { name: "办公费", value: 909462, ratio: "7.8%" },
            { name: "水电费", value: 48000, ratio: "0.4%" },
            { name: "服务器租赁", value: 1207900, ratio: "9.9%" },
            { name: "手续费", value: 5000, ratio: "0.0%" },
            { name: "税金", value: 891603, ratio: "7.4%" }
          ],
          subtotal: { value: 6854184, ratio: "67.8%" }
        },
        summary: {
          total_expenditure: 31490569,
          headquarters_profit: -18529427
        }
      }
    }
  },

  // =================================================================
  // 门店拓展 (Store Expansion)
  // =================================================================
  store: {
    // 年度新店目标
    newStore: {
      target: 43, // 目标数量（家）
      budget: 282.7, // 预算金额（万元）
      cumulativeInvestment: 57, // 累计投资金额（万元）
      newStoreInvestment: 57, // 新店投资金额（万元）
      renovationInvestment: 0, // 重装投资金额（万元）
      // 各城市新开门店目标
      cityTargets: {
        '四川省': 3,
        '重庆市': 3,
        '深圳市': 7,
        '杭州市': 4,
        '南京市': 2,
        '广州市': 5,
        '上海市': 8,
        '北京市': 12,
        '宁波市': 0
      },
      // 各城市新店预算费用（单位：元）
      cityBudgets: {
        '四川省': 115500,
        '重庆市': 148500,
        '深圳市': 346500,
        '杭州市': 286000,
        '南京市': 143000,
        '广州市': 357500,
        '上海市': 572000,
        '北京市': 858000,
        '宁波市': 0
      }
    }
  },

  // =================================================================
  // 总部成本核算 (Headquarters Cost Accounting) - 2026年预算数据
  // =================================================================
  headquartersCostAccounting: {
    // 收入预算
    revenue: [
      { key: 'management_income',           name: "服务费收入",     value: 12142742 },
      { key: 'rental_income',               name: "租金收入",       value: 776400 },
      { key: 'goods_sales_income',          name: "商品销售收入",   value: 138000 },
      { key: 'total_income',                name: "小计",           value: 13057142 }
    ],
    // 人工成本预算
    laborCosts: [
      { key: 'investment_financing_budget', name: "人工成本-投融资管理", value: 5236512 },
      { key: 'massage_home_budget',         name: "人工成本-推拿之家",   value: 5431538 },
      { key: 'user_center_budget',          name: "人工成本-用户中心",   value: 6826335 },
      { key: 'digital_platform_budget',     name: "人工成本-IT中心",     value: 7142000 },
      { key: 'labor_cost',                  name: "小计",               value: 24636385 }
    ],
    // 固定成本预算
    fixedCosts: [
      { key: 'rent_fee',                    name: "房租费",       value: 210253 },
      { key: 'depreciation_fee',            name: "折旧费",       value: 47885 },
      { key: 'rd_training_fee',             name: "研发培训费",   value: 2504710 },
      { key: 'recruitment_channel_fee',     name: "招聘渠道费",   value: 1029371 },
      { key: 'office_fee',                  name: "办公费",       value: 909462 },
      { key: 'utilities_fee',               name: "水电费",       value: 48000 },
      { key: 'server_leasing_fee',          name: "服务器租赁",   value: 1207900 },
      { key: 'handling_fee',                name: "手续费",       value: 5000 },
      { key: 'tax_and_surcharge',           name: "税金",         value: 891603 },
      { key: 'fixed_cost',                  name: "小计",         value: 6854184 }
    ],
    // 合计与利润预算
    summary: {
      totalExpenditure: 31490569,   // 支出合计
      headquartersProfit: -18433427, // 总部利润
      storeProfit: 44660566,         // 门店利润
      annualProfit: 26227138         // 2026年利润合计
    }
  },

  // =================================================================
  // 资金结余 (Capital Balance)
  // =================================================================
  capitalBalance: {
    // 2025 年末资金结余目标
    target2025: {
      totalBalance: 46565517.46,
      // 各城市资金结余目标 (单位：元)
      cityTargets: {
        '北京市': -3800000,
        '上海市': 840000,
        '广州市': 1190000,
        '深圳市': 3970000,
        '四川省': 31660000,
        '重庆市': 7770000,
        '杭州市': 270000,
        '南京市': 50000,
        '宁波市': -170000
      }
    },
    // 新店投资预算值
    newStoreInvestmentBudget: 0,
    // 老店重装预算值
    oldStoreRenovationBudget: 0
  }
};

/**
 * 智能分析模块化配置定义
 * 用于在前端 UI 中展示可选的静态配置数据模块
 * 
 * 结构说明：
 * - key: 唯一标识符，建议以 static_ 开头
 * - name: 显示名称
 * - description: 描述信息
 * - value: 对应的数据对象（直接引用 BusinessTargets 中的子节点）
 */
export const AnalysisModules = [
  {
    key: 'static_turnover_targets',
    name: '营业额目标配置',
    description: '包含年度营业额目标及各城市目标分解',
    value: BusinessTargets.turnover
  },
  {
    key: 'static_budget',
    name: '预算配置数据',
    description: '包含年度总预算及已使用预算情况',
    value: BusinessTargets.turnover.budget
  },
  {
    key: 'static_price_decomposition',
    name: '客单价拆解配置',
    description: '包含去年平均客单价及增长率目标',
    value: BusinessTargets.turnover.priceDecomposition
  },
  {
    key: 'static_volume_decomposition',
    name: '客次量拆解配置',
    description: '包含年度累计客次量目标',
    value: BusinessTargets.turnover.volumeDecomposition
  },
  {
    key: 'static_impact_analysis',
    name: '影响指标分析配置',
    description: '包含项目回头率、人员配置比等各项指标的目标与预算',
    value: BusinessTargets.turnover.impactAnalysis
  },
  {
    key: 'static_profit_targets',
    name: '利润目标配置',
    description: '包含年度利润率目标值',
    value: BusinessTargets.profit
  },
  {
    key: 'static_store_targets',
    name: '门店拓展目标',
    description: '包含年度新店目标及预算',
    value: BusinessTargets.store
  },
  {
    key: 'static_headquarters_cost',
    name: '总部成本核算',
    description: '包含总部收入、人工成本、固定成本及利润分析',
    value: BusinessTargets.headquartersCostAccounting
  },
  {
    key: 'static_capital_balance',
    name: '资金结余配置',
    description: '包含2025年末各城市资金结余目标',
    value: BusinessTargets.capitalBalance
  }
];

export default BusinessTargets;
