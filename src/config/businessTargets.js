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
    
    // 预算相关配置
    budget: {
      // 年度总预算金额（单位：万元）
      total: 4567,
      
      // 实际已消耗预算金额（单位：万元）
      // 注：此处为手动录入值，如后续接入自动统计接口，可废弃此字段
      used: 4321
    },

    // 客单价拆解 (Price Decomposition)
    priceDecomposition: {
      // 去年平均客单价（单位：元）
      lastYearAveragePrice: 288.7,
      
      // 客单价增长率目标值（单位：百分比）
      targetGrowthRate: 3
    },

    // 客次量拆解 (Customer Volume Decomposition)
    volumeDecomposition: {
      // 年度累计客次量目标 (单位：万人次)
      annualCumulativeTarget: 2500000
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
    annualTargetRate: 6.3
  },

  // =================================================================
  // 门店拓展 (Store Expansion)
  // =================================================================
  store: {
    // 年度新店目标
    newStore: {
      target: 28, // 目标数量（家）
      budget: 123 // 预算金额（万元）
    }
  }
};

export default BusinessTargets;
