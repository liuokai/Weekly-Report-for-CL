import React, { useState, useEffect } from "react";
import RechartsLineTrend from "../../components/Common/RechartsLineTrend";
import LineTrendStyle from "../../components/Common/LineTrendStyleConfig";
import useFetchData from "../../hooks/useFetchData";

const WeeklyTurnoverChart = () => {
  // 定义指标配置
  const METRICS = [
    { key: 'revenue', queryKey: 'getWeeklyTurnover', label: '周度营业额', unit: '元', format: (val) => `¥ ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, axisFormat: (val) => (val / 10000).toFixed(0) + '万' },
    { key: 'ytdRevenue', queryKey: 'getWeeklyTurnoverCum', label: '年度累计营业额', unit: '元', format: (val) => `¥ ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, axisFormat: (val) => (val / 100000000).toFixed(2) + '亿' },
    { key: 'dailyAvgRevenue', queryKey: 'getWeeklyTurnoverAvgDay', label: '天均营业额', unit: '元', format: (val) => `¥ ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, axisFormat: (val) => (val / 10000).toFixed(1) + '万' },
  ];

  const [selectedMetricKey, setSelectedMetricKey] = useState('revenue');
  const [showTrend, setShowTrend] = useState(true);
  const [showExtremes, setShowExtremes] = useState(true);
  const [showYoY, setShowYoY] = useState(false);
  const [chartData, setChartData] = useState([]);

  const currentMetric = METRICS.find(m => m.key === selectedMetricKey);
  // Removed local cache options as they are now handled globally by useFetchData + CacheManager
  const { data: fetchedData, loading, fetchData } = useFetchData(currentMetric.queryKey);

  useEffect(() => {
    if (fetchedData && Array.isArray(fetchedData) && fetchedData.length > 0) {
      // 1. 基础过滤：仅展示已结束的周
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);

      const filteredByEndOfWeek = fetchedData.filter(row => {
        if (!row.date_range) return true;
        const parts = row.date_range.split('~');
        if (parts.length < 2) return true;
        const endDate = new Date(parts[1].trim());
        endDate.setHours(23, 59, 59, 999);
        return yesterday >= endDate;
      });

      // 2. 年度累计营业额特殊逻辑：优化跨年断崖
      let finalData = filteredByEndOfWeek;
      if (selectedMetricKey === 'ytdRevenue') {
        const latestYear = Math.max(...filteredByEndOfWeek.map(r => Number(r.year)));
        const latestYearData = filteredByEndOfWeek.filter(r => Number(r.year) === latestYear);
        if (latestYearData.length > 0) {
          finalData = filteredByEndOfWeek.filter(r => Number(r.year) === latestYear);
        }
      }

      // 3. 取最近12个有效数据节点
      const processed = finalData
        .slice(0, 12)
        .reverse()
        .map((row) => ({
          weekNum: row.week,
          weekLabel: `第${row.week}周`,
          fullWeekLabel: `${row.year} 年第 ${row.week} 周`,
          dateRange: row.date_range,
          value: Number(row.current_value) || 0,
          valueLastYear: Number(row.last_year_value) || 0,
          yoyChange: row.yoy_change,
          activeDays: row.active_days
        }));
      setChartData(processed);
    } else {
      setChartData([]);
    }
  }, [fetchedData, selectedMetricKey]);

  // Calculate custom Y-axis range for stability
  const getCustomYAxisRange = () => {
    if (chartData.length === 0) return { min: undefined, max: undefined };
    
    const values = chartData.map(d => d.value);
    if (showYoY) {
      values.push(...chartData.map(d => d.valueLastYear));
    }
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);

    // For YTD Revenue, use a different scaling strategy to make it look "slowly rising"
    if (selectedMetricKey === 'ytdRevenue') {
      // 策略：年度累计通常从 0 或一个小值涨到很大。为了让它显得上升缓慢，
      // 我们将 Y 轴的最大值设为当前最大累计值的 2 倍左右，或者在顶部留出巨大空间。
      return { 
        min: 0, 
        max: dataMax * 1.5 // 在上方留出 50% 的空白空间，使折线坡度变缓
      };
    }
    
    // 策略：通过大幅扩大 Y 轴展示范围（取平均值的 50% 作为窗口）来压低折线波动感
    // 这样即便有几万元的波动，在数百万/千万的坐标系下也会显得非常平稳
    const targetRange = avg * 0.50;
    
    // 居中展示
    let min = avg - targetRange / 2;
    let max = avg + targetRange / 2;
    
    // 确保所有数据点仍可见（安全溢出处理）
    if (dataMin < min) min = dataMin * 0.95;
    if (dataMax > max) max = dataMax * 1.05;
    
    // 对于金额类数据，通常不希望看到负数坐标轴
    return { min: Math.max(0, min), max };
  };

  const { min: yAxisMin, max: yAxisMax } = getCustomYAxisRange();

  const width = LineTrendStyle.DIMENSIONS.width;
  const height = LineTrendStyle.DIMENSIONS.height;
  const padding = LineTrendStyle.DIMENSIONS.padding;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      {LineTrendStyle.renderHeader(`${currentMetric.label}趋势`, currentMetric.unit)}

      {LineTrendStyle.renderMetricSwitch(METRICS, selectedMetricKey, setSelectedMetricKey)}

      {LineTrendStyle.renderAuxControls({
        showYoY,
        setShowYoY,
        showTrend,
        setShowTrend,
        showExtremes,
        setShowExtremes
      })}
      
      {loading ? (
        <div className="flex justify-center items-center h-[320px] text-gray-400">加载中...</div>
      ) : chartData.length > 0 ? (
        <RechartsLineTrend
          data={chartData}
          showYoY={showYoY}
          showTrend={showTrend}
          showExtremes={showExtremes}
          yAxisMin={yAxisMin}
          yAxisMax={yAxisMax}
          yAxisFormatter={currentMetric.axisFormat}
          valueFormatter={currentMetric.format}
          colorPrimary={LineTrendStyle.COLORS.primary}
          colorYoY={LineTrendStyle.COLORS.yoy}
          height={height}
        />
      ) : (
        <div className="flex justify-center items-center h-[320px] text-gray-400">暂无数据</div>
      )}
    </div>
  );
};

export default WeeklyTurnoverChart;
