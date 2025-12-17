// 推拿之家 Tab，仅保留核心指标区域
import React from "react";
import WeeklyTurnoverChart from "./WeeklyTurnoverChart";
import RevenueDecompositionContainer from "./RevenueDecompositionContainer";

const TuiNaHomeTab = () => {
  return (
    <div className="space-y-6">
      {/* 核心指标区域已移除，移动到 WeeklyReport 的 CoreMetricsBar 中 */}
      
      {/* 新增：周度营业额趋势图 */}
      <WeeklyTurnoverChart />

      <RevenueDecompositionContainer />
    </div>
  );
};

export default TuiNaHomeTab;
