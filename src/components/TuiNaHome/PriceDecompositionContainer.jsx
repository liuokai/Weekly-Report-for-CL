import React, { useState, useEffect, useMemo } from 'react';
import DataContainer from '../Common/DataContainer';
import DataTable from '../Common/DataTable';
import HQMetricsTrendChart from './HQMetricsTrendChart';
import { parseCSV } from '../../utils/dataLoader';

const PriceDecompositionContainer = () => {
  const [data, setData] = useState([]);
  const [hqData, setHqData] = useState({
    currentPrice: 0,
    lastYearPrice: 0,
    growthRate: 0
  });

  useEffect(() => {
    fetch('/src/data/3-客单价-城市维度客单价统计.csv')
      .then(res => res.text())
      .then(text => {
        const { rows } = parseCSV(text);
        setData(rows);

        // Calculate HQ totals
        let totalCurrentRevenue = 0;
        let totalCurrentOrders = 0;
        let totalLastRevenue = 0;
        let totalLastOrders = 0;

        rows.forEach(row => {
          totalCurrentRevenue += parseFloat(row['今年主营收'] || 0);
          totalCurrentOrders += parseFloat(row['今年订单量'] || 0);
          totalLastRevenue += parseFloat(row['上年主营收'] || 0);
          totalLastOrders += parseFloat(row['上年订单量'] || 0);
        });

        const currentPrice = totalCurrentOrders ? totalCurrentRevenue / totalCurrentOrders : 0;
        const lastYearPrice = totalLastOrders ? totalLastRevenue / totalLastOrders : 0;
        const growthRate = lastYearPrice ? ((currentPrice - lastYearPrice) / lastYearPrice) * 100 : 0;

        setHqData({
          currentPrice,
          lastYearPrice,
          growthRate
        });
      })
      .catch(err => console.error('Failed to load price data', err));
  }, []);

  const tableData = useMemo(() => {
    return data.map((row, index) => ({
      key: index,
      city: row['城市名称'],
      currentPrice: parseFloat(row['今年客单价'] || 0),
      lastYearPrice: parseFloat(row['上年客单价'] || 0),
      yoyRate: row['客单价增长率'] || '0%',
      isGrowth: row['是否增长'] !== '下降' 
    }));
  }, [data]);

  const columns = [
    { key: 'city', title: '城市名称', dataIndex: 'city' },
    { 
      key: 'currentPrice', 
      title: '今年客单价', 
      dataIndex: 'currentPrice',
      render: (val) => `¥${val.toFixed(2)}`
    },
    { 
      key: 'lastYearPrice', 
      title: '上年客单价', 
      dataIndex: 'lastYearPrice',
      render: (val) => `¥${val.toFixed(2)}`
    },
    { 
      key: 'yoyRate', 
      title: '同比变动', 
      dataIndex: 'yoyRate',
      render: (val) => {
        const isNegative = val.includes('-');
        return (
          <span className={isNegative ? 'text-green-600' : 'text-red-600'}>
            {val}
          </span>
        );
      }
    }
  ];

  const renderHQOverview = () => {
    const targetRate = 3.0;
    const isAchieved = hqData.growthRate >= targetRate;
    const diff = hqData.growthRate - targetRate;
    
    // Calculate progress for the circular indicator (max 100% visual if exceeded)
    // If growth is negative, progress is 0. If growth is 1.5% and target is 3%, progress is 50%.
    const progressPercent = Math.max(0, Math.min(100, (hqData.growthRate / targetRate) * 100));
    
    // Circle configuration
    const size = 100;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-100 mb-6 flex items-center justify-between relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute right-0 top-0 w-32 h-32 bg-[#a40035]/5 rounded-bl-full pointer-events-none"></div>

        <div className="flex gap-12 items-center z-10">
          {/* Main Metric: Current Price */}
          <div>
            <div className="text-sm text-gray-500 mb-1">截止本周年度平均客单价</div>
            <div className="text-4xl font-bold text-[#a40035] flex items-baseline gap-2">
              ¥{hqData.currentPrice.toFixed(2)}
              <span className="text-sm font-normal text-gray-400">元/人次</span>
            </div>
          </div>

          {/* Secondary Metric: Last Year Price */}
          <div className="hidden md:block border-l border-gray-200 pl-8">
            <div className="text-sm text-gray-500 mb-1">去年平均客单价</div>
            <div className="text-2xl font-semibold text-gray-700">
              ¥{hqData.lastYearPrice.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Target & Growth Visualization */}
        <div className="flex items-center gap-6 z-10">
           <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">增长率</div>
              <div className={`text-2xl font-bold ${hqData.growthRate >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {hqData.growthRate > 0 ? '+' : ''}{hqData.growthRate.toFixed(2)}%
              </div>
              <div className="text-xs text-gray-400 mt-1">
                目标: <span className="font-medium text-gray-600">{targetRate.toFixed(1)}%</span>
                <span className="mx-1">|</span>
                {isAchieved ? (
                  <span className="text-red-600">已达标 (+{diff.toFixed(2)}%)</span>
                ) : (
                  <span className="text-gray-500">未达标 ({diff.toFixed(2)}%)</span>
                )}
              </div>
           </div>

           {/* Circular Progress */}
           <div className="relative flex items-center justify-center">
              <svg width={size} height={size} className="transform -rotate-90">
                {/* Background Circle */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="#f3f4f6"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                {/* Progress Circle */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="#a40035"
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xs text-gray-400">达成率</span>
                <span className="text-sm font-bold text-[#a40035]">
                  {progressPercent.toFixed(0)}%
                </span>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const renderContent = () => (
    <div className="space-y-6">
      {renderHQOverview()}
      <HQMetricsTrendChart />
      <div>
        <h4 className="text-base font-semibold text-gray-700 mb-3 pl-2 border-l-4 border-[#a40035]">城市维度客单价对比</h4>
        <DataTable data={tableData} columns={columns} />
      </div>
    </div>
  );

  return (
    <DataContainer
      title="客单价拆解"
      data={{ rows: tableData }}
      renderContent={renderContent}
      maxHeight="none"
    />
  );
};

export default PriceDecompositionContainer;
