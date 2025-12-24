import React, { useState, useMemo } from 'react';
import { cityStoreMap } from '../../data/storeData';
import DataContainer from '../../components/Common/DataContainer';
import DataTable from '../../components/Common/DataTable';
import LineTrendChart from '../../components/Common/LineTrendChart';
import useFetchData from '../../hooks/useFetchData';
import BusinessTargets from '../../config/businessTargets';

const VolumeDecompositionContainer = () => {
  // 保持空数据状态，去掉填充的数据
  const [data] = useState([]);
  const [trendMetric, setTrendMetric] = useState('daily'); // 'daily' | 'cumulative'
  const [showYoY, setShowYoY] = useState(true);
  const [showAvg, setShowAvg] = useState(true);
  const [showExtremes, setShowExtremes] = useState(true);

  // Influence Analysis Chart State
  const [influenceMetric, setInfluenceMetric] = useState('duration'); // 'duration' | 'compliance' | 'utilization'
  const [showInfYoY, setShowInfYoY] = useState(true);
  const [showInfAvg, setShowInfAvg] = useState(true);
  const [showInfExtremes, setShowInfExtremes] = useState(true);
  
  // City Modal State
  const [selectedCity, setSelectedCity] = useState(null);

  // Fetch Data
  const { data: volumeTrendData } = useFetchData('getVolumeTrend', { metric: trendMetric });
  const { data: influenceCityData } = useFetchData('getVolumeInfluenceCity', { metric: influenceMetric });
  const { data: influenceTrendData } = useFetchData('getVolumeInfluenceTrend', { metric: influenceMetric });
  const { data: hqOverviewData } = useFetchData('getVolumeHQOverview');
  const { data: modalTrendData } = useFetchData('getVolumeCityModalTrend', { city: selectedCity, metric: influenceMetric });
  const { data: modalStoreData } = useFetchData('getVolumeCityModalStoreData', { city: selectedCity, metric: influenceMetric });
  const { data: cityBreakdownData } = useFetchData('getVolumeCityBreakdown');

  const tableData = useMemo(() => {
    let source = [];
    if (cityBreakdownData && cityBreakdownData.length > 0) {
      source = cityBreakdownData;
    } else {
      // Mock Fallback
      // Use original mock logic if needed or empty
      // We don't have the original mock data array here, but we can generate some or leave empty if preferred.
      // The original code had: const [data] = useState([]); and mapped it.
      // So if no data, we probably just return empty or generate some mock for demo.
      // Let's generate some mock data to keep the UI populated as requested.
      const cities = Object.keys(cityStoreMap);
      source = cities.map(city => ({
        city,
        current_volume: Math.floor(150000 + Math.random() * 50000),
        last_year_volume: Math.floor(140000 + Math.random() * 40000)
      }));
    }

    return source.map((row, index) => {
      const currentVol = parseInt(row.current_volume || 0, 10);
      const lastYearVol = parseInt(row.last_year_volume || 0, 10);
      let yoy = 0;
      if (lastYearVol > 0) {
        yoy = (currentVol - lastYearVol) / lastYearVol * 100;
      }
      
      return {
        key: index,
        city: row.city,
        currentVolume: currentVol,
        lastYearVolume: lastYearVol,
        yoyRate: `${yoy.toFixed(2)}%`
      };
    });
  }, [cityBreakdownData]);

  const columns = [
    { key: 'city', title: '城市名称', dataIndex: 'city' },
    { 
      key: 'currentVolume', 
      title: '今年客次量', 
      dataIndex: 'currentVolume',
      render: (val) => val.toLocaleString()
    },
    { 
      key: 'lastYearVolume', 
      title: '上年客次量', 
      dataIndex: 'lastYearVolume',
      render: (val) => val.toLocaleString()
    },
    { 
      key: 'yoyRate', 
      title: '同比变动', 
      dataIndex: 'yoyRate',
      render: (val) => {
        const num = parseFloat(val);
        const isNegative = num < 0;
        return (
          <span className={isNegative ? 'text-green-600' : 'text-red-600'}>
            {val}
          </span>
        );
      }
    }
  ];

  const renderHQOverview = () => {
    let currentVolume, lastYearVolume, totalExpense, laborCostTotal, laborCity, laborOps, marketingDiscount;

    if (hqOverviewData && hqOverviewData.length > 0) {
      const d = hqOverviewData[0];
      currentVolume = parseInt(d.current_volume || 0, 10);
      lastYearVolume = parseInt(d.last_year_volume || 0, 10);
      totalExpense = parseFloat(d.total_expense || 0);
      laborCostTotal = parseFloat(d.labor_cost_total || 0);
      laborCity = parseFloat(d.labor_city || 0);
      laborOps = parseFloat(d.labor_ops || 0);
      marketingDiscount = parseFloat(d.marketing_discount || 0);
    } else {
      // Data hardcoded as per requirement (fallback)
      currentVolume = 2184710;
      lastYearVolume = 2200000;
      totalExpense = 3011; // 万
      laborCostTotal = 372; // 万
      laborCity = 309; // 万
      laborOps = 62.3; // 万
      marketingDiscount = 2640; // 万
    }

    const growthRate = lastYearVolume ? ((currentVolume - lastYearVolume) / lastYearVolume) * 100 : 0;
     
     // Use fetched or fallback ratio. For fallback it is 9.9.
     const expenseRatio = (hqOverviewData && hqOverviewData.length > 0) 
        ? 9.9 // Placeholder if real calc needed
        : 9.9;

    // Target from Config
    const targetVolume = BusinessTargets.turnover.volumeDecomposition.annualCumulativeTarget || 0;
    const completionRate = targetVolume ? (currentVolume / targetVolume) * 100 : 0;

    // Circle configuration for "No Target"
    const size = 100;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    
    const progressPercent = Math.min(completionRate, 100); 
    const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-100 mb-6 space-y-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-[#a40035]/5 rounded-bl-full pointer-events-none"></div>
        
        {/* Part 1: Volume Stats */}
        <div className="flex flex-wrap items-center justify-between z-10 gap-10">
          <div className="flex items-center gap-12">
            <div>
              <div className="text-sm text-gray-500 mb-1">截止本周年度累计客次量</div>
              <div className="text-4xl font-bold text-[#a40035] flex items-baseline gap-2">
                {currentVolume.toLocaleString()}
                <span className="text-sm font-normal text-gray-400">人次</span>
              </div>
            </div>
            <div className="hidden md:block border-l border-gray-200 pl-8">
              <div className="text-sm text-gray-500 mb-1">去年累计客次量</div>
              <div className="text-2xl font-semibold text-gray-700">
                {lastYearVolume.toLocaleString()}
                <span className="text-sm font-normal text-gray-400 ml-1">人次</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">增长率</div>
                <div className={`text-2xl font-bold ${growthRate >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {growthRate > 0 ? '+' : ''}{growthRate.toFixed(2)}%
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  目标: <span className="font-medium text-gray-600">{targetVolume ? (targetVolume / 10000).toFixed(0) + '万' : '暂无'}</span>
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
                  <span className={`text-sm font-bold ${completionRate >= 100 ? 'text-[#a40035]' : 'text-gray-600'}`}>
                    {completionRate ? completionRate.toFixed(1) + '%' : '—'}
                  </span>
                </div>
             </div>
          </div>
        </div>

        <div className="h-px bg-gray-100/70"></div>

        {/* Part 2: Budget Stats */}
        <div className="z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600 font-bold">预算使用（2025年1-9月）</div>
            <div className="flex items-center">
               <span className="px-3 py-1 rounded-full bg-[#a40035]/10 text-[#a40035] text-sm font-bold">
                 费用占比 {expenseRatio}%
               </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-12">
              {/* Total Expense */}
              <div className="flex-none">
                <div className="text-xs text-gray-500 mb-1">支出合计</div>
                <div className="text-3xl font-bold text-[#a40035]">¥{totalExpense}万</div>
              </div>
              
              {/* Vertical List of Items */}
              <div className="flex flex-col gap-3 flex-1 border-l border-gray-200 pl-8">
                {/* Marketing */}
                <div className="flex items-center justify-between">
                   <span className="text-sm text-gray-600">营销折扣</span>
                   <span className="text-lg font-bold text-gray-800">¥{marketingDiscount}万</span>
                </div>
                
                {/* Labor */}
                <div>
                   <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">用户中心人工支出</span>
                      <span className="text-lg font-bold text-gray-800">¥{laborCostTotal}万</span>
                   </div>
                   <div className="text-xs text-gray-400 mt-1 text-right space-x-3">
                      <span>城市总: ¥{laborCity}万</span>
                      <span>会员运营/品控: ¥{laborOps}万</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Single Progress Bar */}
            <div>
               <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-[#a40035] h-2 rounded-full" style={{ width: `${expenseRatio}%` }}></div>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTrendChart = () => {
    // Data Generation
    const months = Array.from({length: 12}, (_, i) => `25年${i+1}月`);
    
    let values, valuesYoY, title, unit, yAxisFormatter;

    if (volumeTrendData && volumeTrendData.length > 0) {
      const sorted = [...volumeTrendData].sort((a, b) => a.month - b.month);
      values = sorted.map(d => parseFloat(d.current_value));
      valuesYoY = sorted.map(d => parseFloat(d.last_year_value));
    } else {
      // Mock Fallback
      // Daily Avg Base Data (Mean ~6000)
      const base2025 = [5842, 5920, 6105, 6050, 6310, 6200, 5900, 5850, 6150, 6400, 6100, 5950];
      const base2024 = base2025.map(v => Math.round(v * 0.95 + (Math.random() * 200 - 100)));

      if (trendMetric === 'daily') {
        values = base2025;
        valuesYoY = base2024;
      } else {
        // Cumulative Sum based on varying monthly days
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        const calculateCumulative = (dailyAvgs) => {
          let cum = 0;
          return dailyAvgs.map((avg, i) => {
            cum += avg * daysInMonth[i];
            return cum;
          });
        };
        values = calculateCumulative(base2025);
        valuesYoY = calculateCumulative(base2024);
      }
    }

    if (trendMetric === 'daily') {
      title = "天均客次量趋势";
      unit = "人次";
      yAxisFormatter = (v) => Math.round(v).toLocaleString();
    } else {
      title = "年度累计客次量趋势";
      unit = "人次";
      yAxisFormatter = (v) => Math.round(v).toLocaleString();
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mt-6">
        <div className="mb-6 space-y-4">
          {/* Row 1: Metrics */}
          <div className="flex flex-wrap items-center gap-3">
             <button 
               className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${trendMetric === 'daily' ? 'bg-[#a40035] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
               onClick={() => setTrendMetric('daily')}
             >
               天均客次量
             </button>
             <button 
               className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${trendMetric === 'cumulative' ? 'bg-[#a40035] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
               onClick={() => setTrendMetric('cumulative')}
             >
               年度累计客次量
             </button>
          </div>
          
          {/* Row 2: Options */}
          <div className="flex flex-wrap items-center gap-3">
             <button 
               className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${showYoY ? 'bg-[#a40035] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
               onClick={() => setShowYoY(!showYoY)}
             >
               显示同比
             </button>
             <button 
               className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${showAvg ? 'bg-[#a40035] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
               onClick={() => setShowAvg(!showAvg)}
             >
               显示均值
             </button>
             <button 
               className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${showExtremes ? 'bg-[#a40035] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
               onClick={() => setShowExtremes(!showExtremes)}
             >
               显示极值
             </button>
          </div>
        </div>

        <LineTrendChart
          headerTitle={title}
          headerUnit={unit}
          values={values}
          valuesYoY={valuesYoY}
          xLabels={months}
          showYoY={showYoY}
          showAverage={showAvg}
          showExtremes={showExtremes}
          currentLabel="2025年"
          lastLabel="2024年"
          height={350}
          yAxisFormatter={yAxisFormatter}
          valueFormatter={(v) => Math.round(v).toLocaleString()}
        />
      </div>
    );
  };

  const renderCityModal = () => {
    if (!selectedCity) return null;

    const metricNameMap = {
      duration: "推拿师天均服务时长",
      compliance: "推拿师天均服务时长不达标占比",
      utilization: "床位利用率",
      active_members: "活跃会员数",
      churn_rate: "会员流失率",
      review_rate: "主动评价率"
    };

    // Mock Trend Data for City
    const months = Array.from({length: 12}, (_, i) => `25年${i+1}月`);
    let trendValues = [];
    
    if (modalTrendData && modalTrendData.length > 0) {
      // Assuming modalTrendData returns [{month: 1, value: 123}, ...]
      // We need to map it to 12 months
      trendValues = months.map((_, i) => {
        const match = modalTrendData.find(d => d.month === (i + 1));
        return match ? parseFloat(match.value) : 0;
      });
    } else {
      // Mock Fallback
      if (influenceMetric === 'duration') trendValues = months.map(() => Math.floor(280 + Math.random() * 40));
      else if (influenceMetric === 'compliance') trendValues = months.map(() => parseFloat((15 + Math.random() * 20).toFixed(2)));
      else if (influenceMetric === 'utilization') trendValues = months.map(() => parseFloat((2.5 + Math.random()).toFixed(2)));
      else if (influenceMetric === 'active_members') trendValues = months.map(() => Math.floor(8000 + Math.random() * 4000));
      else if (influenceMetric === 'churn_rate') trendValues = months.map(() => parseFloat((2 + Math.random() * 4).toFixed(2)));
      else trendValues = months.map(() => parseFloat((60 + Math.random() * 20).toFixed(2)));
    }

    // Mock Store Data
    let storeData = [];
    if (modalStoreData && modalStoreData.length > 0) {
      // Pivot fetched data
      // Expecting [{store_name, month, value}, ...]
      const storeMap = {};
      modalStoreData.forEach(d => {
        if (!storeMap[d.store_name]) {
          storeMap[d.store_name] = { key: d.store_name, store: d.store_name };
        }
        storeMap[d.store_name][`m${d.month}`] = d.value;
      });
      storeData = Object.values(storeMap);
    } else {
      // Mock Fallback
      const storeList = cityStoreMap[selectedCity] || [];
      storeData = storeList.map((storeName, i) => {
        // Generate 12 months of data for each store
        let rowData = {
          key: i,
          store: storeName,
        };
        
        months.forEach((month, idx) => {
           // Simulate data based on metric
           let val;
           if (influenceMetric === 'duration') val = 280 + Math.random() * 40;
           else if (influenceMetric === 'compliance') val = 15 + Math.random() * 20;
           else if (influenceMetric === 'utilization') val = 2.5 + Math.random();
           else if (influenceMetric === 'active_members') val = 800 + Math.random() * 400; // Store level is smaller
           else if (influenceMetric === 'churn_rate') val = 2 + Math.random() * 4;
           else val = 60 + Math.random() * 20; // review_rate
           
           rowData[`m${idx+1}`] = val;
        });
        
        return rowData;
      });
    }

    const getMetricConfig = () => {
       switch(influenceMetric) {
         case 'duration': return { title: '推拿师天均服务时长', unit: '分钟', isGood: v => v >= 300 };
         case 'compliance': return { title: '推拿师天均服务时长不达标占比', unit: '%', isGood: v => v <= 25 };
         case 'utilization': return { title: '床位利用率', unit: '', isGood: v => v >= 3 };
         case 'active_members': return { title: '活跃会员数', unit: '人', isGood: () => false };
         case 'churn_rate': return { title: '会员流失率', unit: '%', isGood: v => v <= 5 };
         case 'review_rate': return { title: '主动评价率', unit: '%', isGood: v => v >= 70 };
         default: return { title: '', unit: '', isGood: () => false };
       }
    };
    const config = getMetricConfig();

    const storeColumns = [
      { key: 'store', title: '门店名称', dataIndex: 'store', fixed: 'left', width: 120 },
      ...months.map((month, idx) => ({
        key: `m${idx+1}`,
        title: month,
        dataIndex: `m${idx+1}`,
        render: (val) => {
           let displayVal = val;
           if (influenceMetric === 'duration' || influenceMetric === 'active_members') {
              displayVal = Math.round(val).toLocaleString();
           } else if (influenceMetric === 'utilization') {
              displayVal = val.toFixed(2);
           } else {
              displayVal = `${val.toFixed(2)}%`;
           }

           let colorClass = 'text-gray-700';
           if (influenceMetric !== 'active_members') {
              colorClass = config.isGood(val) ? 'text-red-600 font-bold' : 'text-gray-700';
           }
           return <span className={colorClass}>{displayVal}</span>;
        }
      }))
    ];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedCity(null)}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
             <h3 className="text-xl font-bold text-gray-800">{selectedCity} - {metricNameMap[influenceMetric]}分析</h3>
             <button onClick={() => setSelectedCity(null)} className="text-gray-400 hover:text-gray-600">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>
          </div>
          
          <div className="p-6 space-y-8">
            {/* Top: Trend Chart */}
            <div>
              <h4 className="text-sm font-bold text-gray-600 mb-4 border-l-4 border-[#a40035] pl-2">月度趋势</h4>
              <LineTrendChart
                headerTitle={`${metricNameMap[influenceMetric]}趋势`}
                values={trendValues}
                xLabels={months}
                height={300}
                valueFormatter={(v) => {
                   if (influenceMetric === 'duration' || influenceMetric === 'active_members') return Math.round(v).toLocaleString();
                   return influenceMetric === 'utilization' ? v.toFixed(2) : `${v.toFixed(2)}%`;
                }}
              />
            </div>

            {/* Bottom: Store Table */}
            <div>
              <h4 className="text-sm font-bold text-gray-600 mb-4 border-l-4 border-[#a40035] pl-2">门店数据明细</h4>
              <DataTable data={storeData} columns={storeColumns} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInfluenceTable = () => {
    const cities = Object.keys(cityStoreMap);
    const months = Array.from({length: 12}, (_, i) => `25年${i+1}月`);
    
    // Generate City Data with 12 months
    let cityData = [];
    
    if (influenceCityData && influenceCityData.length > 0) {
      // Pivot fetched data: [{city, month, value}, ...]
      const map = {};
      influenceCityData.forEach(item => {
         if (!map[item.city]) {
           map[item.city] = { key: item.city, city: item.city };
         }
         // item.month is expected to be 1-12
         map[item.city][`m${item.month}`] = item.value;
      });
      cityData = Object.values(map);
    } else {
      // Mock Data Generation
      cityData = cities.map((city, index) => {
        let rowData = { key: index, city };
        
        months.forEach((_, idx) => {
           let val;
           if (influenceMetric === 'duration') val = 280 + Math.random() * 40;
           else if (influenceMetric === 'compliance') val = 15 + Math.random() * 20;
           else if (influenceMetric === 'utilization') val = 2.5 + Math.random();
           else if (influenceMetric === 'active_members') val = 5000 + Math.random() * 10000;
           else if (influenceMetric === 'churn_rate') val = 2 + Math.random() * 4;
           else val = 60 + Math.random() * 20; // review_rate
           
           rowData[`m${idx+1}`] = val;
        });

        return rowData;
      });
    }

    const getMetricConfig = () => {
       switch(influenceMetric) {
         case 'duration': return { title: '推拿师天均服务时长', unit: '分钟', isGood: v => v >= 300 };
         case 'compliance': return { title: '推拿师天均服务时长不达标占比', unit: '%', isGood: v => v <= 25 };
         case 'utilization': return { title: '床位利用率', unit: '', isGood: v => v >= 3 };
         case 'active_members': return { title: '活跃会员数', unit: '人', isGood: () => false };
         case 'churn_rate': return { title: '会员流失率', unit: '%', isGood: v => v <= 5 };
         case 'review_rate': return { title: '主动评价率', unit: '%', isGood: v => v >= 70 };
         default: return { title: '', unit: '', isGood: () => false };
       }
    };

    const config = getMetricConfig();

    const columns = [
      { 
        key: 'city', 
        title: '城市', 
        dataIndex: 'city',
        fixed: 'left',
        width: 100,
        render: (text) => (
          <span 
            className="text-[#a40035] cursor-pointer hover:underline font-medium"
            onClick={() => setSelectedCity(text)}
          >
            {text}
          </span>
        )
      },
      ...months.map((month, idx) => ({
        key: `m${idx+1}`,
        title: month,
        dataIndex: `m${idx+1}`,
        render: (val) => {
           let displayVal = val;
           if (influenceMetric === 'duration' || influenceMetric === 'active_members') {
              displayVal = Math.round(val).toLocaleString();
              // Remove unit for dense table, or keep if preferred. User didn't specify, but dense is better for 12 cols.
           } else if (influenceMetric === 'utilization') {
              displayVal = val.toFixed(2);
           } else {
              displayVal = `${val.toFixed(2)}%`;
           }

           let colorClass = 'text-gray-700';
            if (influenceMetric !== 'active_members') {
               colorClass = config.isGood(val) ? 'text-red-600 font-bold' : 'text-gray-700';
            }
 
            return <span className={colorClass}>{displayVal}</span>;
        }
      }))
    ];

    return (
      <div className="mt-8 border-t border-gray-100 pt-6">
         <h4 className="text-sm font-bold text-gray-800 mb-4">城市维度数据统计</h4>
         <DataTable data={cityData} columns={columns} stickyHeader={true} />
      </div>
    );
  };

  const renderInfluenceAnalysisChart = () => {
    const months = Array.from({length: 12}, (_, i) => `25年${i+1}月`);
    let values, valuesYoY, title, unit, yAxisFormatter, valueFormatter;

    if (influenceTrendData && influenceTrendData.length > 0) {
      const sorted = [...influenceTrendData].sort((a, b) => a.month - b.month);
      values = sorted.map(d => parseFloat(d.current_value));
      valuesYoY = sorted.map(d => parseFloat(d.last_year_value));
      
      // Basic formatting based on metric
      if (influenceMetric === 'duration') {
        title = "推拿师天均服务时长";
        unit = "分钟";
        yAxisFormatter = (v) => Math.round(v);
        valueFormatter = (v) => `${Math.round(v)}分钟`;
      } else if (influenceMetric === 'compliance') {
        title = "推拿师天均服务时长不达标占比";
        unit = "%";
        yAxisFormatter = (v) => `${Number(v.toFixed(2))}%`;
        valueFormatter = (v) => `${Number(v.toFixed(2))}%`;
      } else if (influenceMetric === 'utilization') {
        title = "床位利用率";
        unit = "";
        yAxisFormatter = (v) => Number(v.toFixed(2));
        valueFormatter = (v) => Number(v.toFixed(2));
      } else if (influenceMetric === 'active_members') {
        title = "活跃会员数";
        unit = "人";
        yAxisFormatter = (v) => (v / 10000).toFixed(1) + '万';
        valueFormatter = (v) => v.toLocaleString();
      } else if (influenceMetric === 'churn_rate') {
        title = "会员流失率";
        unit = "%";
        yAxisFormatter = (v) => `${Number(v.toFixed(2))}%`;
        valueFormatter = (v) => `${Number(v.toFixed(2))}%`;
      } else { // review_rate
        title = "主动评价率";
        unit = "%";
        yAxisFormatter = (v) => `${Number(v.toFixed(2))}%`;
        valueFormatter = (v) => `${Number(v.toFixed(2))}%`;
      }
    } else {
      // Mock Fallback
      if (influenceMetric === 'duration') {
        title = "推拿师天均服务时长";
        unit = "分钟";
        // Target 300, fluctuate around it
        values = [292, 305, 310, 288, 302, 308, 296, 304, 312, 298, 300, 306];
        valuesYoY = values.map(v => Math.round(v * 0.98 + (Math.random() * 10 - 5)));
        yAxisFormatter = (v) => Math.round(v);
        valueFormatter = (v) => `${Math.round(v)}分钟`;
      } else if (influenceMetric === 'compliance') {
        title = "推拿师天均服务时长不达标占比";
        unit = "%";
        // Target 25% (<= 25% is good). Simulate around 20-30%
        values = [22.5, 24.0, 26.5, 25.0, 28.2, 23.5, 21.0, 25.5, 27.0, 24.5, 22.0, 23.5];
        valuesYoY = values.map(v => parseFloat((v + (Math.random() * 4 - 2)).toFixed(1)));
        yAxisFormatter = (v) => `${Number(v.toFixed(2))}%`;
        valueFormatter = (v) => `${Number(v.toFixed(2))}%`;
      } else if (influenceMetric === 'utilization') { // utilization
        title = "床位利用率";
        unit = "";
        // Target 3 (>3 is good). Simulate around 2.5 - 3.5
        values = [2.8, 2.9, 3.1, 3.2, 3.0, 3.3, 3.1, 2.9, 3.0, 3.2, 3.1, 3.0];
        valuesYoY = values.map(v => parseFloat((v - 0.1 + (Math.random() * 0.2 - 0.1)).toFixed(2)));
        yAxisFormatter = (v) => Number(v.toFixed(2));
        valueFormatter = (v) => Number(v.toFixed(2));
      } else if (influenceMetric === 'active_members') {
        title = "活跃会员数";
        unit = "人";
        // Target ~110,000. Simulate around 108k - 115k
        values = [108500, 109200, 110500, 111000, 112500, 111800, 110200, 109800, 111200, 113500, 112000, 111500];
        valuesYoY = values.map(v => Math.round(v * 0.9 + (Math.random() * 2000 - 1000)));
        yAxisFormatter = (v) => (v / 10000).toFixed(1) + '万';
        valueFormatter = (v) => v.toLocaleString();
      } else if (influenceMetric === 'churn_rate') {
        title = "会员流失率";
        unit = "%";
        // Target < 5%. Simulate around 2% - 4.8%
        values = [3.2, 3.5, 2.8, 3.0, 4.2, 3.8, 3.1, 2.9, 3.5, 4.5, 3.6, 3.3];
        valuesYoY = values.map(v => parseFloat((v + (Math.random() * 1 - 0.5)).toFixed(1)));
        yAxisFormatter = (v) => `${Number(v.toFixed(2))}%`;
        valueFormatter = (v) => `${Number(v.toFixed(2))}%`;
      } else { // review_rate
        title = "主动评价率";
        unit = "%";
        // Target ~70%. Simulate around 65% - 75%
        values = [68.5, 69.2, 70.5, 71.0, 69.8, 72.5, 71.2, 70.8, 69.5, 71.8, 70.2, 69.9];
        valuesYoY = values.map(v => parseFloat((v - 2 + (Math.random() * 3 - 1.5)).toFixed(1)));
        yAxisFormatter = (v) => `${Number(v.toFixed(2))}%`;
        valueFormatter = (v) => `${Number(v.toFixed(2))}%`;
      }
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mt-6">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800">客次量·影响指标分析</h3>
        </div>

        <div className="mb-6 space-y-4">
          {/* Row 1: Metrics */}
          <div className="flex flex-wrap items-center gap-3">
             <button 
               className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${influenceMetric === 'duration' ? 'bg-[#a40035] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
               onClick={() => setInfluenceMetric('duration')}
             >
               推拿师天均服务时长
             </button>
             <button 
               className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${influenceMetric === 'compliance' ? 'bg-[#a40035] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
               onClick={() => setInfluenceMetric('compliance')}
             >
               推拿师天均服务时长不达标占比
             </button>
             <button 
               className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${influenceMetric === 'utilization' ? 'bg-[#a40035] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
               onClick={() => setInfluenceMetric('utilization')}
             >
               床位利用率
             </button>
             <button 
               className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${influenceMetric === 'active_members' ? 'bg-[#a40035] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
               onClick={() => setInfluenceMetric('active_members')}
             >
               活跃会员数
             </button>
             <button 
               className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${influenceMetric === 'churn_rate' ? 'bg-[#a40035] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
               onClick={() => setInfluenceMetric('churn_rate')}
             >
               会员流失率
             </button>
             <button 
               className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${influenceMetric === 'review_rate' ? 'bg-[#a40035] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
               onClick={() => setInfluenceMetric('review_rate')}
             >
               主动评价率
             </button>
          </div>
          
          {/* Row 2: Options */}
          <div className="flex flex-wrap items-center gap-3">
             <button 
               className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${showInfYoY ? 'bg-[#a40035] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
               onClick={() => setShowInfYoY(!showInfYoY)}
             >
               显示同比
             </button>
             <button 
               className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${showInfAvg ? 'bg-[#a40035] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
               onClick={() => setShowInfAvg(!showInfAvg)}
             >
               显示均值
             </button>
             <button 
               className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${showInfExtremes ? 'bg-[#a40035] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
               onClick={() => setShowInfExtremes(!showInfExtremes)}
             >
               显示极值
             </button>
          </div>
        </div>

        <LineTrendChart
          headerTitle={title}
          headerUnit={unit}
          values={values}
          valuesYoY={valuesYoY}
          xLabels={months}
          showYoY={showInfYoY}
          showAverage={showInfAvg}
          showExtremes={showInfExtremes}
          currentLabel="2025年"
          lastLabel="2024年"
          height={350}
          yAxisFormatter={yAxisFormatter}
          valueFormatter={valueFormatter}
        />
        
        {renderInfluenceTable()}
      </div>
    );
  };

  const renderContent = () => (
    <div className="space-y-6">
      {renderCityModal()}
      {renderHQOverview()}
      {renderTrendChart()}
      {renderInfluenceAnalysisChart()}
      <DataTable data={tableData} columns={columns} />
    </div>
  );

  return (
    <DataContainer
      title="客次量拆解"
      data={{ rows: tableData }}
      renderContent={renderContent}
      maxHeight="none"
    />
  );
};

export default VolumeDecompositionContainer;
