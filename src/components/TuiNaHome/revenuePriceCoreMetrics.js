// 推拿之家核心指标配置（复用 CoreMetricCard 样式）
export const revenuePriceCoreMetrics = [
  {
    key: "unitPrice",
    label: "客单价",
    value: 298.0,
    unit: "元",
    target: 320,
    progress: 298.0, // 进度 = value / target
    yoy: 6.5, // +6.5%
    mom: 1.8, // +1.8%
  },
  {
    key: "unitPriceIncreaseRate",
    label: "客单价涨价率",
    value: 3.2,
    unit: "%",
    target: 3.0,
    progress: 3.2, // 进度 = value / target
    yoy: 0.6, // +0.6pct
    mom: 0.2, // +0.2pct
  },
];


