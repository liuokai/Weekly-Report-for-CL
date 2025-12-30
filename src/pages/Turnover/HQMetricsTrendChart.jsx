import React, { useMemo, useState, useEffect } from 'react';
import LineTrendChart from '../../components/Common/LineTrendChart';
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
    showAverage: true,
    showExtremes: true
  });

  const [metricsData, setMetricsData] = useState(METRICS);
  
  // Use new APIs for price data
  const { data: annualYtdData } = useFetchData('getWeeklyAvgPriceYTD');
  const { data: weeklyData } = useFetchData('getWeeklyAvgPrice');
  
  // Keep original API for other metrics if needed (or remove if unused)
  const { data: fetchedData, fetchData } = useFetchData('getHQMetrics');

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

    // Process other metrics from getHQMetrics if available
    if (fetchedData && Array.isArray(fetchedData) && fetchedData.length > 0) {
       // Clear default mock data for other metrics before populating
       Object.keys(newMetrics).forEach(key => {
         if (key !== 'annualAvgPrice' && key !== 'weeklyAvgPrice') {
            newMetrics[key].data = [];
            newMetrics[key].dataYoY = [];
            // pct not standard for these yet
         }
       });

       fetchedData.forEach(row => {
         if (newMetrics[row.metric] && row.metric !== 'annualAvgPrice' && row.metric !== 'weeklyAvgPrice') {
           newMetrics[row.metric].data.push(Number(row.current_value) || 0);
           newMetrics[row.metric].dataYoY.push(Number(row.last_year_value) || 0);
         }
       });
    }

    setMetricsData(newMetrics);
  }, [annualYtdData, weeklyData, fetchedData]);

  const toggleControl = (key) => {
    setControls(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const weeksMeta = useMemo(() => {
    const result = [];
    const today = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const startOfWeek = (date) => {
      const d = new Date(date);
      const day = d.getDay() || 7; // Sunday=0 -> 7
      const diff = day - 1; // Monday as start
      d.setDate(d.getDate() - diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };
    const endOfWeek = (start) => {
      const d = new Date(start.getTime() + 6 * oneDay);
      d.setHours(23, 59, 59, 999);
      return d;
    };
    const fmtYYMMDD = (d) => {
      const yy = String(d.getFullYear()).slice(-2);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yy}${mm}${dd}`;
    };
    const getISOWeekInfo = (date) => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const week = Math.ceil((((d - yearStart) / oneDay) + 1) / 7);
      return { year: d.getUTCFullYear(), week };
    };
    for (let i = 11; i >= 0; i--) {
      const ref = new Date(today.getTime() - i * 7 * oneDay);
      const start = startOfWeek(ref);
      const end = endOfWeek(start);
      const { year, week } = getISOWeekInfo(start);
      result.push({
        year,
        week,
        startStr: fmtYYMMDD(start),
        endStr: fmtYYMMDD(end)
      });
    }
    return result;
  }, []);

  const currentMetricConfig = metricsData[activeMetric];

  // Safety check to prevent blank page crash if config is missing
  if (!currentMetricConfig) {
    return null; 
  }

  const isPercentMetric = currentMetricConfig.unit === '%';
  const isPriceMetric = currentMetricConfig.unit === '元';

  return (
    <div className="mb-6">
      <div className="flex flex-col gap-4 px-2 mb-4">
        <div className="inline-flex" role="group" aria-label="price metric toggle">
          <button
            onClick={() => setActiveMetric('annualAvgPrice')}
            className={`px-4 py-1.5 text-xs font-medium border ${activeMetric === 'annualAvgPrice' ? 'bg-[#a40035] text-white border-[#a40035]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'} rounded-l-full`}
          >
            年度平均客单价
          </button>
          <button
            onClick={() => setActiveMetric('weeklyAvgPrice')}
            className={`px-4 py-1.5 text-xs font-medium border ${activeMetric === 'weeklyAvgPrice' ? 'bg-[#a40035] text-white border-[#a40035]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'} -ml-px rounded-r-full`}
          >
            周度平均客单价
          </button>
        </div>
        {/* Controls Row */}
        <div className="flex gap-2">
          <button
            onClick={() => toggleControl('showYoY')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              controls.showYoY
                ? 'bg-[#a40035]/10 text-[#a40035] border-[#a40035]'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            显示同比
          </button>
          <button
            onClick={() => toggleControl('showAverage')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              controls.showAverage
                ? 'bg-[#a40035]/10 text-[#a40035] border-[#a40035]'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            显示均值
          </button>
          <button
            onClick={() => toggleControl('showExtremes')}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              controls.showExtremes
                ? 'bg-[#a40035]/10 text-[#a40035] border-[#a40035]'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            显示极值
          </button>
        </div>
      </div>

      <LineTrendChart
        key={activeMetric}
        headerTitle={currentMetricConfig.label}
        headerUnit={currentMetricConfig.unit}
        values={currentMetricConfig.data}
        valuesYoY={currentMetricConfig.dataYoY}
        valuesPct={currentMetricConfig.dataPct}
        xLabels={weeksMeta.map(w => `${w.week} 周`)}
        showYoY={controls.showYoY}
        showTrend={controls.showAverage}
        showExtremes={controls.showExtremes}
        width={1000}
        height={320}
        colorPrimary="#a40035"
        colorYoY="#2563eb"
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
