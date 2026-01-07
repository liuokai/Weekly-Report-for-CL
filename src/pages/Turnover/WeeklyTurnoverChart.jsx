import React, { useState, useEffect } from "react";
import LineTrendChart from "../../components/Common/LineTrendChart";
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
    fetchData();
  }, [selectedMetricKey, fetchData]);

  useEffect(() => {
    if (fetchedData && Array.isArray(fetchedData) && fetchedData.length > 0) {
      // Process fetched data - standardize fields
      // Requirement: Only show last 12 weeks, ordered by week number ascending (oldest to newest)
      // The SQL returns data ordered by Year DESC, Week DESC (Newest to Oldest)
      // So we slice the first 12 items (which are the newest), then reverse them to be chronological.
      
      const processed = fetchedData
        .slice(0, 12) // Take latest 12 records
        .reverse()    // Sort chronological (Ascending)
        .map((row) => ({
          weekNum: row.week,
          weekLabel: `第${row.week}周`,
          fullWeekLabel: `${row.year} 年第 ${row.week} 周`,
          dateRange: row.date_range,
          value: Number(row.current_value) || 0,
          valueLastYear: Number(row.last_year_value) || 0,
          yoyChange: row.yoy_change,
          // Extra fields for specific metrics
          activeDays: row.active_days
        }));
      setChartData(processed);
    } else {
      setChartData([]);
    }
  }, [fetchedData]);
  
  // Prepare data for chart
  const currentDataValues = chartData.map(d => d.value);
  const lastYearDataValues = chartData.map(d => d.valueLastYear);

  // Determine if we should include the last data point in trend calculation
  const shouldIncludeLastPointInTrend = () => {
    if (chartData.length === 0) return true;
    
    // Get the last data point (which corresponds to the most recent week)
    // Note: chartData is already reversed to chronological order (oldest -> newest), 
    // so the last element is the newest week.
    const lastPoint = chartData[chartData.length - 1];
    if (!lastPoint || !lastPoint.dateRange) return true;

    try {
      // Parse date range string "YYYY-MM-DD ~ YYYY-MM-DD"
      const parts = lastPoint.dateRange.split('~');
      if (parts.length < 2) return true;
      
      const endDateStr = parts[1].trim();
      const endDate = new Date(endDateStr);
      // Set time to end of day for accurate comparison
      endDate.setHours(23, 59, 59, 999);
      
      const today = new Date();
      // If end date is in the future or is today, the week is not over.
      // So we exclude it from trend calculation.
      // If end date < today, the week is fully past.
      return endDate < today;
    } catch (e) {
      console.warn('Failed to parse date range for trend logic', e);
      return true;
    }
  };

  const includeLastPoint = shouldIncludeLastPointInTrend();

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
        <LineTrendChart
          values={currentDataValues}
          valuesYoY={lastYearDataValues}
          xLabels={chartData.map(d => d.weekLabel)}
          showYoY={showYoY}
          showTrend={showTrend}
          showExtremes={showExtremes}
          yAxisFormatter={currentMetric.axisFormat}
          valueFormatter={currentMetric.format}
          width={width}
          height={height}
          padding={padding}
          colorPrimary={LineTrendStyle.COLORS.primary}
          colorYoY={LineTrendStyle.COLORS.yoy}
          includeLastPointInTrend={LineTrendStyle.computeIncludeLastPointInTrend(
            chartData[chartData.length - 1]?.dateRange
          )}
          getHoverTitle={(i) => chartData[i] ? chartData[i].fullWeekLabel : ''}
          getHoverSubtitle={(i) => {
             if (!chartData[i]) return '';
             let sub = `日期范围：${chartData[i].dateRange || '--'}`;
             if (selectedMetricKey === 'dailyAvgRevenue' && chartData[i].activeDays) {
                sub += `\n营业天数：${chartData[i].activeDays}天`;
             }
             return sub;
          }}
        />
      ) : (
        <div className="flex justify-center items-center h-[320px] text-gray-400">暂无数据</div>
      )}
    </div>
  );
};

export default WeeklyTurnoverChart;
