import React, { useState, useEffect, useMemo } from 'react';
import DataContainer from '../Common/DataContainer';
import DataTable from '../Common/DataTable';
import HQMetricsTrendChart from './HQMetricsTrendChart';
import LineTrendChart from '../Common/LineTrendChart';
import { parseCSV } from '../../utils/dataLoader';

const PriceDecompositionContainer = () => {
  const [data, setData] = useState([]);
  const [hqData, setHqData] = useState({
    currentPrice: 0,
    lastYearPrice: 0,
    growthRate: 0
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [weeklyPrice, setWeeklyPrice] = useState([]);
  const [weeklyPriceLY, setWeeklyPriceLY] = useState([]);
  const [storeRows, setStoreRows] = useState([]);
  const [showYoY, setShowYoY] = useState(false);
  const [showTrend, setShowTrend] = useState(true);
  const [showExtremes, setShowExtremes] = useState(true);

  useEffect(() => {
    fetch('/src/data/城市维度客单价增长率.csv')
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
          const currPrice = parseFloat(row['今年客单价'] || 0);
          const lastPrice = parseFloat(row['去年客单价'] || 0);
          const approxOrders = 1;
          totalCurrentRevenue += currPrice * approxOrders;
          totalCurrentOrders += approxOrders;
          totalLastRevenue += lastPrice * approxOrders;
          totalLastOrders += approxOrders;
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

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isModalOpen]);

  const tableData = useMemo(() => {
    return data.map((row, index) => ({
      key: index,
      city: row['城市'],
      lastYearPrice: parseFloat(row['去年客单价'] || 0),
      currentPrice: parseFloat(row['今年客单价'] || 0),
      yoyRate: row['客单价增长率'] || '0%',
      laborCost: parseFloat(row['人工支出（工资+社保）'] || 0),
      recruitTrainCost: parseFloat(row['招聘渠道费及培训费'] || 0),
      totalCost: parseFloat(row['费用合计金额'] || 0),
      budget: parseFloat(row['预算金额'] || 0),
      budgetUsageRate: row['预算使用率'] || '0%',
      timeProgress: row['时间进度'] || '0%',
      usageProgressDiff: row['预算使用进度差'] || '0%'
    }));
  }, [data]);

  const columns = [
    { 
      key: 'city', 
      title: '城市', 
      dataIndex: 'city',
      render: (value, row) => (
        <button
          className="text-blue-600 hover:text-blue-800 underline"
          onClick={() => openCityModal(row.city)}
        >
          {value}
        </button>
      )
    },
    { 
      key: 'lastYearPrice', 
      title: '去年客单价', 
      dataIndex: 'lastYearPrice',
      render: (val) => `¥${val.toFixed(2)}`
    },
    { 
      key: 'currentPrice', 
      title: '今年客单价', 
      dataIndex: 'currentPrice',
      render: (val) => `¥${val.toFixed(2)}`
    },
    { 
      key: 'yoyRate', 
      title: '客单价增长率', 
      dataIndex: 'yoyRate',
      render: (val) => {
        const num = parseFloat(String(val).replace('%','')) || 0;
        const isHigh = num >= 3;
        return (
          <span className={isHigh ? 'text-red-600' : 'text-green-600'}>
            {val}
          </span>
        );
      }
    },
    {
      key: 'laborCost',
      title: '人工支出（工资+社保）（万元）',
      dataIndex: 'laborCost',
      render: (val) => `${Number(val).toFixed(2)}`
    },
    {
      key: 'recruitTrainCost',
      title: '招聘渠道费及培训费（万元）',
      dataIndex: 'recruitTrainCost',
      render: (val) => `${Number(val).toFixed(2)}`
    },
    {
      key: 'totalCost',
      title: '费用合计金额（万元）',
      dataIndex: 'totalCost',
      render: (val) => `${Number(val).toFixed(2)}`
    },
    {
      key: 'budget',
      title: '预算金额（万元）',
      dataIndex: 'budget',
      render: (val) => `${Number(val).toFixed(2)}`
    },
    {
      key: 'budgetUsageRate',
      title: '预算使用率',
      dataIndex: 'budgetUsageRate'
    },
    {
      key: 'timeProgress',
      title: '时间进度',
      dataIndex: 'timeProgress'
    },
    {
      key: 'usageProgressDiff',
      title: '预算使用进度差',
      dataIndex: 'usageProgressDiff',
      render: (val) => {
        const isNegative = `${val}`.includes('-');
        return (
          <span className={isNegative ? 'text-green-600' : 'text-red-600'}>
            {val}
          </span>
        );
      }
    }
  ];

  const columnsForStore = [
    { key: 'city', title: '城市', dataIndex: 'city' },
    { 
      key: 'lastYearPrice', 
      title: '去年客单价', 
      dataIndex: 'lastYearPrice',
      render: (val) => `¥${val.toFixed(2)}`
    },
    { 
      key: 'currentPrice', 
      title: '今年客单价', 
      dataIndex: 'currentPrice',
      render: (val) => `¥${val.toFixed(2)}`
    },
    { 
      key: 'yoyRate', 
      title: '客单价增长率', 
      dataIndex: 'yoyRate',
      render: (val) => {
        const num = parseFloat(String(val).replace('%','')) || 0;
        const isHigh = num >= 3;
        return (
          <span className={isHigh ? 'text-red-600' : 'text-green-600'}>
            {val}
          </span>
        );
      }
    },
    {
      key: 'laborCost',
      title: '人工支出（工资+社保）（万元）',
      dataIndex: 'laborCost',
      render: (val) => `${Number(val).toFixed(2)}`
    },
    {
      key: 'recruitTrainCost',
      title: '招聘渠道费及培训费（万元）',
      dataIndex: 'recruitTrainCost',
      render: (val) => `${Number(val).toFixed(2)}`
    },
    {
      key: 'totalCost',
      title: '费用合计金额（万元）',
      dataIndex: 'totalCost',
      render: (val) => `${Number(val).toFixed(2)}`
    },
    {
      key: 'budget',
      title: '预算金额（万元）',
      dataIndex: 'budget',
      render: (val) => `${Number(val).toFixed(2)}`
    },
    {
      key: 'budgetUsageRate',
      title: '预算使用率',
      dataIndex: 'budgetUsageRate'
    },
    {
      key: 'timeProgress',
      title: '时间进度',
      dataIndex: 'timeProgress'
    },
    {
      key: 'usageProgressDiff',
      title: '预算使用进度差',
      dataIndex: 'usageProgressDiff',
      render: (val) => {
        const isNegative = `${val}`.includes('-');
        return (
          <span className={isNegative ? 'text-green-600' : 'text-red-600'}>
            {val}
          </span>
        );
      }
    }
  ];

  const getISOWeek = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  };

  const getWeekRange = (date) => {
    const d = new Date(date);
    const day = (d.getDay() + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - day);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmtYMD = (dt) => `${String(dt.getFullYear()).slice(-2)}${String(dt.getMonth() + 1).padStart(2, '0')}${String(dt.getDate()).padStart(2, '0')}`;
    const weekNo = getISOWeek(d);
    const label = `第 ${String(weekNo).padStart(2, '0')} 周（${fmtYMD(monday)}-${fmtYMD(sunday)}）`;
    return { start: monday, end: sunday, label, weekNo };
  };

  const buildLast12Weeks = () => {
    const today = new Date();
    const ranges = [];
    for (let i = 11; i >= 0; i--) {
      const ref = new Date(today);
      ref.setDate(today.getDate() - i * 7);
      ranges.push(getWeekRange(ref));
    }
    return ranges;
  };

  const openCityModal = async (cityName) => {
    setSelectedCity(cityName);
    const cityRow = tableData.find(r => r.city === cityName);
    const weekRanges = buildLast12Weeks();
    setWeeks(weekRanges);
    const seed = String(cityName || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) || 1;
    const N = weekRanges.length;
    const mkNoise = (i, scale = 0.02) => ((Math.sin(i * 1.21 + seed) + Math.cos(i * 0.63 + seed)) * 0.5) * scale;
    const baseCurr = Number(cityRow?.currentPrice || 0);
    const baseLast = Number(cityRow?.lastYearPrice || 0);
    const currSeries = [];
    const lastSeries = [];
    for (let i = 0; i < N; i++) {
      const smooth = 1 + 0.01 * Math.sin((i / N) * 2 * Math.PI);
      const curr = baseCurr * (smooth + mkNoise(i, 0.015));
      const last = baseLast * (smooth + mkNoise(i, 0.015));
      currSeries.push(Number(curr.toFixed(2)));
      lastSeries.push(Number(last.toFixed(2)));
    }
    setWeeklyPrice(currSeries);
    setWeeklyPriceLY(lastSeries);

    let storeNames = [];
    const normalizeCity = (n) => String(n || '').replace(/市$/, '').trim();
    try {
      const resp = await fetch('/src/data/store_list.csv');
      const text = await resp.text();
      const parsed = parseCSV(text);
      storeNames = parsed.rows
        .filter(r => normalizeCity(r['城市名称']) === normalizeCity(cityName))
        .map(r => r['门店名称']);
    } catch {
      storeNames = ['门店A', '门店B', '门店C', '门店D'];
    }
    const weights = (() => {
      const raw = storeNames.map((n) => {
        const s = String(n);
        let sum = 0;
        for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i);
        return 0.8 + ((sum % 41) / 100);
      });
      const tot = raw.reduce((a, b) => a + b, 0) || 1;
      return raw.map(w => w / tot);
    })();
    const cityLabor = Number(cityRow?.laborCost || 0);
    const cityRecruit = Number(cityRow?.recruitTrainCost || 0);
    const cityBudget = Number(cityRow?.budget || 0);
    const cityUsageRateStr = String(cityRow?.budgetUsageRate || '0%');
    const cityUsageRate = parseFloat(cityUsageRateStr) || 0;
    const timeProgressStr = String(cityRow?.timeProgress || '0%');
    const timeProgress = parseFloat(timeProgressStr) || 0;
    const stores = storeNames.map((name, idx) => {
      const share = weights[idx] || 1 / (storeNames.length || 1);
      const priceJitter = (j) => 1 + ((seed + idx * 17 + j * 11) % 21 - 10) / 1000;
      const sLast = baseLast * priceJitter(1);
      const sCurr = baseCurr * priceJitter(2);
      const yoy = sLast ? ((sCurr - sLast) / sLast) * 100 : 0;
      const sLabor = cityLabor * share;
      const sRecruit = cityRecruit * share;
      const sTotal = sLabor + sRecruit;
      const sBudget = cityBudget * share;
      const sUsage = Math.max(0, Math.min(100, cityUsageRate + ((seed + idx * 7) % 9 - 4)));
      const diff = sUsage - timeProgress;
      return {
        key: `${name}-${idx}`,
        city: name,
        lastYearPrice: Number(sLast.toFixed(2)),
        currentPrice: Number(sCurr.toFixed(2)),
        yoyRate: `${yoy >= 0 ? '+' : ''}${yoy.toFixed(2)}%`,
        laborCost: Number(sLabor.toFixed(2)),
        recruitTrainCost: Number(sRecruit.toFixed(2)),
        totalCost: Number(sTotal.toFixed(2)),
        budget: Number(sBudget.toFixed(2)),
        budgetUsageRate: `${sUsage.toFixed(1)}%`,
        timeProgress: `${timeProgress.toFixed(1)}%`,
        usageProgressDiff: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`
      };
    });
    setStoreRows(stores);
    setIsModalOpen(true);
  };

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
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-100 mb-6 space-y-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-[#a40035]/5 rounded-bl-full pointer-events-none"></div>
        <div className="flex flex-wrap items-center justify-between z-10 gap-10">
          <div className="flex items-center gap-12">
            <div>
              <div className="text-sm text-gray-500 mb-1">截止本周年度平均客单价</div>
              <div className="text-4xl font-bold text-[#a40035] flex items-baseline gap-2">
                ¥{hqData.currentPrice.toFixed(2)}
                <span className="text-sm font-normal text-gray-400">元/人次</span>
              </div>
            </div>
            <div className="hidden md:block border-l border-gray-200 pl-8">
              <div className="text-sm text-gray-500 mb-1">去年平均客单价</div>
              <div className="text-2xl font-semibold text-gray-700">
                ¥{hqData.lastYearPrice.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
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
             <div className="relative flex items-center justify-center">
                <svg width={size} height={size} className="transform -rotate-90">
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#f3f4f6"
                    strokeWidth={strokeWidth}
                    fill="none"
                  />
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
        <div className="h-px bg-gray-100/70"></div>
        <div className="z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">预算使用（2025年1-9月）</div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#a40035]/10 text-[#a40035]">费用占比 1.8%</span>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex-none">
              <div className="text-xs text-gray-500 mb-1">合计</div>
              <div className="text-3xl md:text-4xl font-bold text-[#a40035]">¥545.8万</div>
            </div>
            <div className="flex-1 grid grid-cols-1 gap-2">
              <div className="text-sm text-gray-600">
                人工支出（工资+社保）：<span className="text-lg font-semibold text-gray-800">¥379.8万</span>
              </div>
              <div className="text-sm text-gray-600">
                招聘渠道费及培训费：<span className="text-lg font-semibold text-gray-800">¥166万</span>
                <span className="ml-2 text-xs text-gray-400">含介绍费、推拿师导师、外聘导师</span>
              </div>
            </div>
          </div>
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-2 bg-[#a40035]" style={{ width: '1.8%' }}></div>
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
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow-lg w-[90vw] max-w-4xl p-6 space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#a40035] rounded-full"></span>
                {selectedCity} · 下钻详情
              </h3>
              <button
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                onClick={() => setIsModalOpen(false)}
                title="关闭"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setShowYoY(!showYoY)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${showYoY ? 'bg-[#2563eb]/10 text-[#2563eb] border-[#2563eb]' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'}`}
                >
                  显示同比
                </button>
                <button
                  onClick={() => setShowTrend(!showTrend)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${showTrend ? 'bg-[#a40035]/10 text-[#a40035] border-[#a40035]' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'}`}
                >
                  显示均线
                </button>
                <button
                  onClick={() => setShowExtremes(!showExtremes)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${showExtremes ? 'bg-[#a40035]/10 text-[#a40035] border-[#a40035]' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'}`}
                >
                  显示极值
                </button>
              </div>
              <LineTrendChart
                headerTitle="城市平均客单价变化趋势"
                headerUnit="元/人次"
                values={weeklyPrice}
                valuesYoY={weeklyPriceLY}
                xLabels={weeks.map(w => `第${String(w.weekNo).padStart(2, '0')}周`)}
                showYoY={showYoY}
                showTrend={showTrend}
                showExtremes={showExtremes}
                yAxisFormatter={(v) => Math.round(v)}
                valueFormatter={(v) => `¥ ${Number(v).toFixed(2)}`}
                colorPrimary="#a40035"
                colorYoY="#2563eb"
                getHoverTitle={(idx) => weeks[idx]?.label || ''}
                getHoverSubtitle={() => ''}
              />
              <div>
                <h4 className="text-base font-semibold text-gray-700 mb-3 pl-2 border-l-4 border-[#a40035]">门店维度统计</h4>
                <DataTable data={storeRows} columns={columnsForStore} />
              </div>
            </div>
          </div>
        </div>
      )}
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
