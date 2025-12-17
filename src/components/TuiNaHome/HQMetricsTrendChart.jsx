import React, { useState } from 'react';
import LineTrendChart from '../Common/LineTrendChart';

const METRICS = {
  annualAvgPrice: {
    label: '年度平均客单价',
    unit: '元',
    data: [168, 172, 170, 175, 178, 176, 180, 182, 185, 183, 188, 190],
    dataYoY: [155, 158, 160, 162, 165, 163, 168, 170, 172, 170, 175, 178]
  },
  projectReturnRate: {
    label: '项目回头率',
    unit: '%',
    data: [35, 36, 38, 37, 39, 40, 42, 41, 43, 45, 44, 46],
    dataYoY: [30, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42]
  },
  bedStaffRatio: {
    label: '床位人员配置比',
    unit: '',
    data: [0.55, 0.56, 0.58, 0.57, 0.59, 0.60, 0.62, 0.61, 0.63, 0.65, 0.64, 0.66],
    dataYoY: [0.50, 0.51, 0.52, 0.53, 0.54, 0.55, 0.56, 0.57, 0.58, 0.59, 0.60, 0.61]
  },
  newEmployeeReturnCompliance: {
    label: '新员工回头率达标率',
    unit: '%',
    data: [82, 83, 85, 84, 86, 88, 87, 89, 90, 91, 92, 93],
    dataYoY: [75, 76, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87]
  },
  therapistOutputCompliance: {
    label: '推拿师产值达标率',
    unit: '%',
    data: [70, 72, 71, 74, 75, 78, 76, 79, 80, 82, 81, 83],
    dataYoY: [65, 66, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77]
  }
};

const X_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const HQMetricsTrendChart = () => {
  const [activeMetric, setActiveMetric] = useState('annualAvgPrice');
  const [controls, setControls] = useState({
    showYoY: true,
    showAverage: true,
    showExtremes: true
  });

  const toggleControl = (key) => {
    setControls(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const currentMetricConfig = METRICS[activeMetric];

  return (
    <div className="bg-white rounded-lg p-6 mb-6 border border-gray-100 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-wrap gap-2">
          {Object.entries(METRICS).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveMetric(key)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                activeMetric === key
                  ? 'bg-[#a40035] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>

        <div className="flex gap-4 text-sm text-gray-600">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={controls.showYoY}
              onChange={() => toggleControl('showYoY')}
              className="rounded text-[#a40035] focus:ring-[#a40035]"
            />
            显示同比
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={controls.showAverage}
              onChange={() => toggleControl('showAverage')}
              className="rounded text-[#a40035] focus:ring-[#a40035]"
            />
            显示均值
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={controls.showExtremes}
              onChange={() => toggleControl('showExtremes')}
              className="rounded text-[#a40035] focus:ring-[#a40035]"
            />
            显示极值
          </label>
        </div>
      </div>

      <LineTrendChart
        headerTitle={`${currentMetricConfig.label}趋势`}
        headerUnit={currentMetricConfig.unit}
        values={currentMetricConfig.data}
        valuesYoY={currentMetricConfig.dataYoY}
        xLabels={X_LABELS}
        showYoY={controls.showYoY}
        showTrend={controls.showAverage} // Using showTrend prop for average line based on user request for "均值" which often implies trend/avg line
        showExtremes={controls.showExtremes}
        width={1000} // Increased width for better visibility
        height={320}
        colorPrimary="#a40035"
        colorYoY="#94a3b8"
      />
    </div>
  );
};

export default HQMetricsTrendChart;
