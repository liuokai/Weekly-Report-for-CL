import React from "react";
import CoreMetricsSection from "./Common/CoreMetricsSection";

// 核心指标概览区域
const CoreMetricsBar = () => {
  // 指标数据配置
  // value: 指标值（原始数值）
  // target: 目标值（原始数值，null表示无目标）
  // progress: 用于计算进度的实际值（通常等于value，但某些指标可能需要单独计算）
  // yoy: 同比值（原始数值，如 8.3 表示 +8.3%）
  // mom: 环比值（原始数值，如 2.1 表示 +2.1%）
  const metrics = [
    {
      key: "revenue",
      label: "营业额",
      value: 391063245.03,
      unit: "元",
      target: 3666789100,
      progress: 391063245.03, // 进度值 = value / target * 100
      yoy: 8.3, // 同比 +8.3%
      mom: 2.1, // 环比 +2.1%
    },
    {
      key: "profitMargin",
      label: "利润率",
      value: 8.2,
      unit: "%",
      target: 6.0,
      progress: 8.2, // 进度值 = value / target * 100
      yoy: 1.3, // 同比 +1.3pct
      mom: 0.5, // 环比 +0.5pct
    },
    {
      key: "profitGrowth",
      label: "利润增长率",
      value: 3.4,
      unit: "%",
      target: null, // 无目标
      progress: null, // 无进度
      yoy: 0.8, // 同比 +0.8pct
      mom: 0.3, // 环比 +0.3pct
    },
    {
      key: "newStores",
      label: "新店数量",
      value: 22,
      unit: "家",
      target: 20,
      progress: 22, // 进度值 = value / target * 100
      yoy: 18.0, // 同比 +18.0%
      mom: 4.0, // 环比 +4.0%
    },
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
    {
      key: "cash",
      label: "资金",
      value: 30000000,
      unit: "元",
      target: null, // 无目标
      progress: null, // 无进度
      yoy: 12.5, // 同比 +12.5%
      mom: 3.2, // 环比 +3.2%
    },
  ];

  return (
    <section className="bg-white shadow-sm border-b border-gray-100">
      <div className="container mx-auto px-4 py-4 md:py-5">
        <CoreMetricsSection
          title="本周核心经营指标一览"
          hint="指标为演示示例，可根据实际业务口径接入动态数据"
          metrics={metrics}
          className="p-0 bg-transparent shadow-none"
          contentClassName="flex flex-wrap gap-3 md:gap-4"
        />
      </div>
    </section>
  );
};

export default CoreMetricsBar;
