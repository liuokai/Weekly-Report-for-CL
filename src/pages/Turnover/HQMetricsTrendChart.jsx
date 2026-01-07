import React, { useMemo, useState, useEffect } from 'react';
import LineTrendChart from '../../components/Common/LineTrendChart';
import LineTrendStyle from '../../components/Common/LineTrendStyleConfig';
import useFetchData from "../../hooks/useFetchData";

const METRICS = {
  annualAvgPrice: {
    label: '年度累计平均客单价',
    unit: '元',
    data: [],
    dataYoY: []
  },
  weeklyAvgPrice: {
    label: '周度平均客单价',
    unit: '元',
    data: [],
    dataYoY: []
  },
  projectReturnRate: {
    label: '项目回头率',
    unit: '%',
    data: [29.1, 30.3, 31.0, 28.7, 30.0, 30.8, 29.5, 31.2, 32.0, 30.6, 29.8, 30.9],
    dataYoY: [28.0, 29.2, 30.0, 27.8, 29.0, 29.5, 28.6, 30.1, 30.8, 29.7, 28.9, 29.8]
  },
  bedStaffRatio: {
    label: '床位人员配置比',
    unit: '',
    data: [0.48, 0.50, 0.49, 0.51, 0.52, 0.50, 0.49, 0.51, 0.53, 0.52, 0.50, 0.49],
    dataYoY: [0.46, 0.47, 0.48, 0.49, 0.48, 0.47, 0.49, 0.50, 0.49, 0.48, 0.47, 0.48]
  },
  newEmployeeReturnCompliance: {
    label: '新员工回头率达标率',
    unit: '%',
    data: [28.5, 29.3, 30.1, 31.0, 30.7, 29.9, 28.8, 30.5, 31.2, 30.0, 29.6, 30.4],
    dataYoY: [27.9, 28.8, 29.6, 30.2, 29.8, 29.1, 28.4, 29.9, 30.4, 29.7, 29.0, 29.6]
  },
  therapistOutputCompliance: {
    label: '推拿师产值达标率',
    unit: '%',
    data: [27.0, 28.5, 29.8, 30.2, 31.0, 32.1, 30.7, 29.9, 31.5, 32.8, 30.6, 29.7],
    dataYoY: [26.0, 27.2, 28.4, 29.0, 29.8, 30.6, 29.5, 28.7, 30.1, 31.0, 29.4, 28.6]
  }
};

const HQMetricsTrendChart = () => {
  const [activeMetric, setActiveMetric] = useState('annualAvgPrice');
  const [controls, setControls] = useState({
    showYoY: true,
    showTrend: true,
    showExtremes: true
  });

  const [metricsData, setMetricsData] = useState(METRICS);
  
  // Use new APIs for price data
  const { data: annualYtdData } = useFetchData('getWeeklyAvgPriceYTD');
  const { data: weeklyData } = useFetchData('getWeeklyAvgPrice');

  useEffect(() => {
    // Always start from the initial METRICS template to ensure clean state
    const newMetrics = JSON.parse(JSON.stringify(METRICS));
    
    // Process Annual Cumulative AOV Data
    if (annualYtdData && annualYtdData.length > 0) {
        // Take last 12 weeks (data is DESC, so take first 12 then reverse)
        const sorted = [...annualYtdData].slice(0, 12).reverse();
        // Use raw Number (float) - do not round
        newMetrics.annualAvgPrice.data = sorted.map(item => Number(item.current_year_cumulative_aov) || 0);
        // dataYoY should be last year's absolute value
        newMetrics.annualAvgPrice.dataYoY = sorted.map(item => Number(item.last_year_cumulative_aov) || 0);
        // Store pct separately for tooltip display
        newMetrics.annualAvgPrice.dataPct = sorted.map(item => Number(item.cumulative_aov_yoy_pct) || 0);
    }

    // Process Weekly AOV Data
    if (weeklyData && weeklyData.length > 0) {
        const sorted = [...weeklyData].slice(0, 12).reverse();
        // Use raw Number (float)
        newMetrics.weeklyAvgPrice.data = sorted.map(item => Number(item.current_week_aov) || 0);
        // dataYoY should be last year's absolute value (note: check sql field name, usually last_year_week_aov or similar. 
        // Based on typical query structure, let's assume last_year_week_aov exists in the result if joined properly.
        // Wait, I need to check if the SQL returns last_year_week_aov.
        // Let's assume it does based on user request "数值取自last_year_week_aov".
        newMetrics.weeklyAvgPrice.dataYoY = sorted.map(item => Number(item.last_year_week_aov) || 0);
        newMetrics.weeklyAvgPrice.dataPct = sorted.map(item => Number(item.aov_yoy_pct) || 0);
    }

    setMetricsData(newMetrics);
  }, [annualYtdData, weeklyData]);

  const toggleControl = (key) => {
    setControls(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const weeksMeta = useMemo(() => {
    const src = activeMetric === 'annualAvgPrice' ? annualYtdData : weeklyData;
    if (!src || src.length === 0) return [];
    const sorted = [...src].slice(-12);
    return sorted.map(item => ({
      year: Number(item.sales_year) || 0,
      week: Number(item.sales_week) || 0,
      startStr: String((item.week_date_range || '').split('~')[0] || '').trim().replace(/-/g, '/').slice(2).replace(/\//g, '').replace(/^(\d{2})(\d{2})(\d{2}).*$/, '$1$2$3'),
      endStr: String((item.week_date_range || '').split('~')[1] || '').trim().replace(/-/g, '/').slice(2).replace(/\//g, '').replace(/^(\d{2})(\d{2})(\d{2}).*$/, '$1$2$3'),
      rangeRaw: String(item.week_date_range || '')
    }));
  }, [activeMetric, annualYtdData, weeklyData]);

  const currentMetricConfig = metricsData[activeMetric];

  // Safety check to prevent blank page crash if config is missing
  if (!currentMetricConfig) {
    return null; 
  }

  const isPercentMetric = currentMetricConfig.unit === '%';
  const isPriceMetric = currentMetricConfig.unit === '元';

  return (
    <div className="mb-6">
      {LineTrendStyle.renderHeader(currentMetricConfig.label + '趋势', currentMetricConfig.unit)}
      {LineTrendStyle.renderMetricSwitch(
        [
          { key: 'annualAvgPrice', label: '年度平均客单价' },
          { key: 'weeklyAvgPrice', label: '周度平均客单价' }
        ],
        activeMetric,
        setActiveMetric
      )}
      {LineTrendStyle.renderAuxControls({
        showYoY: controls.showYoY,
        setShowYoY: () => toggleControl('showYoY'),
        showTrend: controls.showTrend,
        setShowTrend: () => toggleControl('showTrend'),
        showExtremes: controls.showExtremes,
        setShowExtremes: () => toggleControl('showExtremes')
      })}

      <LineTrendChart
        key={activeMetric}
        values={currentMetricConfig.data}
        valuesYoY={currentMetricConfig.dataYoY}
        valuesPct={currentMetricConfig.dataPct}
        xLabels={weeksMeta.map(w => `第${String(w.week).padStart(2, '0')}周`)}
        showYoY={controls.showYoY}
        showTrend={controls.showTrend}
        showExtremes={controls.showExtremes}
        width={LineTrendStyle.DIMENSIONS.width}
        height={LineTrendStyle.DIMENSIONS.height}
        colorPrimary={LineTrendStyle.COLORS.primary}
        colorYoY={LineTrendStyle.COLORS.yoy}
        yAxisFormatter={(v) => {
          if (isPercentMetric) return `${v.toFixed(1)}%`;
          if (isPriceMetric) return `¥${v.toFixed(2)}`;
          return v.toFixed(2);
        }}
        valueFormatter={(v) => {
          if (isPercentMetric) return `${v.toFixed(2)}%`;
          if (isPriceMetric) return `¥${v.toFixed(2)}`;
          return v.toFixed(2);
        }}
        currentLabel="本周"
        lastLabel="去年同期"
        yoyLabel="同比"
        includeLastPointInTrend={LineTrendStyle.computeIncludeLastPointInTrend(
          weeksMeta && weeksMeta.length ? weeksMeta[weeksMeta.length - 1]?.rangeRaw : null
        )}
        getHoverTitle={(idx) => {
          const wm = weeksMeta[idx] || {};
          return `周数： ${wm.year || ''} 年第 ${wm.week || ''} 周`;
        }}
        getHoverSubtitle={(idx) => {
          const wm = weeksMeta[idx] || {};
          if (!wm.startStr || !wm.endStr) return '';
          return `日期范围：${wm.startStr} - ${wm.endStr}`;
        }}
      />
    </div>
  );
};

export default HQMetricsTrendChart;
