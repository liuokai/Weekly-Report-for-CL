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
    // 本年累计营业额目标值（单位：万元）
    annualTarget: 48000,
    // 城市年度营业额目标（单位：元），按城市名称映射
    cityTargets: {
      '成都市': 167010966,
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
        target: 79.0, // 目标值（%）
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
        '成都市': 3,
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
        '成都市': 115500,
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
  // 总部成本核算 (Headquarters Cost Accounting)
  // =================================================================
  headquartersCostAccounting: {
    // 收入
    revenue: [
      { name: "服务费收入", value: 12142741.76 },
      { name: "租金收入", value: 776400.00 },
      { name: "商品销售收入", value: 138000.00 },
      { name: "小计", value: 13057141.76 }
    ],
    // 人工成本
    laborCosts: [
      { name: "人工成本-投融资管理", value: 5236511.74 },
      { name: "人工成本-推拿之家", value: 5431538.46 },
      { name: "人工成本-用户中心", value: 6768164.21 },
      { name: "人工成本-IT中心", value: 7142000.00 },
      { name: "小计", value: 24578214.40 }
    ],
    // 固定成本
    fixedCosts: [
      { name: "房租费", value: 210252.93 },
      { name: "折旧费", value: 47884.62 },
      { name: "研发培训费", value: 2504709.71 },
      { name: "招聘渠道费", value: 1029371.05 },
      { name: "办公费", value: 909462.33 },
      { name: "水电费", value: 48000.00 },
      { name: "服务器租赁", value: 1207900.00 },
      { name: "手续费", value: 5000.00 },
      { name: "税金", value: 891603.20 },
      { name: "小计", value: 6854183.84 }
    ],
    // 合计与利润
    summary: {
      totalExpenditure: 31432398.25, // 支出合计
      headquartersProfit: -18375256.49 // 总部利润
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
        '北京市': 6500000.00,
        '上海市': 6200000.00,
        '广州市': 3800000.00,
        '深圳市': 4200000.00,
        '成都市': 2500000.00,
        '重庆市': 2200000.00,
        '杭州市': 2100000.00,
        '南京市': 1600000.00,
        '宁波市': 1381638.21
      }
    }
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
