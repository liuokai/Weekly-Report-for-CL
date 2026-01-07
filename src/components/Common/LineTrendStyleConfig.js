import React from "react";

const COLORS = {
  primary: "#a40035",
  yoy: "#2563eb"
};

const DIMENSIONS = {
  width: 800,
  height: 320,
  padding: { top: 40, right: 40, bottom: 60, left: 45 }
};

const CLASSES = {
  headerWrapper: "mb-4",
  headerTitle: "text-lg font-semibold text-gray-800",
  headerUnit: "text-sm text-gray-500",
  metricSwitchContainer: "flex flex-wrap gap-2 mb-3",
  metricButtonActive: "px-4 py-1.5 rounded-full text-sm font-medium transition-colors bg-[#a40035]/10 text-[#a40035]",
  metricButtonInactive: "px-4 py-1.5 rounded-full text-sm font-medium transition-colors bg-gray-100 text-gray-500 hover:bg-gray-200",
  auxContainer: "flex gap-2 mb-6",
  auxButtonActivePrimary: "px-3 py-1 rounded-full text-xs font-medium transition-colors border bg-[#a40035]/10 text-[#a40035] border-[#a40035]",
  auxButtonInactivePrimary: "px-3 py-1 rounded-full text-xs font-medium transition-colors border bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100",
  auxButtonActiveYoY: "px-3 py-1 rounded-full text-xs font-medium transition-colors border bg-[#2563eb]/10 text-[#2563eb] border-[#2563eb]",
  auxButtonInactiveYoY: "px-3 py-1 rounded-full text-xs font-medium transition-colors border bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100"
};

const shouldShowMetricSwitch = (metrics) => Array.isArray(metrics) && metrics.length >= 2;

const renderHeader = (title, unit) => (
  <div className={CLASSES.headerWrapper}>
    <h3 className={CLASSES.headerTitle}>{title}</h3>
    <p className={CLASSES.headerUnit}>单位：{unit}</p>
  </div>
);

const renderMetricSwitch = (metrics, selectedKey, onSelect) => {
  if (!shouldShowMetricSwitch(metrics)) return null;
  return (
    <div className={CLASSES.metricSwitchContainer}>
      {metrics.map((m) => (
        <button
          key={m.key}
          onClick={() => onSelect(m.key)}
          className={selectedKey === m.key ? CLASSES.metricButtonActive : CLASSES.metricButtonInactive}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
};

const renderAuxControls = (opts) => {
  const {
    showYoY,
    setShowYoY,
    showTrend,
    setShowTrend,
    showExtremes,
    setShowExtremes
  } = opts;
  return (
    <div className={CLASSES.auxContainer}>
      <button
        onClick={() => setShowYoY(!showYoY)}
        className={showYoY ? CLASSES.auxButtonActiveYoY : CLASSES.auxButtonInactiveYoY}
      >
        显示同比
      </button>
      <button
        onClick={() => setShowTrend(!showTrend)}
        className={showTrend ? CLASSES.auxButtonActivePrimary : CLASSES.auxButtonInactivePrimary}
      >
        显示趋势
      </button>
      <button
        onClick={() => setShowExtremes(!showExtremes)}
        className={showExtremes ? CLASSES.auxButtonActivePrimary : CLASSES.auxButtonInactivePrimary}
      >
        显示极值
      </button>
    </div>
  );
};

const computeIncludeLastPointInTrend = (dateRangeStr) => {
  if (!dateRangeStr || typeof dateRangeStr !== "string") return true;
  const parts = dateRangeStr.split("~");
  if (parts.length < 2) return true;
  const endStr = parts[1].trim();
  const end = new Date(endStr);
  if (Number.isNaN(end.getTime())) return true;
  const today = new Date();
  end.setHours(23, 59, 59, 999);
  return end < today;
};

export default {
  COLORS,
  DIMENSIONS,
  CLASSES,
  shouldShowMetricSwitch,
  renderHeader,
  renderMetricSwitch,
  renderAuxControls,
  computeIncludeLastPointInTrend
};

