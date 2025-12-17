// 推拿之家 Tab，仅保留核心指标区域
import React from "react";
import CoreMetricsSection from "./Common/CoreMetricsSection";
import { revenuePriceCoreMetrics } from "./data/revenuePriceCoreMetrics";

const TuiNaHomeTab = () => {
  return (
    <div className="space-y-6">
      {/* 核心指标区域（推拿之家业务核心指标，复用统一样式组件） */}
      <CoreMetricsSection
        title="推拿之家 · 核心指标"
        subtitle="关注客单价与涨价率的核心经营表现"
        metrics={revenuePriceCoreMetrics}
      />
    </div>
  );
};

export default TuiNaHomeTab;