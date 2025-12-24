import React, { useState, useEffect, useMemo } from 'react';
import DataContainer from '../../components/Common/DataContainer';
import DataTable from '../../components/Common/DataTable';
import HQMetricsTrendChart from './HQMetricsTrendChart';
import LineTrendChart from '../../components/Common/LineTrendChart';
import useFetchData from '../../hooks/useFetchData';
import BusinessTargets from '../../config/businessTargets';

const PriceDecompositionContainer = () => {
  // data state is no longer needed as we use priceGrowthData directly
  // const [data, setData] = useState([]); 
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
  const [procMetric, setProcMetric] = useState('returnRate');
  const [procWeeks, setProcWeeks] = useState([]);
  const [procValues, setProcValues] = useState([]);
  const [procValuesLY, setProcValuesLY] = useState([]);
  const [procShowYoY, setProcShowYoY] = useState(false);
  const [procShowTrend, setProcShowTrend] = useState(true);
  const [procShowExtremes, setProcShowExtremes] = useState(true);
  const [procCityRows, setProcCityRows] = useState([]);
  const [procColumnsDyn, setProcColumnsDyn] = useState([]);

  // Fetch trend data and city data using SQL
  const { data: fetchedTrendData, loading: trendLoading } = useFetchData('getProcessMetricTrend', { metric: procMetric });
  const { data: fetchedCityData, loading: cityLoading } = useFetchData('getProcessCityData', { metric: procMetric });
  // Fetch city price growth data
  const { data: priceGrowthData } = useFetchData('getCityPriceGrowth');

  const [modalContextCity, setModalContextCity] = useState(null);
  
  // Fetch modal data
  const { data: modalTrendData } = useFetchData('getCityModalTrend', { 
    entity: selectedCity, 
    city: modalContextCity, 
    metric: procMetric 
  });
  const { data: modalStoreData } = useFetchData('getCityModalStoreData', { 
    entity: selectedCity, 
    city: modalContextCity, 
    metric: procMetric 
  });

  const impactInfos = useMemo(() => {
    const config = BusinessTargets.turnover.impactAnalysis;
    const formatBudget = (val) => val > 0 ? `¥${val}万` : '';

    return {
      returnRate: {
        name: '项目回头率',
        unit: '%',
        target: config.projectRetention.target,
        actual: 29.8,
        last: 32.1,
        budget: {
          wageBudget: formatBudget(config.projectRetention.budget.wage),
          otherBudget: formatBudget(config.projectRetention.budget.other),
          ratio: '0.55%'
        },
        actualCosts: [
          { label: '外聘导师费', amount: 285474 },
          { label: '技术总监成本', amount: 741700 },
          { label: '课程制作成本', amount: 77593 }
        ],
        actualTotal: 1027174
      },
      configRatio: {
        name: '床位人员配置比',
        unit: '',
        target: config.bedStaffRatio.target,
        actual: 0.57,
        last: 0.52,
        budget: {
          wageBudget: formatBudget(config.bedStaffRatio.budget.wage),
          otherBudget: formatBudget(config.bedStaffRatio.budget.other),
          ratio: '0.34%'
        },
        actualCosts: [
          { label: '招生招聘费合计', amount: '¥979000' }
        ],
        actualTotal: '',
        actualRatio: '0.32%'
      },
      newEmpReturn: {
        name: '新员工回头率达标率',
        unit: '%',
        target: config.newEmployeeRetention.target,
        actual: 88.0,
        last: null,
        budget: {
          wageBudget: formatBudget(config.newEmployeeRetention.budget.wage),
          otherBudget: formatBudget(config.newEmployeeRetention.budget.other),
          ratio: '0.84%'
        },
        actualCosts: [
          { label: '岗前培训费', amount: 902163 },
          { label: '技术副总成本', amount: 1642423 }
        ],
        actualTotal: 2544586
      },
      therapistYield: {
        name: '推拿师产值达标率',
        unit: '%',
        target: config.therapistOutput.target,
        actual: 79.0,
        last: null,
        budget: {
          wageBudget: formatBudget(config.therapistOutput.budget.wage),
          otherBudget: formatBudget(config.therapistOutput.budget.other),
          ratio: ''
        },
        actualCosts: [
          { label: '人事经理薪酬成本', amount: '¥206000' }
        ],
        actualTotal: '',
        salaryShare: '46.5%'
      }
    };
  }, []);

  useEffect(() => {
    // Override HQ data with manually configured values
    const { lastYearAveragePrice } = BusinessTargets.turnover.priceDecomposition;
    
    // Simulated current average price (mock value)
    const currentAveragePrice = 298.2;

    // Calculate growth rate based on Current and Last Year prices
    // Growth Rate = ((Current - Last) / Last) * 100
    const growthRate = lastYearAveragePrice 
      ? ((currentAveragePrice - lastYearAveragePrice) / lastYearAveragePrice) * 100 
      : 0;

    setHqData({
      currentPrice: currentAveragePrice,
      lastYearPrice: lastYearAveragePrice,
      growthRate
    });

    // Original data aggregation logic disabled to favor manual configuration
    /* 
    if (priceGrowthData && priceGrowthData.length > 0) {
      ...
    }
    */
  }, [priceGrowthData]);

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
    let source = [];
    if (priceGrowthData && priceGrowthData.length > 0) {
      source = priceGrowthData;
    } else {
      // Mock Fallback
      const cities = ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '武汉', '西安', '苏州'];
      source = cities.map((city, i) => {
         const lastYearPrice = 280 + Math.random() * 40;
         const currentPrice = lastYearPrice * (1 + (Math.random() * 0.1 - 0.02));
         const growthRate = ((currentPrice - lastYearPrice) / lastYearPrice * 100).toFixed(2) + '%';
         
         const laborCost = 30 + Math.random() * 10;
         const recruitTrainCost = 10 + Math.random() * 5;
         const totalCost = laborCost + recruitTrainCost;
         const budget = 50 + Math.random() * 10;
         const budgetUsageRate = ((totalCost / budget) * 100).toFixed(1) + '%';
         const timeProgress = '75.0%';
         const usageDiff = (parseFloat(budgetUsageRate) - 75).toFixed(1) + '%';

         return {
            city,
            last_year_price: lastYearPrice,
            current_price: currentPrice,
            growth_rate: growthRate,
            labor_cost: laborCost,
            recruit_train_cost: recruitTrainCost,
            total_cost: totalCost,
            budget: budget,
            budget_usage_rate: budgetUsageRate,
            time_progress: timeProgress,
            usage_progress_diff: usageDiff
         };
      });
    }

    return source.map((row, index) => ({
      key: index,
      city: row.city,
      lastYearPrice: parseFloat(row.last_year_price || 0),
      currentPrice: parseFloat(row.current_price || 0),
      yoyRate: row.growth_rate || '0%',
      laborCost: parseFloat(row.labor_cost || 0),
      recruitTrainCost: parseFloat(row.recruit_train_cost || 0),
      totalCost: parseFloat(row.total_cost || 0),
      budget: parseFloat(row.budget || 0),
      budgetUsageRate: row.budget_usage_rate || '0%',
      timeProgress: row.time_progress || '0%',
      usageProgressDiff: row.usage_progress_diff || '0%'
    }));
  }, [priceGrowthData]);

  const [modalColumns, setModalColumns] = useState([]);

  const columns = [
    { 
      key: 'city', 
      title: '城市', 
      dataIndex: 'city',
      render: (value, row) => (
        <button
          className="text-[#a40035] hover:underline font-medium"
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
        const targetRate = BusinessTargets.turnover.priceDecomposition.targetGrowthRate || 3;
        const isHigh = num >= targetRate;
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
        const targetRate = BusinessTargets.turnover.priceDecomposition.targetGrowthRate || 3;
        const isHigh = num >= targetRate;
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

  const procColumnsDefault = [
    { key: 'city', title: '城市', dataIndex: 'city' },
    { key: 'value', title: '指标值', dataIndex: 'value' },
    { key: 'target', title: '目标', dataIndex: 'target' },
    { key: 'status', title: '达标', dataIndex: 'status',
      render: (val) => {
        const cls = val === '达标' ? 'text-green-600' : 'text-red-600';
        return <span className={cls}>{val}</span>;
      } 
    },
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

  useEffect(() => {
    const w = buildLast12Weeks();
    setProcWeeks(w);
  }, []);

  const buildProcWeeklySeries = (metricKey, weeksCount) => {
    const N = weeksCount;
    const values = [];
    const valuesLY = [];
    for (let i = 0; i < N; i++) {
      const t = i / N;
      if (metricKey === 'returnRate') {
        const target = 30;
        const base = target + 2.0 * Math.sin(t * Math.PI * 2);
        const ly = (target - 1.5) + 1.8 * Math.cos(t * Math.PI * 2);
        const noise = (((i * 13) % 7) - 3) * 0.3;
        const curr = Math.max(24, Math.min(36, base + noise));
        const last = Math.max(24, Math.min(36, ly + noise * 0.5));
        values.push(Number(curr.toFixed(1)));
        valuesLY.push(Number(last.toFixed(1)));
      } else if (metricKey === 'configRatio') {
        const target = 0.5;
        const base = target + 0.04 * Math.sin(t * Math.PI * 2);
        const ly = (target - 0.03) + 0.03 * Math.cos(t * Math.PI * 2);
        const noise = (((i * 17) % 11) - 5) / 1000;
        const curr = Math.max(0.4, Math.min(0.6, base + noise));
        const last = Math.max(0.4, Math.min(0.6, ly + noise * 0.6));
        values.push(Number(curr.toFixed(2)));
        valuesLY.push(Number(last.toFixed(2)));
      } else if (metricKey === 'newEmpReturn') {
        const base = 80 + 2.5 * Math.sin(t * Math.PI * 2);
        const ly = 78 + 2.0 * Math.cos(t * Math.PI * 2);
        const noise = (((i * 19) % 9) - 4) * 0.4;
        const curr = Math.max(70, Math.min(90, base + noise));
        const last = Math.max(68, Math.min(88, ly + noise * 0.6));
        values.push(Number(curr.toFixed(1)));
        valuesLY.push(Number(last.toFixed(1)));
      } else if (metricKey === 'therapistYield') {
        const target = 80;
        const base = target + 3.0 * Math.sin(t * Math.PI * 2);
        const ly = (target - 2.0) + 2.5 * Math.cos(t * Math.PI * 2);
        const noise = (((i * 23) % 9) - 4) * 0.5;
        const curr = Math.max(70, Math.min(90, base + noise));
        const last = Math.max(68, Math.min(88, ly + noise * 0.5));
        values.push(Number(curr.toFixed(1)));
        valuesLY.push(Number(last.toFixed(1)));
      }
    }
    return { values, valuesLY };
  };

  const buildProcCityRows = (metricKey) => {
    const rows = tableData.map((r) => {
      const seed = String(r.city).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      if (metricKey === 'returnRate') {
        const target = 30;
        const val = target - 2 + ((seed % 9) - 4); // around 28–32
        const status = val >= target ? '达标' : '未达标';
        return { key: r.city, city: r.city, value: `${val.toFixed(1)}%`, target: `${target}%`, status };
      } else if (metricKey === 'configRatio') {
        const target = 0.5;
        const val = target - 0.03 + (((seed % 11) - 5) / 100); // ~0.47–0.53
        const minT = target;
        const maxT = target; // 单一目标
        const status = Math.abs(val - target) <= 0.05 ? '达标' : '未达标';
        return { key: r.city, city: r.city, value: Number(val.toFixed(2)), target: `${target}`, status };
      } else if (metricKey === 'newEmpReturn') {
        const target = 80;
        const val = target - 3 + (seed % 7); // ~77–83
        const status = val >= target ? '达标' : '未达标';
        return { key: r.city, city: r.city, value: `${val.toFixed(1)}%`, target: `${target}%`, status };
      } else if (metricKey === 'therapistYield') {
        const target = 80;
        const val = target - 4 + (seed % 9); // ~76–85
        const status = val >= target ? '达标' : '未达标';
        return { key: r.city, city: r.city, value: `${val.toFixed(1)}%`, target: `${target}%`, status };
      }
      return { key: r.city, city: r.city, value: '-', target: '-', status: '-' };
    });
    return rows;
  };

  useEffect(() => {
    // 1. Handle Trend Data
    if (fetchedTrendData && fetchedTrendData.length > 0) {
      // Expecting [{ week_num, current_value, last_year_value }, ...]
      // Sort by week_num to ensure correct order
      const sorted = [...fetchedTrendData].sort((a, b) => a.week_num - b.week_num);
      setProcValues(sorted.map(d => Number(d.current_value)));
      setProcValuesLY(sorted.map(d => Number(d.last_year_value)));
    } else {
      // Fallback to mock if SQL returns no data
      const N = (procWeeks || []).length || 12;
      const series = buildProcWeeklySeries(procMetric, N);
      setProcValues(series.values);
      setProcValuesLY(series.valuesLY);
    }

    // 2. Handle City Data
    if (fetchedCityData && fetchedCityData.length > 0) {
      const cityCol = { 
        key: 'city', 
        title: '城市', 
        dataIndex: 'city',
        render: (val) => (
          <span 
            className="text-[#a40035] cursor-pointer hover:underline"
            onClick={() => openCityModal(val)}
          >
            {val}
          </span>
        )
      };

      let cols = [];
      if (procMetric === 'returnRate') {
        cols = [
           cityCol,
           { key: 'value', title: '项目回头率', dataIndex: 'value', 
             render: (val) => {
                const num = parseFloat(String(val).replace('%','')) || 0;
                const target = BusinessTargets.turnover.impactAnalysis.projectRetention.target || 30;
                const isHigh = num >= target;
                return <span className={isHigh ? 'text-red-600' : 'text-green-600'}>{val}</span>;
             }
           },
           { key: 'target', title: '目标', dataIndex: 'target' },
           { key: 'status', title: '状态', dataIndex: 'status' }
        ];
      } else if (procMetric === 'configRatio') {
         cols = [
           cityCol,
           { key: 'value', title: '今年床位人员配置比', dataIndex: 'value',
             render: (val, record) => {
                const num = parseFloat(String(val)) || 0;
                const target = parseFloat(String(record.target)) || 0.5;
                const isHigh = num >= target;
                return <span className={isHigh ? 'text-red-600' : 'text-green-600'}>{val}</span>;
             }
           },
           { key: 'target', title: '目标', dataIndex: 'target' },
           { key: 'status', title: '状态', dataIndex: 'status' }
         ];
      } else if (procMetric === 'newEmpReturn') {
         cols = [
           { 
              key: 'city', 
              title: '城市', 
              dataIndex: 'city' 
           },
           { 
              key: 'name', 
              title: '技术副总姓名', 
              dataIndex: 'name', // SQL should return 'name'
              render: (val, record) => (
                <span 
                  className="text-[#a40035] cursor-pointer hover:underline"
                  onClick={() => openVPModal(val, record.city)}
                >
                  {val}
                </span>
              )
           },
           { 
              key: 'value', 
              title: '新员工回头率达标率', 
              dataIndex: 'value',
              render: (val) => {
                const num = parseFloat(String(val).replace('%', '')) || 0;
                const target = BusinessTargets.turnover.impactAnalysis.newEmployeeRetention.target || 80;
                const isHigh = num >= target;
                return <span className={isHigh ? 'text-red-600' : 'text-green-600'}>{val}</span>;
              }
           }
         ];
      } else if (procMetric === 'therapistYield') {
         cols = [
            cityCol,
            { key: 'total_therapists', title: '在职推拿师人数', dataIndex: 'total_therapists' },
            { key: 'qualified_therapists', title: '产值达标推拿师人数', dataIndex: 'qualified_therapists' },
            { 
              key: 'value', 
              title: '推拿师产值达标率', 
              dataIndex: 'value',
              render: (val) => {
                const num = parseFloat(String(val).replace('%', '')) || 0;
                const target = BusinessTargets.turnover.impactAnalysis.therapistOutput.target || 80;
                const isHigh = num >= target;
                return <span className={isHigh ? 'text-red-600' : 'text-green-600'}>{val}</span>;
              }
            }
         ];
      } else {
        cols = [
          cityCol,
          { key: 'value', title: '指标值', dataIndex: 'value' },
          { key: 'target', title: '目标', dataIndex: 'target' },
          { key: 'status', title: '达标', dataIndex: 'status',
            render: (val) => {
              const cls = val === '达标' ? 'text-green-600' : 'text-red-600';
              return <span className={cls}>{val}</span>;
            } 
          },
        ];
      }
      
      setProcColumnsDyn(cols);
      setProcCityRows(fetchedCityData.map((r, i) => ({ key: i, ...r })));
    } else {
      // Fallback to mock
      const rows = buildProcCityRows(procMetric);
      setProcCityRows(rows);
      setProcColumnsDyn(procColumnsDefault);
    }
  }, [fetchedTrendData, fetchedCityData, procMetric, procWeeks]);

  const openCityModal = (cityName) => {
    setSelectedCity(cityName);
    setModalContextCity(cityName);
    setIsModalOpen(true);
  };

  const openVPModal = (vpName, cityName) => {
    setSelectedCity(vpName);
    setModalContextCity(cityName);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (!isModalOpen || !selectedCity) return;

    const seed = String(selectedCity || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) || 1;
    const getFallbackStores = () => ['门店A', '门店B', '门店C', '门店D'];

    if (procMetric === 'configRatio') {
      const weekRanges = buildLast12Weeks();
      setWeeks(weekRanges);
      
      if (modalTrendData && modalTrendData.length > 0) {
        const sorted = [...modalTrendData].sort((a,b) => a.week_num - b.week_num);
        setWeeklyPrice(sorted.map(d => d.current_value));
        setWeeklyPriceLY(sorted.map(d => d.last_year_value));
      } else {
        const N = weekRanges.length;
        const currSeries = [], lastSeries = [];
        for (let i = 0; i < N; i++) {
          const t = i / N;
          const target = 0.5;
          const base = target + 0.04 * Math.sin(t * Math.PI * 2);
          const ly = (target - 0.03) + 0.03 * Math.cos(t * Math.PI * 2);
          const noise = (((i * 17) % 11) - 5) / 1000 + ((seed % 100) / 5000);
          currSeries.push(Number(Math.max(0.4, Math.min(0.6, base + noise)).toFixed(2)));
          lastSeries.push(Number(Math.max(0.4, Math.min(0.6, ly + noise * 0.6)).toFixed(2)));
        }
        setWeeklyPrice(currSeries);
        setWeeklyPriceLY(lastSeries);
      }

      if (modalStoreData && modalStoreData.length > 0) {
         const configRows = modalStoreData.map((row, idx) => ({
           key: idx,
           '门店名称': row.store_name,
           '去年推拿师人数': row.last_therapists,
           '去年床位数量': row.last_beds,
           '去年床位人员配置比': row.last_ratio,
           '今年推拿师人数': row.curr_therapists,
           '今年床位数量': row.curr_beds,
           '今年床位人员配置比': row.curr_ratio,
           '同比': row.yoy
        }));
        setStoreRows(configRows);
      } else {
        const storeNames = getFallbackStores();
        const configRows = storeNames.map((name, idx) => {
          const sLast = 5 + (seed + idx * 7) % 10; 
          const bLast = Math.floor(sLast * (0.5 + ((idx % 3) * 0.1)));
          const rLast = bLast / sLast;
          const sCurr = 5 + (seed + idx * 13) % 12; 
          const bCurr = Math.floor(sCurr * (0.45 + ((idx % 5) * 0.05)));
          const rCurr = bCurr / sCurr;
          const yoy = rLast ? ((rCurr - rLast) / rLast) * 100 : 0;
          return {
            key: `${name}-${idx}`,
            '门店名称': name,
            '去年推拿师人数': sLast,
            '去年床位数量': bLast,
            '去年床位人员配置比': rLast.toFixed(2),
            '今年推拿师人数': sCurr,
            '今年床位数量': bCurr,
            '今年床位人员配置比': rCurr.toFixed(2),
            '同比': `${yoy > 0 ? '+' : ''}${yoy.toFixed(1)}%`
          };
        });
        setStoreRows(configRows);
      }
      
      const storeCols = [
        { key: '门店名称', title: '门店名称', dataIndex: '门店名称' },
        { key: '去年推拿师人数', title: '去年推拿师人数', dataIndex: '去年推拿师人数' },
        { key: '去年床位数量', title: '去年床位数量', dataIndex: '去年床位数量' },
        { key: '去年床位人员配置比', title: '去年床位人员配置比', dataIndex: '去年床位人员配置比' },
        { key: '今年推拿师人数', title: '今年推拿师人数', dataIndex: '今年推拿师人数' },
        { key: '今年床位数量', title: '今年床位数量', dataIndex: '今年床位数量' },
        { 
          key: '今年床位人员配置比', 
          title: '今年床位人员配置比', 
          dataIndex: '今年床位人员配置比',
          render: (val) => {
            const num = parseFloat(String(val)) || 0;
            const target = 0.5;
            const isHigh = num >= target;
            return <span className={isHigh ? 'text-red-600' : 'text-green-600'}>{val}</span>;
          }
        },
        { 
          key: '同比', 
          title: '同比', 
          dataIndex: '同比',
          render: (val) => {
            const num = parseFloat(String(val).replace('%','')) || 0;
            const cls = num > 0 ? 'text-red-600' : num < 0 ? 'text-green-600' : 'text-gray-600';
            return <span className={cls}>{val}</span>;
          }
        }
      ];
      setModalColumns(storeCols);

    } else if (procMetric === 'therapistYield' || procMetric === 'newEmpReturn') {
       const months = Array.from({length: 12}, (_, i) => i + 1);
       const monthRanges = months.map(m => ({
          weekNo: m,
          label: `2025年${m}月`,
          start: `2025-${String(m).padStart(2,'0')}-01`,
          end: `2025-${String(m).padStart(2,'0')}-28`
       }));
       setWeeks(monthRanges);

       if (modalTrendData && modalTrendData.length > 0) {
          const sorted = [...modalTrendData].sort((a,b) => a.week_num - b.week_num);
          setWeeklyPrice(sorted.map(d => d.current_value));
          setWeeklyPriceLY(sorted.map(d => d.last_year_value));
       } else {
          const base = procMetric === 'therapistYield' ? 80 : 85;
          const currSeries = months.map((m, i) => Math.max(60, Math.min(100, base + ((seed + i * 17) % 21) - 10)));
          const lastSeries = months.map((m, i) => Math.max(60, Math.min(100, (base-2) + ((seed + i * 11) % 19) - 9)));
          setWeeklyPrice(currSeries);
          setWeeklyPriceLY(lastSeries);
       }

       let storeNames = getFallbackStores();
       if (modalStoreData && modalStoreData.length > 0) {
          const stores = new Set();
          modalStoreData.forEach(d => stores.add(d.store_name));
          if (stores.size > 0) storeNames = Array.from(stores);
       }
       
       const storeCols = [
        { key: 'month', title: '月份', dataIndex: 'month', fixed: 'left', width: 100 },
        ...storeNames.map(store => ({
          key: store,
          title: store,
          dataIndex: store,
          render: (val) => {
             const num = parseFloat(String(val).replace('%', '')) || 0;
             const isHigh = num >= 80;
             return <span className={isHigh ? 'text-red-600' : 'text-green-600'}>{val}</span>;
          }
        }))
       ];
       setModalColumns(storeCols);
       
       const tableRows = months.map(m => {
          const row = { key: `m-${m}`, month: `2025年${m}月` };
          storeNames.forEach((store, sIdx) => {
            const rateSeed = seed + m * 100 + sIdx * 10;
            const rate = 70 + (rateSeed % 31); 
            row[store] = `${rate.toFixed(1)}%`;
          });
          return row;
       });
       setStoreRows(tableRows);

    } else {
       const weekRanges = buildLast12Weeks();
       setWeeks(weekRanges);
       
       const cityRow = priceGrowthData ? priceGrowthData.find(r => r.city === selectedCity) : null;
       const bCurr = parseFloat(cityRow?.current_price || 0) || 300;
       const bLast = parseFloat(cityRow?.last_year_price || 0) || 280;
       
       const N = weekRanges.length;
       const currSeries = [], lastSeries = [];
       for (let i = 0; i < N; i++) {
          const smooth = 1 + 0.01 * Math.sin((i / N) * 2 * Math.PI);
          const noise = ((Math.sin(i * 1.21 + seed) + Math.cos(i * 0.63 + seed)) * 0.5) * 0.015;
          const curr = bCurr * (smooth + noise);
          const last = bLast * (smooth + noise);
          currSeries.push(Number(curr.toFixed(2)));
          lastSeries.push(Number(last.toFixed(2)));
       }
       setWeeklyPrice(currSeries);
       setWeeklyPriceLY(lastSeries);

       const storeNames = getFallbackStores();
       const cityLabor = Number(cityRow?.labor_cost || 0);
       const cityRecruit = Number(cityRow?.recruit_train_cost || 0);
       const cityBudget = Number(cityRow?.budget || 0);
       const cityUsageRate = parseFloat(String(cityRow?.budget_usage_rate || '0%')) || 0;
       const timeProgress = parseFloat(String(cityRow?.time_progress || '0%')) || 0;

       const stores = storeNames.map((name, idx) => {
          const share = 1 / (storeNames.length || 1);
          const sLast = bLast * (1 + ((idx%3)-1)*0.05);
          const sCurr = bCurr * (1 + ((idx%3)-1)*0.05);
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
       setModalColumns(columnsForStore);
       setStoreRows(stores);
    }
  }, [isModalOpen, selectedCity, modalContextCity, procMetric, modalTrendData, modalStoreData, priceGrowthData]);

  const renderHQOverview = () => {
    const { targetGrowthRate } = BusinessTargets.turnover.priceDecomposition;
    const targetRate = targetGrowthRate !== undefined ? targetGrowthRate : 3.0;
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
      <div>
        <h4 className="text-base font-semibold text-gray-700 mb-3 pl-2 border-l-4 border-[#a40035]">客单价·影响指标分析</h4>
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setProcMetric('returnRate')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${procMetric === 'returnRate' ? 'bg-[#a40035]/10 text-[#a40035]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            项目回头率
          </button>
          <button
            onClick={() => setProcMetric('configRatio')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${procMetric === 'configRatio' ? 'bg-[#a40035]/10 text-[#a40035]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            床位人员配置比
          </button>
          <button
            onClick={() => setProcMetric('newEmpReturn')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${procMetric === 'newEmpReturn' ? 'bg-[#a40035]/10 text-[#a40035]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            新员工回头率达标率
          </button>
          <button
            onClick={() => setProcMetric('therapistYield')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${procMetric === 'therapistYield' ? 'bg-[#a40035]/10 text-[#a40035]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            推拿师产值达标率
          </button>
        </div>
        <div className="mt-4 bg-white rounded-lg border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">
              {impactInfos[procMetric]?.name} 进度与预算使用情况
            </div>
            <div className="text-xs text-gray-400">{impactInfos[procMetric]?.name}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">当前值</div>
              <div className="text-xl font-bold text-[#a40035]">
                {impactInfos[procMetric]?.unit === '%' ? `${impactInfos[procMetric]?.actual}%` : `${impactInfos[procMetric]?.actual}`}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <div className="mb-1">
                  目标：
                  <span className="font-semibold text-gray-700">
                    {impactInfos[procMetric]?.target !== null && impactInfos[procMetric]?.target !== undefined
                      ? (impactInfos[procMetric]?.unit === '%' ? `${impactInfos[procMetric]?.target}%` : `${impactInfos[procMetric]?.target}`)
                      : '—'}
                  </span>
                </div>
                <div>
                  去年：
                  <span className="font-semibold text-gray-700">
                    {(() => {
                      const a = Number(impactInfos[procMetric]?.actual);
                      const l = Number(impactInfos[procMetric]?.last);
                      const hasLast = impactInfos[procMetric]?.last !== null && impactInfos[procMetric]?.last !== undefined;
                      if (hasLast) {
                        const base = impactInfos[procMetric]?.unit === '%' ? `${impactInfos[procMetric]?.last}%` : `${impactInfos[procMetric]?.last}`;
                        const yoy = l ? ((a - l) / l) * 100 : 0;
                        const sign = yoy > 0 ? '+' : '';
                        const cls = yoy > 0 ? 'text-red-600' : yoy < 0 ? 'text-green-600' : 'text-gray-600';
                        return (
                          <>
                            {base}
                            <span className="ml-1">
                              （同比 <span className={cls}>{`${sign}${yoy.toFixed(1)}%`}</span>）
                            </span>
                          </>
                        );
                      }
                      return '—';
                    })()}
                  </span>
                </div>
              </div>
              <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                {impactInfos[procMetric]?.target ? (
                  <div
                    className="h-2 bg-[#a40035]"
                    style={{
                      width: `${Math.max(0, Math.min(100, (Number(impactInfos[procMetric]?.actual) / Number(impactInfos[procMetric]?.target)) * 100))}%`
                    }}
                  />
                ) : (
                  <div className="h-2 bg-gray-300 w-1/3"></div>
                )}
              </div>
              <div className="mt-2 text-xs">
                {impactInfos[procMetric]?.target
                  ? (Number(impactInfos[procMetric]?.actual) >= Number(impactInfos[procMetric]?.target)
                      ? <span className="text-sm font-semibold text-red-600">达标</span>
                      : <span className="text-xs text-gray-600">未达标</span>)
                  : <span className="text-gray-400">无目标值</span>}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
              <div className="text-xs text-gray-500 mb-2">预算与支出</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">总预算</div>
                  <div className="text-lg font-bold text-gray-800">
                    {(() => {
                      const wb = impactInfos[procMetric]?.budget?.wageBudget || '';
                      const ob = impactInfos[procMetric]?.budget?.otherBudget || '';
                      const toYuan = (s) => {
                        if (!s) return 0;
                        const num = parseFloat(String(s).replace(/[^\d.]/g, '')) || 0;
                        const isWan = /万/.test(String(s));
                        return isWan ? num * 10000 : num;
                      };
                      const sum = toYuan(wb) + toYuan(ob);
                      if (sum > 0) {
                        if (sum >= 10000) return `¥${(sum / 10000).toFixed(1)}万`;
                        return `¥${Math.round(sum).toLocaleString('zh-CN')}`;
                      }
                      return '—';
                    })()}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">实际支出</div>
                  <div className="text-lg font-bold text-gray-800">
                    {(() => {
                      const costs = impactInfos[procMetric]?.actualCosts || [];
                      const toNum = (x) => typeof x === 'number' ? x : (parseFloat(String(x).replace(/[^\d.]/g, '')) || 0);
                      const total = (impactInfos[procMetric]?.actualTotal && typeof impactInfos[procMetric]?.actualTotal === 'number')
                        ? impactInfos[procMetric]?.actualTotal
                        : costs.reduce((a, c) => a + toNum(c.amount), 0);
                      if (total > 0) {
                        if (total >= 10000) return `¥${(total / 10000).toFixed(1)}万`;
                        return `¥${Math.round(total).toLocaleString('zh-CN')}`;
                      }
                      return '—';
                    })()}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">预算使用率</div>
                  <div className="text-lg font-bold text-[#a40035]">
                    {(() => {
                      const wb = impactInfos[procMetric]?.budget?.wageBudget || '';
                      const ob = impactInfos[procMetric]?.budget?.otherBudget || '';
                      const toYuan = (s) => {
                        if (!s) return 0;
                        const num = parseFloat(String(s).replace(/[^\d.]/g, '')) || 0;
                        const isWan = /万/.test(String(s));
                        return isWan ? num * 10000 : num;
                      };
                      const budgetY = toYuan(wb) + toYuan(ob);
                      const costs = impactInfos[procMetric]?.actualCosts || [];
                      const toNum = (x) => typeof x === 'number' ? x : (parseFloat(String(x).replace(/[^\d.]/g, '')) || 0);
                      const actualY = (impactInfos[procMetric]?.actualTotal && typeof impactInfos[procMetric]?.actualTotal === 'number')
                        ? impactInfos[procMetric]?.actualTotal
                        : costs.reduce((a, c) => a + toNum(c.amount), 0);
                      if (budgetY > 0 && actualY >= 0) {
                        const p = Math.max(0, Math.min(100, (actualY / budgetY) * 100));
                        return `${p.toFixed(1)}%`;
                      }
                      return '—';
                    })()}
                  </div>
                </div>
              </div>
              <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                {(() => {
                  const wb = impactInfos[procMetric]?.budget?.wageBudget || '';
                  const ob = impactInfos[procMetric]?.budget?.otherBudget || '';
                  const toYuan = (s) => {
                    if (!s) return 0;
                    const num = parseFloat(String(s).replace(/[^\d.]/g, '')) || 0;
                    const isWan = /万/.test(String(s));
                    return isWan ? num * 10000 : num;
                  };
                  const budgetY = toYuan(wb) + toYuan(ob);
                  const costs = impactInfos[procMetric]?.actualCosts || [];
                  const toNum = (x) => typeof x === 'number' ? x : (parseFloat(String(x).replace(/[^\d.]/g, '')) || 0);
                  const actualY = (impactInfos[procMetric]?.actualTotal && typeof impactInfos[procMetric]?.actualTotal === 'number')
                    ? impactInfos[procMetric]?.actualTotal
                    : costs.reduce((a, c) => a + toNum(c.amount), 0);
                  if (budgetY > 0 && actualY >= 0) {
                    const p = Math.max(0, Math.min(100, (actualY / budgetY) * 100));
                    return <div className="h-2 bg-[#a40035]" style={{ width: `${p}%` }}></div>;
                  }
                  return <div className="h-2 bg-gray-300 w-1/3"></div>;
                })()}
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 text-sm text-gray-700">
                  <div>工资预算：<span className="font-semibold">{impactInfos[procMetric]?.budget?.wageBudget || '—'}</span></div>
                  <div>其他预算：<span className="font-semibold">{impactInfos[procMetric]?.budget?.otherBudget || '—'}</span></div>
                  <div>费用占比：<span className="font-semibold">{impactInfos[procMetric]?.budget?.ratio || '—'}</span></div>
                  {impactInfos[procMetric]?.salaryShare ? (
                    <div>薪酬占比：<span className="font-semibold">{impactInfos[procMetric]?.salaryShare}</span></div>
                  ) : null}
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-gray-700">
                    <thead>
                      <tr>
                        <th className="px-2 py-1 text-left font-medium">成本项</th>
                        <th className="px-2 py-1 text-left font-medium">金额</th>
                      </tr>
                    </thead>
                    <tbody>
                      {impactInfos[procMetric]?.actualCosts?.map((c, idx) => {
                        const val = typeof c.amount === 'number' ? c.amount : (parseFloat(String(c.amount).replace(/[^\d.]/g, '')) || 0);
                        const display = val >= 10000 ? `¥${(val / 10000).toFixed(1)}万` : (typeof c.amount === 'number' ? `¥${c.amount.toLocaleString('zh-CN')}` : c.amount);
                        return (
                          <tr key={`row-${idx}`}>
                            <td className="px-2 py-1">{c.label}</td>
                            <td className="px-2 py-1">{display}</td>
                          </tr>
                        );
                      })}
                      {(() => {
                        const costs = impactInfos[procMetric]?.actualCosts || [];
                        const toNum = (x) => typeof x === 'number' ? x : (parseFloat(String(x).replace(/[^\d.]/g, '')) || 0);
                        const total = (impactInfos[procMetric]?.actualTotal && typeof impactInfos[procMetric]?.actualTotal === 'number')
                          ? impactInfos[procMetric]?.actualTotal
                          : costs.reduce((a, c) => a + toNum(c.amount), 0);
                        if (total > 0) {
                          const display = total >= 10000 ? `¥${(total / 10000).toFixed(1)}万` : `¥${Math.round(total).toLocaleString('zh-CN')}`;
                          return (
                            <tr>
                              <td className="px-2 py-1 font-medium">合计</td>
                              <td className="px-2 py-1">{display}</td>
                            </tr>
                          );
                        }
                        return null;
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setProcShowYoY(!procShowYoY)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${procShowYoY ? 'bg-[#2563eb]/10 text-[#2563eb] border-[#2563eb]' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'}`}
          >
            显示同比
          </button>
          <button
            onClick={() => setProcShowTrend(!procShowTrend)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${procShowTrend ? 'bg-[#a40035]/10 text-[#a40035] border-[#a40035]' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'}`}
          >
            显示均线
          </button>
          <button
            onClick={() => setProcShowExtremes(!procShowExtremes)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${procShowExtremes ? 'bg-[#a40035]/10 text-[#a40035] border-[#a40035]' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'}`}
          >
            显示极值
          </button>
        </div>
        {procValues.length >= 2 ? (
          <LineTrendChart
            headerTitle={
              procMetric === 'returnRate'
                ? '项目回头率（近12周）'
                : procMetric === 'configRatio'
                ? '床位人员配置比（近12周）'
                : procMetric === 'newEmpReturn'
                ? '新员工回头率达标率（近12周）'
                : '推拿师产值达标率（近12周）'
            }
            headerUnit={procMetric === 'configRatio' ? '人/床' : '%'}
            values={procValues}
            valuesYoY={procValuesLY}
            xLabels={procWeeks.map(w => `第${String(w.weekNo).padStart(2, '0')}周`)}
            showYoY={procShowYoY}
            showTrend={procShowTrend}
            showExtremes={procShowExtremes}
            yAxisFormatter={(v) => procMetric === 'configRatio' ? Number(v).toFixed(2) : `${Math.round(v)}%`}
            valueFormatter={(v) => procMetric === 'configRatio' ? `${Number(v).toFixed(2)}` : `${Number(v).toFixed(1)}%`}
            colorPrimary="#a40035"
            colorYoY="#2563eb"
            getHoverTitle={(idx) => procWeeks[idx]?.label || ''}
            getHoverSubtitle={() => ''}
          />
        ) : (
          <div className="bg-white p-4 rounded-lg shadow-sm text-center text-gray-500">暂无数据</div>
        )}
        <div className="mt-4">
          <DataTable data={procCityRows} columns={procColumnsDyn.length ? procColumnsDyn : procColumnsDefault} />
        </div>
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
                headerTitle={procMetric === 'configRatio' ? '城市床位人员配置比变化趋势' : procMetric === 'therapistYield' ? '城市推拿师产值达标率趋势' : '城市平均客单价变化趋势'}
                headerUnit={procMetric === 'configRatio' ? '人/床' : procMetric === 'therapistYield' ? '%' : '元/人次'}
                values={weeklyPrice}
                valuesYoY={weeklyPriceLY}
                xLabels={procMetric === 'newEmpReturn' || procMetric === 'therapistYield'
                  ? weeks.map(w => w.label)
                  : weeks.map(w => `第${String(w.weekNo).padStart(2, '0')}周`)
                }
                showYoY={showYoY}
                showTrend={showTrend}
                showExtremes={showExtremes}
                yAxisFormatter={(v) => procMetric === 'configRatio' ? Number(v).toFixed(2) : Math.round(v)}
                valueFormatter={(v) => procMetric === 'configRatio' ? `${Number(v).toFixed(2)}` : (procMetric === 'newEmpReturn' || procMetric === 'therapistYield') ? `${Number(v).toFixed(1)}%` : `¥ ${Number(v).toFixed(2)}`}
                colorPrimary="#a40035"
                colorYoY="#2563eb"
                getHoverTitle={(idx) => weeks[idx]?.label || ''}
                getHoverSubtitle={() => ''}
              />
              <div>
                <h4 className="text-base font-semibold text-gray-700 mb-3 pl-2 border-l-4 border-[#a40035]">
                  {procMetric === 'newEmpReturn' ? '技术副总负责门店新员工回头率统计' : procMetric === 'therapistYield' ? '门店产值达标率统计' : '门店维度统计'}
                </h4>
                <DataTable data={storeRows} columns={modalColumns.length > 0 ? modalColumns : columnsForStore} />
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
