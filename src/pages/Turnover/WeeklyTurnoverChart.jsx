import React, { useState, useEffect } from "react";
import RechartsLineTrend from "../../components/Common/RechartsLineTrend";
import LineTrendStyle from "../../components/Common/LineTrendStyleConfig";
import useFetchData from "../../hooks/useFetchData";

const WeeklyTurnoverChart = ({ annualTarget = 0, totalStores = 0 }) => {
  // 定义指标配置
  const METRICS = [
    { key: 'revenue', queryKey: 'getWeeklyTurnover', label: '周度营业额', unit: '元', format: (val) => `¥ ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, axisFormat: (val) => (val / 10000).toFixed(0) + '万' },
    { key: 'ytdRevenue', queryKey: 'getWeeklyTurnoverCum', label: '年度累计营业额', unit: '元', format: (val) => `¥ ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, axisFormat: (val) => (val / 100000000).toFixed(2) + '亿' },
    { key: 'dailyAvgRevenue', queryKey: 'getWeeklyTurnoverAvgDay', label: '天均营业额', unit: '元', format: (val) => `¥ ${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, axisFormat: (val) => (val / 10000).toFixed(1) + '万' },
  ];

  const [selectedMetricKey, setSelectedMetricKey] = useState('revenue');
  const [showTrend, setShowTrend] = useState(false);
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
      setChartData(processed);    } else {
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
      const annualTargetYuan = (annualTarget || 0) * 10000;
      const maxWeek = chartData.length > 0 ? chartData[chartData.length - 1].weekNum : 0;
      const ytdTarget = maxWeek > 0 ? annualTargetYuan / 52 * maxWeek : annualTargetYuan;
      const ytdMax = ytdTarget > 0 ? Math.max(dataMax, ytdTarget) : dataMax;
      return { 
        min: 0, 
        max: ytdMax * 1.1
      };
    }
    
    // 策略：通过大幅扩大 Y 轴展示范围（取平均值的 50% 作为窗口）来压低折线波动感
    const targetRange = avg * 0.50;
    
    let min = avg - targetRange / 2;
    let max = avg + targetRange / 2;
    
    // 确保所有数据点仍可见（安全溢出处理）
    if (dataMin < min) min = dataMin * 0.95;
    if (dataMax > max) max = dataMax * 1.05;

    // 确保目标虚线也在可见范围内
    const currentTargetValue = annualTargetYuan
      ? (selectedMetricKey === 'revenue'
          ? annualTargetYuan / 365 * 7
          : totalStores > 0 ? annualTargetYuan / 365 / totalStores : annualTargetYuan / 365)
      : null;
    if (currentTargetValue && currentTargetValue > max) max = currentTargetValue * 1.1;
    if (currentTargetValue && currentTargetValue < min) min = currentTargetValue * 0.9;
    
    // 对于金额类数据，通常不希望看到负数坐标轴
    return { min: Math.max(0, min), max };
  };

  const { min: yAxisMin, max: yAxisMax } = getCustomYAxisRange();

  // 根据指标类型计算目标虚线值（annualTarget 单位为万元，转换为元）
  const annualTargetYuan = (annualTarget || 0) * 10000;
  const targetValue = (() => {
    if (!annualTargetYuan) return null;
    if (selectedMetricKey === 'revenue') return annualTargetYuan / 365 * 7;
    // 天均目标 = 年营业额目标 / 365 / 门店数
    if (selectedMetricKey === 'dailyAvgRevenue') return totalStores > 0 ? annualTargetYuan / 365 / totalStores : annualTargetYuan / 365;
    if (selectedMetricKey === 'ytdRevenue') {
      // 累计目标只算到图表中最后一周，按 年目标/52*最大周数 计算
      const maxWeek = chartData.length > 0 ? chartData[chartData.length - 1].weekNum : 0;
      return maxWeek > 0 ? annualTargetYuan / 52 * maxWeek : annualTargetYuan;
    }
    return null;
  })();

  // ytdRevenue 模式下，给每个数据点注入按周累计的目标值（斜线）
  const chartDataWithTarget = (selectedMetricKey === 'ytdRevenue' && annualTargetYuan > 0)
    ? chartData.map(d => ({
        ...d,
        weeklyTarget: annualTargetYuan / 52 * d.weekNum
      }))
    : chartData;
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

      {selectedMetricKey === 'dailyAvgRevenue' && (
        <p className="text-xs text-red-500 mt-1 mb-2">天均营业额 = 营业额合计 / 所有门店营业天数之和</p>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-[320px] text-gray-400">加载中...</div>
      ) : chartData.length > 0 ? (
        <RechartsLineTrend
          data={selectedMetricKey === 'ytdRevenue' ? chartDataWithTarget : chartData}
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
          targetValue={selectedMetricKey !== 'ytdRevenue' ? targetValue : null}
          targetLabel={
            selectedMetricKey === 'revenue' ? `周目标 ${currentMetric.axisFormat(targetValue)}` :
            selectedMetricKey === 'dailyAvgRevenue' ? `日均目标 ${currentMetric.axisFormat(targetValue)}` : null
          }
          targetColor="#9ca3af"
          showWeeklyTarget={selectedMetricKey === 'ytdRevenue' && annualTargetYuan > 0}
        />
      ) : (
        <div className="flex justify-center items-center h-[320px] text-gray-400">暂无数据</div>
      )}
    </div>
  );
};

export default WeeklyTurnoverChart;
