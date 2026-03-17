import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import DataContainer from '../../components/Common/DataContainer';
import DataTable from '../../components/Common/DataTable';
import HQMetricsTrendChart from './HQMetricsTrendChart';
import LineTrendChart from '../../components/Common/LineTrendChart';
import LineTrendStyle from '../../components/Common/LineTrendStyleConfig';
import useFetchData from '../../hooks/useFetchData';
import { generatePositionReminder } from '../../services/reminderService';
import { getTimeProgress } from '../../components/Common/TimeProgressUtils';
import BusinessTargets from '../../config/businessTargets';
import { AI_CONFIG } from '../../config/aiConfig';
import useTableSorting from '../../components/Common/useTableSorting';

const PriceDecompositionContainer = () => {
  // data state is no longer needed as we use priceGrowthData directly
  // const [data, setData] = useState([]); 
  const [hqData, setHqData] = useState({
    currentPrice: 0,
    lastYearPrice: 0,
    growthRate: 0
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPriceDecompositionModal, setIsPriceDecompositionModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [weeklyPrice, setWeeklyPrice] = useState([]);
  const [weeklyPriceLY, setWeeklyPriceLY] = useState([]);
  const [weeklyYoYRates, setWeeklyYoYRates] = useState([]);
  const [storeRows, setStoreRows] = useState([]);
  const [showYoY, setShowYoY] = useState(false);
  const [showTrend, setShowTrend] = useState(true);
  const [showExtremes, setShowExtremes] = useState(true);
  const [procMetric, setProcMetric] = useState('returnRate');
  const [procWeeks, setProcWeeks] = useState([]);
  const [procValues, setProcValues] = useState([]);
  const [procValuesLY, setProcValuesLY] = useState([]);
  const [procShowYoY, setProcShowYoY] = useState(false);
  const [procShowTrend, setProcShowTrend] = useState(false);
  const [procShowExtremes, setProcShowExtremes] = useState(true);
  const [procCityRows, setProcCityRows] = useState([]);
  const [procColumnsDyn, setProcColumnsDyn] = useState([]);

  // Fetch city price growth data
  const { data: cityAnnualPriceData } = useFetchData('getCityAnnualAvgPrice');
  // Fetch annual average price data
  const { data: annualPriceData } = useFetchData('getAnnualAvgPrice');
  // Fetch city weekly average price data
  const { data: cityWeeklyData } = useFetchData('getCityWeeklyAvgPriceYTD', { city: selectedCity }, null, { manual: !(isModalOpen && isPriceDecompositionModal && selectedCity) });
  // Fetch store weekly average price data
  const { data: storeWeeklyData, loading: storeWeeklyLoading } = useFetchData('getStoreWeeklyAvgPriceYTD', { city: selectedCity }, null, { manual: !(isModalOpen && isPriceDecompositionModal && selectedCity) });

  // New hooks for Repurchase Rate
  const { data: repurchaseAnnual } = useFetchData('getRepurchaseRateAnnual', [], null, { manual: procMetric !== 'returnRate' });
  const { data: repurchaseWeekly } = useFetchData('getRepurchaseRateWeekly', [], null, { manual: procMetric !== 'returnRate', forceRefresh: true });
  const { data: repurchaseCityWeekly } = useFetchData('getRepurchaseRateCityWeekly', [], null, { manual: procMetric !== 'returnRate' });
  const { data: repurchaseStoreWeekly, loading: repurchaseStoreLoading } = useFetchData('getRepurchaseRateStoreWeekly', [], null, { manual: !(isModalOpen && procMetric === 'returnRate') });
  // 新增：新员工回头率达标率数据源
  const { data: newEmpAnnual } = useFetchData('getNewEmpReturnComplianceAnnual', [], null, { manual: procMetric !== 'newEmpReturn' });
  const { data: newEmpMonthly } = useFetchData('getNewEmpReturnComplianceMonthly', [], null, { manual: procMetric !== 'newEmpReturn' });
  const { data: newEmpCityAnnual } = useFetchData('getNewEmpReturnComplianceCityAnnual', [], null, { manual: procMetric !== 'newEmpReturn' });
  const { data: newEmpCityMonthly } = useFetchData('getNewEmpReturnComplianceCityMonthly', [], null, { manual: procMetric !== 'newEmpReturn' });
  const { data: newEmpStoreAnnual, loading: newEmpStoreLoading } = useFetchData('getNewEmpReturnComplianceStoreAnnual', [], null, { manual: !(isModalOpen && procMetric === 'newEmpReturn') });

  
  // 床位人员配置比数据（月度）
  const { data: bedStaffRatioAnnual } = useFetchData('getBedStaffRatioAnnual', [], null, { manual: procMetric !== 'configRatio' });
  const { data: bedStaffRatioMonthly } = useFetchData('getBedStaffRatioMonthly', [], null, { manual: procMetric !== 'configRatio' });
  const { data: bedStaffRatioCityAnnual } = useFetchData('getBedStaffRatioCityAnnual', [], null, { manual: procMetric !== 'configRatio' });
  const { data: bedStaffRatioCityMonthly } = useFetchData('getBedStaffRatioCityMonthly', [], null, { manual: procMetric !== 'configRatio' });
  const { data: bedStaffRatioStoreAnnual, loading: bedStaffRatioStoreLoading } = useFetchData('getBedStaffRatioStoreAnnual', [], null, { manual: !(isModalOpen && procMetric === 'configRatio') });
  // 推拿师产值达标率（月度/城市月度/门店月度）
  const { data: empOutputMonthly } = useFetchData('getEmployeeOutputStandardRateMonthly', [], null, { manual: procMetric !== 'therapistYield' });
  const { data: empOutputCityMonthly } = useFetchData('getEmployeeOutputStandardRateCityMonthly', [], null, { manual: procMetric !== 'therapistYield' });
  const { data: empOutputStoreMonthly, loading: empOutputStoreLoading } = useFetchData('getEmployeeOutputStandardRateStoreMonthly', [], null, { manual: !(isModalOpen && procMetric === 'therapistYield') });

  const isModalTableLoading =
    (isPriceDecompositionModal && storeWeeklyLoading) ||
    (!isPriceDecompositionModal && procMetric === 'returnRate' && repurchaseStoreLoading) ||
    (!isPriceDecompositionModal && procMetric === 'configRatio' && bedStaffRatioStoreLoading) ||
    (!isPriceDecompositionModal && procMetric === 'newEmpReturn' && newEmpStoreLoading) ||
    (!isPriceDecompositionModal && procMetric === 'therapistYield' && empOutputStoreLoading);


  const [modalContextCity, setModalContextCity] = useState(null);
  
  // Fetch modal data
  

  const impactInfos = useMemo(() => {
    const config = BusinessTargets.turnover.impactAnalysis;
    const formatBudget = (val) => val > 0 ? `¥${val}万` : '';

    // Process Repurchase Rate Data
    // Default values
    let returnRateActual = "";
    let returnRateLast = "";
    let returnRateYoY = "";
    
    // Override with API data if available
    if (repurchaseAnnual && repurchaseAnnual.length > 0) {
      // Find max year
      const maxYear = Math.max(...repurchaseAnnual.map(d => d.s_year));
      const latest = repurchaseAnnual.find(d => d.s_year === maxYear);
      if (latest) {
        returnRateActual = Number(latest.repurchase_rate);
        returnRateLast = Number(latest.prev_year_rate);
        returnRateYoY = Number(latest.yoy_change_pct);
      }
    }

    return {
      returnRate: {
        name: '项目回头率',
        unit: '%',
        target: config.projectRetention.target,
        actual: returnRateActual,
        last: returnRateLast,
        yoy: returnRateYoY, // Store calculated YoY
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
        actual: (() => {
          if (bedStaffRatioAnnual && bedStaffRatioAnnual.length > 0) {
            const latest = bedStaffRatioAnnual[0]; // Already sorted DESC by year
            return latest.current_year_ratio != null ? Number(latest.current_year_ratio) : '';
          }
          return '';
        })(),
        last: (() => {
          if (bedStaffRatioAnnual && bedStaffRatioAnnual.length > 0) {
            const latest = bedStaffRatioAnnual[0];
            return latest.last_year_ratio != null ? Number(latest.last_year_ratio) : '';
          }
          return '';
        })(),
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
        actual: (() => {
          if (newEmpAnnual && newEmpAnnual.length > 0) {
            const latest = [...newEmpAnnual].sort((a, b) => b.report_year - a.report_year)[0];
            const val = latest?.compliance_rate;
            return val != null ? Number(val) : null;
          }
          return null;
        })(),
        last: (() => {
          if (newEmpAnnual && newEmpAnnual.length > 0) {
            const latest = [...newEmpAnnual].sort((a, b) => b.report_year - a.report_year)[0];
            const val = latest?.compliance_rate_ly;
            return val != null ? Number(val) : null;
          }
          return null;
        })(),
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
        actual: (() => {
          if (empOutputMonthly && empOutputMonthly.length > 0) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const year = yesterday.getFullYear();
            const month = String(yesterday.getMonth() + 1).padStart(2, '0');
            const targetMonth = `${year}-${month}`;

            const targetData = empOutputMonthly.find(d => d.stat_month === targetMonth);
            if (targetData) {
              const val = targetData.output_standard_rate_pct;
              return val != null ? Number(val) : null;
            }
          }
          return null;
        })(),
        previousMonthActual: (() => {
          if (empOutputMonthly && empOutputMonthly.length > 0) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            // Go back one more month
            yesterday.setMonth(yesterday.getMonth() - 1);
            const year = yesterday.getFullYear();
            const month = String(yesterday.getMonth() + 1).padStart(2, '0');
            const targetMonth = `${year}-${month}`;

            const targetData = empOutputMonthly.find(d => d.stat_month === targetMonth);
            if (targetData) {
              const val = targetData.output_standard_rate_pct;
              return val != null ? Number(val) : null;
            }
          }
          return null;
        })(),
        last: (() => {
          if (empOutputMonthly && empOutputMonthly.length > 0) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const year = yesterday.getFullYear();
            const month = String(yesterday.getMonth() + 1).padStart(2, '0');
            const targetMonth = `${year}-${month}`;

            const targetData = empOutputMonthly.find(d => d.stat_month === targetMonth);
            if (targetData) {
              const val = targetData.prev_year_output_standard_rate_pct;
              return val != null ? Number(val) : null;
            }
          }
          return null;
        })(),
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
  }, [cityAnnualPriceData, repurchaseAnnual, newEmpAnnual, bedStaffRatioAnnual, empOutputMonthly]);

  useEffect(() => {
    // 强制刷新 impactInfos 数据，以确保 repurchaseAnnual 变化时组件感知到
    if (repurchaseAnnual && repurchaseAnnual.length > 0) {
       // 这是一个触发重渲染的 hack，如果 useMemo 没生效的话。
       // 但根据代码，只要依赖项变了就会更新。
       // 检查是否是因为初始值的问题。
       // 其实不需要这个 effect，只要 useMemo 依赖正确即可。
    }
  }, [repurchaseAnnual]);

  useEffect(() => {
    if (annualPriceData && annualPriceData.length > 0) {
      // Find the record with max sales_year (latest year)
      const sorted = [...annualPriceData].sort((a, b) => b.sales_year - a.sales_year);
      const latest = sorted[0];

      if (latest) {
         const currentPrice = Number(latest.annual_avg_order_value) || 0;
         const lastYearPrice = Number(latest.last_year_avg_order_value) || 0;
         
         // Use SQL's YoY percentage directly
         const growthRate = Number(latest.avg_order_value_yoy_pct) || 0;

         setHqData({
           currentPrice,
           lastYearPrice,
           growthRate
         });
      }
    }
  }, [annualPriceData]);

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
    if (cityAnnualPriceData && cityAnnualPriceData.length > 0) {
      // Find the latest year
      const years = cityAnnualPriceData.map(d => d.sales_year).filter(y => y);
      const maxYear = Math.max(...years);
      
      // Filter data for the latest year
      source = cityAnnualPriceData.filter(d => d.sales_year === maxYear);
    }

    const timeProgressVal = getTimeProgress();

    return source.map((row, index) => ({
      key: index,
      city: row.city_name,
      lastYearPrice: parseFloat(row.last_year_aov || 0),
      currentPrice: parseFloat(row.current_year_aov || 0),
      yoyRate: row.aov_yoy_pct ? `${row.aov_yoy_pct}%` : '0%',
      laborCost: null,
      recruitTrainCost: null,
      totalCost: null,
      budget: null,
      budgetUsageRate: null,
      timeProgress: `${timeProgressVal}%`,
      usageProgressDiff: null
    }));
  }, [cityAnnualPriceData]);

  const [modalColumns, setModalColumns] = useState([]);

  const columns = [
    { 
      key: 'city', 
      title: '城市', 
      dataIndex: 'city',
      render: (value, row) => (
        <button
          className="text-[#a40035] hover:underline font-medium"
          onClick={() => {
            setIsPriceDecompositionModal(true);
            openCityModal(row.city);
          }}
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
          <span className={isHigh ? 'text-gray-500' : 'text-red-600'}>
            {val}
          </span>
        );
      }
    },
    {
      key: 'laborCost',
      title: '人工支出（工资+社保）（万元）',
      dataIndex: 'laborCost',
      render: (val) => val != null ? `${Number(val).toFixed(2)}` : ''
    },
    {
      key: 'recruitTrainCost',
      title: '招聘渠道费及培训费（万元）',
      dataIndex: 'recruitTrainCost',
      render: (val) => val != null ? `${Number(val).toFixed(2)}` : ''
    },
    {
      key: 'totalCost',
      title: '费用合计金额（万元）',
      dataIndex: 'totalCost',
      render: (val) => val != null ? `${Number(val).toFixed(2)}` : ''
    },
    {
      key: 'budget',
      title: '预算金额（万元）',
      dataIndex: 'budget',
      render: (val) => val != null ? `${Number(val).toFixed(2)}` : ''
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
        if (val == null) return null;
        const isNegative = `${val}`.includes('-');
        return (
          <span className={isNegative ? 'text-gray-500' : 'text-red-600'}>
            {val}
          </span>
        );
      }
    }
  ];

  const columnsForStore = [
    { key: 'city', title: '城市', dataIndex: 'city' },
    { key: 'storeName', title: '门店名称', dataIndex: 'storeName' },
    { key: 'storeCode', title: '门店编码', dataIndex: 'storeCode' },
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
          <span className={isHigh ? 'text-gray-500' : 'text-red-600'}>
            {val}
          </span>
        );
      }
    },
    {
      key: 'laborCost',
      title: '人工支出（工资+社保）（万元）',
      dataIndex: 'laborCost',
      render: (val) => val != null ? `${Number(val).toFixed(2)}` : null
    },
    {
      key: 'recruitTrainCost',
      title: '招聘渠道费及培训费（万元）',
      dataIndex: 'recruitTrainCost',
      render: (val) => val != null ? `${Number(val).toFixed(2)}` : null
    },
    {
      key: 'totalCost',
      title: '费用合计金额（万元）',
      dataIndex: 'totalCost',
      render: (val) => val != null ? `${Number(val).toFixed(2)}` : null
    },
    {
      key: 'budget',
      title: '预算金额（万元）',
      dataIndex: 'budget',
      render: (val) => val != null ? `${Number(val).toFixed(2)}` : null
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
          <span className={isNegative ? 'text-gray-500' : 'text-red-600'}>
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
        const cls = val === '达标' ? 'text-gray-500' : 'text-red-600';
        return <span className={cls}>{val}</span>;
      } 
    },
  ];
  
  const defaultSort = useMemo(() => {
    // 根据当前使用的列配置决定排序key
    const isUsingDynamicColumns = procColumnsDyn.length > 0;
    
    switch (procMetric) {
      case 'returnRate':
        return { key: "value", direction: "asc" };
      case 'configRatio':
        // 动态列使用current_year_ratio，默认列使用value
        return { key: isUsingDynamicColumns ? "current_year_ratio" : "value", direction: "asc" };
      case 'newEmpReturn':
        // 动态列使用compliance_rate，默认列使用value
        return { key: isUsingDynamicColumns ? "compliance_rate" : "value", direction: "asc" };
      default:
        return { key: null, direction: "asc" };
    }
  }, [procMetric, procColumnsDyn.length]);

  const cityColumnsComputed = useMemo(() => (procColumnsDyn.length ? procColumnsDyn : procColumnsDefault), [procColumnsDyn, procColumnsDefault]);
  const { sortedData: sortedProcCityRows, sortConfig: procSortConfig, handleSort: handleProcSort } = useTableSorting(cityColumnsComputed, procCityRows, defaultSort);
  const modalColumnsComputed = useMemo(() => (modalColumns.length > 0 ? modalColumns : columnsForStore), [modalColumns, columnsForStore]);
  const { sortedData: sortedStoreRows, sortConfig: storeSortConfig, handleSort: handleStoreSort } = useTableSorting(modalColumnsComputed, storeRows, { key: "yoyRate", direction: "asc" });
  const { sortedData: sortedTableData, sortConfig: tableSortConfig, handleSort: handleTableSort } = useTableSorting(columns, tableData, { key: "yoyRate", direction: "asc" });

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

  const processChartData = (data, dateField, valueField, valueFieldLY, isMonthly = false) => {
    if (!data || data.length === 0) return { values: [], valuesLY: [], weeks: [] };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedData = [...data].sort((a, b) => (a[dateField] > b[dateField] ? -1 : 1));

    let firstCompleteIndex = -1;
    const isWeekly = sortedData[0] && (sortedData[0].week_date_range || (sortedData[0].s_year && sortedData[0].s_week) || (sortedData[0].stat_year && sortedData[0].stat_week));

    if (isWeekly && !isMonthly) {
      // 周度数据：使用周的结束日期判断，只包含已完成的周（不包含当前周）
      for (let i = 0; i < sortedData.length; i++) {
        const item = sortedData[i];
        let endDate;

        if (item.week_date_range) {
          const endDateStr = (item.week_date_range || '').split('~')[1];
          if (endDateStr) {
            endDate = new Date(endDateStr.trim());
          }
        } else if (item.s_year && item.s_week || item.stat_year && item.stat_week) {
          // Fallback for data without week_date_range
          const year = item.s_year || item.stat_year;
          const week = item.s_week || item.stat_week;
          // Calculate the end date of the week (Sunday)
          const firstDayOfYear = new Date(year, 0, 1);
          const days = (week - 1) * 7;
          const date = new Date(firstDayOfYear.getTime() + days * 24 * 60 * 60 * 1000);
          const dayOfWeek = date.getDay();
          const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
          const monday = new Date(date.setDate(diff));
          endDate = new Date(monday);
          endDate.setDate(monday.getDate() + 6); // Sunday
        }

        if (endDate) {
          endDate.setHours(0, 0, 0, 0);
          // 只包含结束日期在今天之前的周（不包含当前周）
          if (endDate < today) {
            firstCompleteIndex = i;
            break;
          }
        }
      }
    } else { // Monthly data logic
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

      // 月度数据：包含当月，取近12个月
      for (let i = 0; i < sortedData.length; i++) {
        const item = sortedData[i];
        const itemMonthStr = item[dateField];
        if (itemMonthStr <= currentMonthStr) {
          firstCompleteIndex = i;
          break;
        }
      }
    }

    if (firstCompleteIndex === -1) return { values: [], valuesLY: [], weeks: [] };

    const slicedData = sortedData.slice(firstCompleteIndex, firstCompleteIndex + 12).reverse();

    const values = slicedData.map(d => Number(d[valueField] || 0));
    const valuesLY = slicedData.map(d => (d[valueFieldLY] != null ? Number(d[valueFieldLY]) : null));
    const weeks = slicedData.map(d => {
      // 优先使用 SQL 返回的 week_date_range
      let rangeRaw = d.week_date_range || '';
      
      // 优先使用 SQL 返回的 stat_week 或 s_week
      let weekNo = d.stat_week || d.s_week;
      let year = d.stat_year || d.s_year;
      
      // 如果没有 week_date_range，尝试从年份和周数字段生成（仅作为后备方案）
      if (!rangeRaw && year && weekNo) {
        // 计算该年第一天
        const firstDayOfYear = new Date(year, 0, 1);
        // 计算该周的周一
        const daysToAdd = (weekNo - 1) * 7;
        const monday = new Date(firstDayOfYear.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        
        // 调整到实际的周一
        const dayOfWeek = monday.getDay();
        const diff = monday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        monday.setDate(diff);
        
        // 计算周日
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        // 格式化日期范围
        const formatDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        
        rangeRaw = `${formatDate(monday)} ~ ${formatDate(sunday)}`;
      }
      
      // 如果是月度数据，从 report_month 或 stat_month 生成月份范围
      if (!rangeRaw && (d.report_month || d.stat_month)) {
        const monthStr = d.report_month || d.stat_month; // 格式如 "2025-01"
        if (monthStr && monthStr.includes('-')) {
          const [yearStr, month] = monthStr.split('-');
          const monthNum = parseInt(month);
          year = parseInt(yearStr);
          weekNo = monthNum; // 对于月度数据，weekNo 存储月份
          
          // 计算该月的第一天和最后一天
          const firstDay = new Date(year, monthNum - 1, 1);
          const lastDay = new Date(year, monthNum, 0); // 下个月的第0天就是当月最后一天
          
          const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          };
          
          rangeRaw = `${formatDate(firstDay)} ~ ${formatDate(lastDay)}`;
        }
      }
      
      // 如果还是没有 weekNo 和 year，从 dateField 提取
      if (!weekNo || !year) {
        weekNo = weekNo || Number(String(d[dateField]).slice(5));
        year = year || Number(String(d[dateField]).slice(0, 4));
      }
      
      return {
        label: d[dateField],
        weekNo: weekNo,
        year: year,
        rangeRaw: rangeRaw
      };
    });

    return { values, valuesLY, weeks };
  };


  useEffect(() => {
    const w = buildLast12Weeks();
    setProcWeeks(w);
  }, []);

  // buildProcWeeklySeries and buildProcCityRows removed


  useEffect(() => {
    // 1. Handle Trend Data
    if (procMetric === 'returnRate') {
      if (repurchaseWeekly && repurchaseWeekly.length > 0) {
        const { values, valuesLY, weeks } = processChartData(repurchaseWeekly, 'week_date_range', 'repurchase_rate', 'prev_year_rate');
        setProcValues(values);
        setProcValuesLY(valuesLY);
        setProcWeeks(weeks);
      } else {
        setProcValues([]);
        setProcValuesLY([]);
      }
    } else if (procMetric === 'configRatio') {
      // 月度数据，取近12个月，按 stat_month_date 升序排列
      if (bedStaffRatioMonthly && bedStaffRatioMonthly.length > 0) {
        const sorted = [...bedStaffRatioMonthly].sort((a, b) =>
          a.stat_month_date > b.stat_month_date ? 1 : -1
        );
        const last12 = sorted.slice(-12);
        setProcValues(last12.map(d => Number(d.current_month_ratio)));
        setProcValuesLY(last12.map(d => d.last_year_same_month_ratio != null ? Number(d.last_year_same_month_ratio) : null));
        setProcWeeks(last12.map(d => ({
          label: d.stat_month_date,           // 格式 "2025-01"
          weekNo: Number(d.stat_month),        // 月份数字，用于 xLabel
          year: Number(d.stat_year),
          rangeRaw: d.stat_month_date
        })));
      } else {
        setProcValues([]);
        setProcValuesLY([]);
      }
    } else if (procMetric === 'newEmpReturn') {
      if (newEmpMonthly && newEmpMonthly.length > 0) {
        const { values, valuesLY, weeks } = processChartData(newEmpMonthly, 'report_month', 'compliance_rate', 'compliance_rate_ly', true);
        setProcValues(values);
        setProcValuesLY(valuesLY);
        setProcWeeks(weeks);
      } else {
        setProcValues([]);
        setProcValuesLY([]);
      }
    } else if (procMetric === 'therapistYield') {
      if (empOutputMonthly && empOutputMonthly.length > 0) {
        const { values, valuesLY, weeks } = processChartData(empOutputMonthly, 'stat_month', 'output_standard_rate_pct', 'prev_year_output_standard_rate_pct', true);
        setProcValues(values);
        setProcValuesLY(valuesLY);
        setProcWeeks(weeks);
      } else {
        setProcValues([]);
        setProcValuesLY([]);
      }
    } else {
      // No data - clear charts
      setProcValues([]);
      setProcValuesLY([]);
    }

    // 2. Handle City Data
    if (procMetric === 'returnRate') {
      // Define Columns for Repurchase Rate (Always visible)
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

      const repurchaseCols = [
        cityCol,
        { key: 'totalOrders', title: '订单数量', dataIndex: 'totalOrders' },
        { key: 'repurchaseOrders', title: '回头客订单数量', dataIndex: 'repurchaseOrders' },
        { key: 'value', title: '项目回头率', dataIndex: 'value', 
          render: (val) => {
            const num = parseFloat(String(val).replace('%','')) || 0;
            const target = 30;
            const isHigh = num >= target;
            return <span className={isHigh ? 'text-gray-500' : 'text-red-600'}>{`${num.toFixed(2)}%`}</span>;
          }
        },
        { key: 'prevValue', title: '去年项目回头率', dataIndex: 'prevValue',
          render: (val) => {
            const num = parseFloat(String(val).replace('%','')) || 0;
            return `${num.toFixed(2)}%`;
          }
        },
        { key: 'yoy', title: '同比', dataIndex: 'yoy',
          render: (val) => {
             const num = Number(val);
             const cls = num > 0 ? 'text-gray-500' : num < 0 ? 'text-red-600' : 'text-gray-600';
             const sign = num > 0 ? '+' : '';
             return <span className={cls}>{sign}{num.toFixed(2)}%</span>;
          }
        },
        { key: 'status', title: '是否达标', dataIndex: 'status',
          render: (val) => <span className={val === '达标' ? 'text-gray-500 font-medium' : 'text-red-600'}>{val}</span>
        }
      ];

      setProcColumnsDyn(repurchaseCols);

      if (repurchaseCityWeekly && repurchaseCityWeekly.length > 0) {
        // Find latest week
        let maxYear = 0;
        let maxWeek = 0;
        repurchaseCityWeekly.forEach(d => {
          const y = Number(d.s_year);
          const w = Number(d.s_week);
          if (y > maxYear) { maxYear = y; maxWeek = w; }
          else if (y === maxYear && w > maxWeek) { maxWeek = w; }
        });
        
        const latestData = repurchaseCityWeekly.filter(d => Number(d.s_year) === maxYear && Number(d.s_week) === maxWeek);
        
        const rows = latestData.map((d, idx) => ({
          key: d.city_name || idx,
          city: d.city_name,
          totalOrders: d.total_orders,
          repurchaseOrders: d.repurchase_orders,
          value: `${Number(d.repurchase_rate).toFixed(2)}%`,
          prevValue: `${Number(d.prev_year_rate).toFixed(2)}%`,
          yoy: d.yoy_change_pct,
          target: '30%',
          status: Number(d.repurchase_rate) >= 30 ? '达标' : '未达标'
        }));
        setProcCityRows(rows);
      } else {
         // No data for returnRate - clear rows only
         setProcCityRows([]);
      }
    } else if (procMetric === 'newEmpReturn') {
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
      const cols = [
        cityCol,
        { key: 'yearly_new_staff_count', title: '当年新员工数量', dataIndex: 'yearly_new_staff_count' },
        { key: 'yearly_standard_count', title: '新员工回头率达标人数', dataIndex: 'yearly_standard_count' },
        { key: 'compliance_rate', title: '新员工回头率达标率', dataIndex: 'compliance_rate',
          render: (val) => val != null ? `${Number(val).toFixed(2)}%` : ''
        },
        { key: 'compliance_rate_ly', title: '去年的新员工回头率达标率', dataIndex: 'compliance_rate_ly',
          render: (val) => val != null ? `${Number(val).toFixed(2)}%` : ''
        },
        { key: 'yoy_change_pct', title: '同比', dataIndex: 'yoy_change_pct',
          render: (val) => {
            if (val == null) return '';
            const num = Number(val);
            const cls = num > 0 ? 'text-gray-500' : num < 0 ? 'text-red-600' : 'text-gray-600';
            const sign = num > 0 ? '+' : '';
            return <span className={cls}>{sign}{num}%</span>;
          }
        },
        { key: 'budget_amount', title: '预算金额', dataIndex: 'budget_amount', render: () => '' },
        { key: 'budget_used_amount', title: '预算消耗金额', dataIndex: 'budget_used_amount', render: () => '' },
        { key: 'budget_usage_rate', title: '预算消耗率', dataIndex: 'budget_usage_rate', render: () => '' }
      ];
      setProcColumnsDyn(cols);
      if (newEmpCityAnnual && newEmpCityAnnual.length > 0) {
        const maxYear = Math.max(...newEmpCityAnnual.map(d => Number(d.report_year)));
        const latestRows = newEmpCityAnnual.filter(d => Number(d.report_year) === maxYear);
        const rows = latestRows.map((d, idx) => ({
          key: d.city_name || idx,
          city: d.city_name,
          yearly_new_staff_count: d.yearly_new_staff_count,
          yearly_standard_count: d.yearly_standard_count,
          compliance_rate: d.compliance_rate,
          compliance_rate_ly: d.compliance_rate_ly,
          yoy_change_pct: d.yoy_change_pct
        }));
        setProcCityRows(rows);
      } else {
        setProcCityRows([]);
      }
    } else if (procMetric === 'configRatio') {
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
      
      const cols = [
        cityCol,
        { key: 'current_year_ratio', title: '今年床位人员配置比', dataIndex: 'current_year_ratio',
          render: (val, record) => {
             if (val == null) return '-';
             const num = parseFloat(String(val)) || 0;
             const target = (BusinessTargets && BusinessTargets.turnover && BusinessTargets.turnover.impactAnalysis.bedStaffRatio.target) || 0.7;
             const isHigh = num >= target;
             return <span className={isHigh ? 'text-gray-500' : 'text-red-600'}>{val}</span>;
          }
        },
        { key: 'target', title: '目标', dataIndex: 'target', render: () => (BusinessTargets && BusinessTargets.turnover && BusinessTargets.turnover.impactAnalysis.bedStaffRatio.target) || 0.7 },
        { key: 'last_year_ratio', title: '去年床位人员配置比', dataIndex: 'last_year_ratio' },
        { key: 'yoy_difference', title: '同比', dataIndex: 'yoy_difference',
           render: (val) => {
              if (val == null) return '-';
              const num = parseFloat(val);
              if (isNaN(num)) return val;
              const cls = num > 0 ? 'text-gray-500' : num < 0 ? 'text-red-600' : 'text-gray-600';
              const sign = num > 0 ? '+' : '';
              return <span className={cls}>{sign}{val}</span>;
           }
        },
        { key: 'budget_value', title: '预算值', dataIndex: 'budget_value', render: () => '' },
        { key: 'budget_used', title: '预算消耗金额', dataIndex: 'budget_used', render: () => '' },
        { key: 'budget_usage_rate', title: '预算消耗率', dataIndex: 'budget_usage_rate', render: () => '' }
      ];
      
      setProcColumnsDyn(cols);

      // 城市维度取月度数据，找最新月份展示
      if (bedStaffRatioCityMonthly && Array.isArray(bedStaffRatioCityMonthly) && bedStaffRatioCityMonthly.length > 0) {
         const validData = bedStaffRatioCityMonthly.filter(d => d && d.stat_month_date != null);
         if (validData.length > 0) {
             const latestMonth = validData.reduce((max, d) => d.stat_month_date > max ? d.stat_month_date : max, validData[0].stat_month_date);
             const latestData = validData.filter(d => d.stat_month_date === latestMonth);
             setProcCityRows(latestData.map((r, i) => ({
                key: i,
                city: r.city_name,
                current_year_ratio: r.current_month_ratio,
                last_year_ratio: r.last_year_same_month_ratio,
                yoy_difference: r.yoy_diff_value,
                ...r
             })));
         } else {
             setProcCityRows([]);
         }
      } else {
         setProcCityRows([]);
      }

    } else if (procMetric === 'therapistYield') {
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
      const cols = [
        cityCol,
        { key: 'total_massagists', title: '推拿师人数', dataIndex: 'total_massagists' },
        { key: 'standard_count', title: '产值达标人数', dataIndex: 'standard_count' },
        { key: 'output_standard_rate_pct', title: '推拿师产值达标率', dataIndex: 'output_standard_rate_pct',
          render: (val) => val != null ? `${Number(val).toFixed(2)}%` : ''
        },
        { key: 'prev_year_output_standard_rate_pct', title: '上月产值达标率', dataIndex: 'prev_year_output_standard_rate_pct',
          render: (val) => val != null ? `${Number(val).toFixed(2)}%` : ''
        },
        { key: 'yoy_change_pct_point', title: '同比值', dataIndex: 'yoy_change_pct_point',
          render: (val) => val != null ? `${Number(val).toFixed(2)}%` : ''
        }
      ];
      setProcColumnsDyn(cols);
      if (empOutputCityMonthly && empOutputCityMonthly.length > 0) {
        const sorted = [...empOutputCityMonthly].sort((a, b) => (a.stat_month > b.stat_month ? 1 : -1));
        const latestMonth = sorted[sorted.length - 1].stat_month;
        const latestRows = empOutputCityMonthly.filter(d => d.stat_month === latestMonth);
        const rows = latestRows.map((d, idx) => ({
          key: d.statistic_city_name || idx,
          city: d.statistic_city_name,
          total_massagists: d.total_massagists,
          standard_count: d.standard_count,
          output_standard_rate_pct: d.output_standard_rate_pct,
          prev_year_output_standard_rate_pct: d.prev_year_output_standard_rate_pct,
          yoy_change_pct_point: d.yoy_change_pct_point
        }));
        setProcCityRows(rows);
      } else {
        setProcCityRows([]);
      }
    } else {
      // No data - clear
      setProcCityRows([]);
      setProcColumnsDyn(procColumnsDefault);
    }
  }, [procMetric, repurchaseWeekly, repurchaseCityWeekly, bedStaffRatioMonthly, bedStaffRatioCityAnnual, newEmpMonthly, newEmpCityAnnual, empOutputMonthly, empOutputCityMonthly]);

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

    if (procMetric === 'configRatio' && !isPriceDecompositionModal) {
      // 1. 城市趋势（月度，近12个月）
      if (bedStaffRatioCityMonthly && bedStaffRatioCityMonthly.length > 0) {
         const cityTrend = bedStaffRatioCityMonthly.filter(d => d.city_name === selectedCity);
         const sorted = [...cityTrend].sort((a, b) =>
           a.stat_month_date > b.stat_month_date ? 1 : -1
         );
         const last12 = sorted.slice(-12);

         setWeeklyPrice(last12.map(d => Number(d.current_month_ratio)));
         setWeeklyPriceLY(last12.map(d => d.last_year_same_month_ratio != null ? Number(d.last_year_same_month_ratio) : null));

         const dynamicWeeks = last12.map(d => ({
            label: d.stat_month_date,          // "2025-01"
            weekNo: Number(d.stat_month),
            year: Number(d.stat_year),
            fullLabel: d.stat_month_date
         }));
         setWeeks(dynamicWeeks);
      } else {
         setWeeklyPrice([]);
         setWeeklyPriceLY([]);
         setWeeks([]);
      }

      // 2. Store Table (Annual)
      if (bedStaffRatioStoreAnnual && bedStaffRatioStoreAnnual.length > 0) {
         // Filter by city and find latest year
         const cityStores = bedStaffRatioStoreAnnual.filter(d => d.city_name === selectedCity);
         if (cityStores.length > 0) {
             const maxYear = Math.max(...cityStores.map(d => d.stat_year));
             const latestStores = cityStores.filter(d => d.stat_year === maxYear);
             
             const configRows = latestStores.map((row, idx) => ({
               key: idx,
               '门店名称': row.store_name,
               '去年推拿师人数': '', // Not in SQL
               '去年床位数量': '', // Not in SQL
               '去年床位人员配置比': row.last_year_ratio,
               '今年推拿师人数': row.staff_on_duty,
               '今年床位数量': row.bed_count,
               '今年床位人员配置比': row.current_year_ratio,
               '同比': row.yoy_difference
            }));
            setStoreRows(configRows);
         } else {
             setStoreRows([]);
         }
      } else {
        setStoreRows([]);
      }
      
      const storeCols = [
        { key: '门店名称', title: '门店名称', dataIndex: '门店名称' },
        // { key: '去年推拿师人数', title: '去年推拿师人数', dataIndex: '去年推拿师人数' }, // Removed as not available in SQL easily without another join
        // { key: '去年床位数量', title: '去年床位数量', dataIndex: '去年床位数量' }, // Removed as not available in SQL easily
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
            return <span className={isHigh ? 'text-gray-500' : 'text-red-600'}>{val}</span>;
          }
        },
        { 
          key: '同比', 
          title: '同比', 
          dataIndex: '同比',
          render: (val) => {
            const num = parseFloat(String(val).replace('%','')) || 0;
            const cls = num > 0 ? 'text-gray-500' : num < 0 ? 'text-red-600' : 'text-gray-600';
            const sign = num > 0 ? '+' : '';
            return <span className={cls}>{sign}{val}</span>;
          }
        }
      ];
      setModalColumns(storeCols);

    } else if (procMetric === 'therapistYield' && !isPriceDecompositionModal) {
       if (empOutputCityMonthly && empOutputCityMonthly.length > 0) {
          const city = modalContextCity || selectedCity;
          const cityData = empOutputCityMonthly.filter(d => d.statistic_city_name === city);
          const sorted = cityData.sort((a, b) => (a.stat_month > b.stat_month ? 1 : -1));
          const last12 = sorted.slice(-12);
          const monthLabels = last12.map(d => ({
            label: String(d.stat_month),
            weekNo: Number(String(d.stat_month).slice(5)),
            year: Number(String(d.stat_month).slice(0,4))
          }));
          setWeeks(monthLabels);
          setWeeklyPrice(last12.map(d => Number(d.output_standard_rate_pct)));
          setWeeklyPriceLY(last12.map(d => (d.prev_year_output_standard_rate_pct != null ? Number(d.prev_year_output_standard_rate_pct) : null)));
          setWeeklyYoYRates(last12.map(d => (d.yoy_change_pct_point != null ? Number(d.yoy_change_pct_point) : null)));
       } else {
          setWeeks([]);
          setWeeklyPrice([]);
          setWeeklyPriceLY([]);
          setWeeklyYoYRates([]);
       }

       if (empOutputStoreMonthly && empOutputStoreMonthly.length > 0) {
          const city = modalContextCity || selectedCity;
          const sorted = [...empOutputStoreMonthly].sort((a, b) => (a.stat_month > b.stat_month ? 1 : -1));
          const latestMonth = sorted[sorted.length - 1].stat_month;
          const filtered = empOutputStoreMonthly.filter(d => d.stat_month === latestMonth && d.statistics_city_name === city);
          const rows = filtered.map((d, idx) => ({
            key: d.store_code || idx,
            '城市': d.statistics_city_name,
            '门店编码': d.store_code,
            '门店名称': d.store_name,
            '推拿师人数': d.total_massagists,
            '产值达标人数': d.standard_count,
            '推拿师产值达标率': d.output_standard_rate_pct != null ? `${Number(d.output_standard_rate_pct).toFixed(2)}%` : '',
            '上月产值达标率': d.prev_year_output_standard_rate_pct != null ? `${Number(d.prev_year_output_standard_rate_pct).toFixed(2)}%` : '',
            '同比值': d.yoy_change_pct_point != null ? `${Number(d.yoy_change_pct_point).toFixed(2)}%` : ''
          }));
          const storeCols = [
            { key: '城市', title: '城市', dataIndex: '城市' },
            { key: '门店编码', title: '门店编码', dataIndex: '门店编码' },
            { key: '门店名称', title: '门店名称', dataIndex: '门店名称' },
            { key: '推拿师人数', title: '推拿师人数', dataIndex: '推拿师人数' },
            { key: '产值达标人数', title: '产值达标人数', dataIndex: '产值达标人数' },
            { key: '推拿师产值达标率', title: '推拿师产值达标率', dataIndex: '推拿师产值达标率' },
            { key: '上月产值达标率', title: '上月产值达标率', dataIndex: '上月产值达标率' },
            { key: '同比值', title: '同比值', dataIndex: '同比值' }
          ];
          setModalColumns(storeCols);
          setStoreRows(rows);
       } else {
          setStoreRows([]);
       }
    } else if (procMetric === 'newEmpReturn' && !isPriceDecompositionModal) {
       // 上半部分：城市维度近12个月趋势
       if (newEmpCityMonthly && newEmpCityMonthly.length > 0) {
          const city = modalContextCity || selectedCity;
          const cityData = newEmpCityMonthly.filter(d => d.city_name === city);
          const sorted = cityData.sort((a, b) => (a.report_month > b.report_month ? 1 : -1));
          const last12 = sorted.slice(-12);
          const monthLabels = last12.map(d => ({
            label: String(d.report_month),
            weekNo: Number(String(d.report_month).slice(5)),
            year: Number(String(d.report_month).slice(0,4))
          }));
          setWeeks(monthLabels);
          setWeeklyPrice(last12.map(d => Number(d.compliance_rate)));
          setWeeklyPriceLY(last12.map(d => (d.compliance_rate_ly != null ? Number(d.compliance_rate_ly) : null)));
          setWeeklyYoYRates(last12.map(d => (d.yoy_change_pct != null ? Number(d.yoy_change_pct) : null)));
       } else {
           setWeeks([]);
           setWeeklyPrice([]);
           setWeeklyPriceLY([]);
           setWeeklyYoYRates([]);
       }

       // 下半部分：门店维度年度统计（按中文字段名展示）
       if (newEmpStoreAnnual && newEmpStoreAnnual.length > 0) {
          const maxYear = Math.max(...newEmpStoreAnnual.map(d => Number(d.report_year)));
          const filtered = newEmpStoreAnnual.filter(d => Number(d.report_year) === maxYear && d.city_name === selectedCity);
          const rows = filtered.map((d, idx) => ({
            key: d.store_code || idx,
            '城市': d.city_name,
            '门店编码': d.store_code,
            '门店名称': d.store_name,
            '年度新员工人数': d.yearly_new_staff_count,
            '新员工回头率达标人数': d.yearly_standard_count,
            '新员工回头率达标率': d.compliance_rate != null ? `${Number(d.compliance_rate).toFixed(2)}%` : '',
            '去年新员工回头率达标率': d.compliance_rate_ly != null ? `${Number(d.compliance_rate_ly).toFixed(2)}%` : '',
            '同比': d.yoy_change_pct != null ? `${Number(d.yoy_change_pct)}%` : ''
          }));
          const storeCols = [
            { key: '城市', title: '城市', dataIndex: '城市' },
            { key: '门店编码', title: '门店编码', dataIndex: '门店编码' },
            { key: '门店名称', title: '门店名称', dataIndex: '门店名称' },
            { key: '年度新员工人数', title: '年度新员工人数', dataIndex: '年度新员工人数' },
            { key: '新员工回头率达标人数', title: '新员工回头率达标人数', dataIndex: '新员工回头率达标人数' },
            { key: '新员工回头率达标率', title: '新员工回头率达标率', dataIndex: '新员工回头率达标率' },
            { key: '去年新员工回头率达标率', title: '去年新员工回头率达标率', dataIndex: '去年新员工回头率达标率' },
            { key: '同比', title: '同比', dataIndex: '同比' }
          ];
          setModalColumns(storeCols);
          setStoreRows(rows);
       } else {
          setStoreRows([]);
       }

    } else if (procMetric === 'returnRate' && selectedCity && !isPriceDecompositionModal) {
         // --- Upper Part: Trend (City Level, Last 12 Weeks) ---
         if (repurchaseCityWeekly && repurchaseCityWeekly.length > 0) {
             const cityData = repurchaseCityWeekly.filter(d => d.city_name === selectedCity);
             
             // Sort by year and week
             const sorted = [...cityData].sort((a, b) => {
               if (a.s_year !== b.s_year) return a.s_year - b.s_year;
               return a.s_week - b.s_week;
             });
             
             // 过滤出已经完整结束的周（不包含当周）
             const today = new Date();
             today.setHours(0, 0, 0, 0);
             
             console.log('项目回头率 - 今天日期:', today.toISOString().split('T')[0]);
             console.log('项目回头率 - 排序后数据总数:', sorted.length);
             
             const completedWeeks = sorted.filter(d => {
                if (d.week_date_range) {
                   const parts = (d.week_date_range || '').split('~');
                   if (parts.length >= 2) {
                      const endDateStr = parts[1].trim();
                      try {
                         // 支持两种日期格式：YYYY-MM-DD 和 YYYY/MM/DD
                         const dateParts = endDateStr.split(/[-\/]/);
                         if (dateParts.length === 3) {
                            const year = parseInt(dateParts[0]);
                            const month = parseInt(dateParts[1]);
                            const day = parseInt(dateParts[2]);
                            const endDate = new Date(year, month - 1, day);
                            endDate.setHours(0, 0, 0, 0);
                            const isCompleted = endDate < today;
                            console.log(`第${d.s_week}周: 结束日期=${endDateStr}, 是否完成=${isCompleted}`);
                            // 只包含结束日期在今天之前的周
                            return isCompleted;
                         }
                      } catch (e) {
                         console.error('日期解析错误:', endDateStr, e);
                         return true; // 解析失败时包含该数据
                      }
                   }
                }
                console.log(`第${d.s_week}周: 没有日期范围，默认包含`);
                return true; // 如果没有日期范围，默认包含
             });
             
             console.log('项目回头率 - 过滤后数据总数:', completedWeeks.length);
             
             // Take last 12 weeks from completed weeks
             const sliced = completedWeeks.slice(-12);
             
         const processedWeeks = sliced.map(d => ({
            label: `第${String(d.s_week).padStart(2, '0')}周`,
            weekNo: d.s_week,
            year: d.s_year,
            fullLabel: d.week_date_range ? `日期范围：${d.week_date_range}` : null
          }));
         
         setWeeks(processedWeeks);
          setWeeklyPrice(sliced.map(d => Number(d.repurchase_rate)));
          setWeeklyPriceLY(sliced.map(d => Number(d.prev_year_rate)));
          setWeeklyYoYRates(sliced.map(d => Number(d.yoy_change_pct)));
         } else {
             setWeeks([]);
             setWeeklyPrice([]);
             setWeeklyPriceLY([]);
             setWeeklyYoYRates([]);
         }
         
         // --- Lower Part: Store List (Store Level, Latest Week) ---
         if (repurchaseStoreWeekly && repurchaseStoreWeekly.length > 0) {
             const cityStores = repurchaseStoreWeekly.filter(d => d.city_name === selectedCity);
             
             // Find latest year/week for this city's stores
             let maxYear = 0;
             let maxWeek = 0;
             cityStores.forEach(d => {
               if (d.s_year > maxYear) { maxYear = d.s_year; maxWeek = d.as_of_week; } // Note: SQL returns 'as_of_week'
             });

             // The SQL actually returns only the latest week per store, so we might just use all rows for this city
             // But to be safe, we can filter if needed. The SQL logic says "WHERE s_year = target_year" and only latest week is used for config.
             // Let's just map all rows for the city.
             
             const processedStores = cityStores.map((d, idx) => {
               // We don't have cost/budget data in this SQL, so set to null or calculate if available
               const timeProgressVal = getTimeProgress(); 
               return {
                 key: d.store_code || idx,
                 city: d.city_name,
                 storeName: d.store_name,
                 storeCode: d.store_code,
                 lastYearPrice: d.prev_year_rate_ytd != null ? parseFloat(d.prev_year_rate_ytd) : null,
                 currentPrice: parseFloat(d.repurchase_rate_ytd || 0),
                yoyRate: d.yoy_change_pct != null ? `${Number(d.yoy_change_pct).toFixed(2)}%` : null,
                 laborCost: null,
                 recruitTrainCost: null,
                 totalCost: null,
                 budget: null,
                 budgetUsageRate: null,
                 timeProgress: `${timeProgressVal}%`,
                 usageProgressDiff: null
               };
             });
             
             // Define Columns for Repurchase Rate Store Table
              const storeCols = [
                { key: 'storeCode', title: '门店编码', dataIndex: 'storeCode' },
                { key: 'storeName', title: '门店名称', dataIndex: 'storeName' },
                { key: 'currentPrice', title: '项目回头率', dataIndex: 'currentPrice', 
                  render: (val) => <span className="font-medium">{Number(val).toFixed(2)}%</span> 
                },
               { key: 'lastYearPrice', title: '去年同期', dataIndex: 'lastYearPrice',
                 render: (val) => val != null ? <span className="text-gray-500">{Number(val).toFixed(2)}%</span> : ''
               },
               { key: 'yoyRate', title: '同比', dataIndex: 'yoyRate',
                 render: (val) => {
                   if (val == null) return '';
                   const num = parseFloat(val);
                   const cls = num > 0 ? 'text-gray-500' : num < 0 ? 'text-red-600' : 'text-gray-600';
                   const sign = num > 0 ? '+' : '';
                   return <span className={cls}>{sign}{val}</span>;
                 }
               }
             ];
             
             setModalColumns(storeCols);
             setStoreRows(processedStores);
         } else {
             setStoreRows([]);
         }

      } else {
      // Process City Trend Data (Upper Part)
      if (cityWeeklyData && cityWeeklyData.length > 0 && selectedCity) {
         const cityData = cityWeeklyData.filter(d => d.city_name === selectedCity);
         // Sort by year and week
         const sorted = [...cityData].sort((a, b) => {
            if (a.sales_year !== b.sales_year) return a.sales_year - b.sales_year;
            return a.sales_week - b.sales_week;
         });
         
         // 过滤出已经完整结束的周（不包含当周）
         const today = new Date();
         today.setHours(0, 0, 0, 0);
         
         const completedWeeks = sorted.filter(d => {
            if (d.week_date_range) {
               const endDateStr = (d.week_date_range || '').split('~')[1];
               if (endDateStr) {
                  const endDate = new Date(endDateStr.trim());
                  endDate.setHours(0, 0, 0, 0);
                  // 只包含结束日期在今天之前的周
                  return endDate < today;
               }
            }
            return true; // 如果没有日期范围，默认包含
         });
         
         // Take last 12 weeks from filtered result
         const filtered = completedWeeks.slice(-12);
         
         const processedWeeks = filtered.map(d => ({
            label: `第${d.sales_week}周`,
            weekNo: d.sales_week,
            year: d.sales_year,
            fullLabel: d.week_date_range
         }));
         
         setWeeks(processedWeeks);
         setWeeklyPrice(filtered.map(d => Number(d.current_year_cumulative_aov)));
         setWeeklyPriceLY(filtered.map(d => Number(d.last_year_cumulative_aov)));
         setWeeklyYoYRates(filtered.map(d => Number(d.cumulative_aov_yoy_pct)));
      } else {
          setWeeks([]);
          setWeeklyPrice([]);
          setWeeklyPriceLY([]);
          setWeeklyYoYRates([]);
      }

       // Process Store List Data (Lower Part)
       let processedStores = [];
       if (storeWeeklyData && storeWeeklyData.length > 0 && selectedCity) {
          const cityStores = storeWeeklyData.filter(d => d.city_name === selectedCity);
          
          // Group by store_code and find max year/week
          const storeMap = new Map();
          cityStores.forEach(d => {
             const currentMax = storeMap.get(d.store_code);
             if (!currentMax) {
                storeMap.set(d.store_code, d);
             } else {
                if (d.sales_year > currentMax.sales_year || 
                   (d.sales_year === currentMax.sales_year && d.sales_week > currentMax.sales_week)) {
                   storeMap.set(d.store_code, d);
                }
             }
          });
          
          processedStores = Array.from(storeMap.values()).map((d, idx) => {
             const timeProgressVal = getTimeProgress();
             return {
               key: d.store_code || idx,
               city: d.city_name,
               storeName: d.store_name,
               storeCode: d.store_code,
               lastYearPrice: parseFloat(d.last_year_cumulative_aov || 0),
               currentPrice: parseFloat(d.current_year_cumulative_aov || 0),
               yoyRate: d.cumulative_aov_yoy_pct ? `${d.cumulative_aov_yoy_pct}%` : '0%',
               laborCost: null,
               recruitTrainCost: null,
               totalCost: null,
               budget: null,
               budgetUsageRate: null,
               timeProgress: `${timeProgressVal}%`,
               usageProgressDiff: null
             };
          });
       }
       
       setModalColumns(columnsForStore);
       setStoreRows(processedStores);
   }
  }, [isModalOpen, selectedCity, modalContextCity, procMetric, tableData, cityWeeklyData, storeWeeklyData, isPriceDecompositionModal, repurchaseCityWeekly, repurchaseStoreWeekly, bedStaffRatioCityMonthly, bedStaffRatioStoreAnnual, empOutputCityMonthly, empOutputStoreMonthly]);

 const [showReminder, setShowReminder] = useState(false);
  const [reminderText, setReminderText] = useState('');
  const [isReminderLoading, setIsReminderLoading] = useState(false);

  useEffect(() => {
    if (showReminder && !reminderText && !isReminderLoading && tableData) {
      setIsReminderLoading(true);
      const tp = parseFloat(getTimeProgress());
      const metricsData = {
        getAnnualAvgPrice: annualPriceData || [],
        getCityAnnualAvgPrice: cityAnnualPriceData || [],
        time_progress: {
          percent: Number.isFinite(tp) ? tp : getTimeProgress(),
          as_of_date: new Date().toISOString().slice(0, 10)
        }
      };

      console.log('DeepSeek metricsData:', metricsData);
      generatePositionReminder(metricsData)
        .then(text => {
          setReminderText(text);
        })
        .finally(() => {
          setIsReminderLoading(false);
        });
    }
  }, [showReminder, reminderText, isReminderLoading, tableData, hqData]);

  const renderHQOverview = () => {
    const { targetGrowthRate } = BusinessTargets.turnover.priceDecomposition;
    const targetRate = targetGrowthRate !== undefined ? targetGrowthRate : 3.0;
    const isAchieved = hqData.growthRate >= targetRate;
    
    // Calculate progress for the circular indicator (max 100% visual if exceeded)
    const progressPercent = Math.max(0, Math.min(100, (hqData.growthRate / targetRate) * 100));
    
    // Circle configuration
    const size = 80;
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-100 mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-[#a40035]/5 rounded-bl-full pointer-events-none"></div>
        
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left: Price Compliance */}
          <div className="flex-1 z-10">
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="text-sm text-gray-500 truncate">截止本周年度平均客单价</div>
                  <div className="flex items-baseline gap-2 whitespace-nowrap">
                    <span className="text-3xl xl:text-4xl font-bold text-[#a40035]">
                      ¥{hqData.currentPrice.toFixed(2)}
                    </span>
                    <span className="text-sm font-normal text-gray-400">元/人次</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">去年</span>
                      <span className="font-semibold text-gray-700">¥{hqData.lastYearPrice.toFixed(2)}</span>
                    </div>
                    <div className="w-px h-3 bg-gray-300 hidden sm:block"></div>
                    <div className="flex items-center gap-2 text-sm">
                       <span className="text-gray-400">同比</span>
                       <span className={`font-bold ${hqData.growthRate >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                         {hqData.growthRate > 0 ? '+' : ''}{hqData.growthRate.toFixed(2)}%
                       </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-shrink-0 flex items-center gap-4">
                   <div className="text-right hidden sm:block">
                      <div className="text-xs text-gray-400 mb-1">目标 <span className="font-medium text-gray-600">{targetRate.toFixed(1)}%</span></div>
                      {isAchieved ? (
                        <div className="text-xs text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-full">已达标</div>
                      ) : (
                        <div className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">未达标</div>
                      )}
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
                        <span className="text-[10px] text-gray-400">达成率</span>
                        <span className="text-sm font-bold text-[#a40035]">
                          {progressPercent.toFixed(0)}%
                        </span>
                      </div>
                   </div>
                </div>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="hidden lg:block w-px bg-gray-200 self-stretch"></div>

          {/* Right: Budget Execution */}
          <div className="flex-1 z-10 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">预算金额</div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#a40035]/10 text-[#a40035] font-medium">
                费用占比 {(() => {
                  const priceBudget = BusinessTargets.turnover.priceDecomposition.budget.amount || 0;
                  const volumeBudget = BusinessTargets.turnover.volumeDecomposition.budget?.amount || 0;
                  const total = priceBudget + volumeBudget;
                  const ratio = total > 0 ? (priceBudget / total) * 100 : 0;
                  return ratio.toFixed(1);
                })()}%
              </span>
            </div>
            
            <div className="flex items-center justify-between gap-6">
              <div className="flex flex-col min-w-0">
                <div className="text-3xl xl:text-4xl font-bold text-[#a40035] whitespace-nowrap">
                  ¥{BusinessTargets.turnover.priceDecomposition.budget.amount}万
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                   <div className="flex items-center gap-1 whitespace-nowrap">
                     <span>人工:</span>
                     <span className="font-semibold text-gray-700">
                       ¥{BusinessTargets.turnover.priceDecomposition.budget.labor}万
                     </span>
                   </div>
                   <div className="flex items-center gap-1 whitespace-nowrap">
                     <span>招培:</span>
                     <span className="font-semibold text-gray-700">
                       ¥{BusinessTargets.turnover.priceDecomposition.budget.training}万
                     </span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsPriceDecompositionModal(false);
  };

  const renderContent = () => (
    <div className="space-y-6 relative">
      {AI_CONFIG.POSITION_REMINDER_BUTTON_ENABLED && (
        <div className="flex justify-end relative z-30">
          <button
            onClick={() => setShowReminder(!showReminder)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#a40035] to-[#c81e50] text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {showReminder ? '收起提醒' : '岗位提醒'}
          </button>

          <div 
            className={`absolute top-12 right-0 flex flex-col bg-white/95 backdrop-blur shadow-xl border border-gray-100 rounded-lg overflow-hidden transition-all duration-300 ease-out origin-top-right z-20 ${showReminder ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
            style={{ maxHeight: '600px', minWidth: '400px', maxWidth: '600px', width: 'max-content' }}
          >
            <div className="p-6 text-gray-700 font-medium text-sm overflow-y-auto leading-relaxed">
              {isReminderLoading ? (
                <div className="flex items-center gap-2 text-gray-500 py-4 px-2">
                  <div className="animate-spin h-5 w-5 border-2 border-[#a40035] border-t-transparent rounded-full"></div>
                  <span>正在分析数据并生成岗位提醒...</span>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none prose-p:my-2 prose-li:my-1 [&_strong]:text-[#a40035] [&_strong]:font-bold">
                  <ReactMarkdown>{reminderText || '暂无提醒内容'}</ReactMarkdown>
                </div>
              )}
            </div>
            <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-r-[20px] border-t-[#a40035] border-r-[#a40035] rounded-bl-lg"></div>
          </div>
        </div>
      )}

      {renderHQOverview()}
      <HQMetricsTrendChart />
      <div>
        <h4 className="text-base font-semibold text-gray-700 mb-3 pl-2 border-l-4 border-[#a40035]">城市维度客单价对比</h4>
        <DataTable data={sortedTableData} columns={columns} onSort={handleTableSort} sortConfig={tableSortConfig} />
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
              <div className="text-xs text-gray-500 mb-1">当前值（按日将月产值进行折算结果）</div>
                <div className="text-xl font-bold text-[#a40035]">
                  {(() => {
                    const actual = impactInfos[procMetric]?.actual;
                    const unit = impactInfos[procMetric]?.unit;
                    if (actual === null || actual === undefined) return '—';
                    return unit === '%' ? `${Number(actual).toFixed(2)}%` : `${actual}`;
                  })()}
                </div>
                <div className="text-xs text-red-500 mt-1">
                  {procMetric === 'returnRate' && '定义：回头订单数 / 回头订单数'}
                  {procMetric === 'configRatio' && '定义：在职人数 / 床位数'}
                  {procMetric === 'newEmpReturn' && '定义：回头率达标新员工数 / 新员工总数'}
                  {procMetric === 'therapistYield' && '定义：产值达标推拿师数 / 推拿师总数'}
                </div>
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                <div>
                  目标值：
                  <span className="font-semibold text-gray-700">
                    {impactInfos[procMetric]?.target !== null && impactInfos[procMetric]?.target !== undefined
                      ? (impactInfos[procMetric]?.unit === '%' ? `${impactInfos[procMetric]?.target}%` : `${impactInfos[procMetric]?.target}`)
                      : '—'}
                  </span>
                </div>
                <div>
                  上月数值：
                  <span className="font-semibold text-gray-700">
                    {(() => {
                      const val = impactInfos[procMetric]?.previousMonthActual;
                      if (val !== null && val !== undefined) {
                        return `${Number(val).toFixed(2)}%`;
                      }
                      return '—';
                    })()}
                  </span>
                </div>
                <div>
                  去年同期：
                  <span className="font-semibold text-gray-700">
                    {(() => {
                      const lastVal = impactInfos[procMetric]?.last;
                      if (lastVal !== null && lastVal !== undefined) {
                        return `${Number(lastVal).toFixed(2)}%`;
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
                      ? <span className="text-sm font-semibold text-gray-500">达标</span>
                      : <span className="text-xs text-red-600">未达标</span>)
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
        <div className="flex flex-col mb-4">
          {LineTrendStyle.renderHeader(
            procMetric === 'returnRate' ? '项目回头率趋势表现' :
            procMetric === 'newEmpReturn' ? '新员工回头率达标率趋势表现' :
            procMetric === 'configRatio' ? '床位人员配置比趋势（近12月）' : '指标趋势（近12周）',
            procMetric === 'returnRate' ? '' : procMetric === 'configRatio' ? '' : '%'
          )}
          {LineTrendStyle.renderAuxControls({
            showYoY: procShowYoY,
            setShowYoY: () => setProcShowYoY(!procShowYoY),
            showTrend: procShowTrend,
            setShowTrend: () => setProcShowTrend(!procShowTrend),
            showExtremes: procShowExtremes,
            setShowExtremes: () => setProcShowExtremes(!procShowExtremes)
          })}
        </div>
        {procValues.length >= 2 ? (
          <LineTrendChart
            values={procValues}
            valuesYoY={procValuesLY}
            xLabels={procWeeks.map(w => {
              // 月度数据：新员工回头率、推拿师产值、床位配置比，显示月份格式
              if (procMetric === 'newEmpReturn' || procMetric === 'therapistYield' || procMetric === 'configRatio') {
                return w.label || `${w.year}-${String(w.weekNo).padStart(2, '0')}`;
              }
              // 周度数据显示周格式
              return `第${w.weekNo}周`;
            })}
            showYoY={procShowYoY}
            showTrend={procShowTrend}
            showExtremes={procShowExtremes}
            yAxisFormatter={(v) => procMetric === 'configRatio' ? Number(v).toFixed(2) : `${Number(v).toFixed(2)}%`}
            valueFormatter={(v) => {
              if (procMetric === 'configRatio') return `${Number(v).toFixed(2)}`;
              if (procMetric === 'newEmpReturn') return `${Number(v).toFixed(2)}%`;
              if (procMetric === 'therapistYield') return `${Number(v).toFixed(2)}%`;
              return `${Number(v).toFixed(2)}%`;
            }}
            colorPrimary={LineTrendStyle.COLORS.primary}
            colorYoY={LineTrendStyle.COLORS.yoy}
            width={LineTrendStyle.DIMENSIONS.width}
            height={LineTrendStyle.DIMENSIONS.height}
            getHoverTitle={(idx) => {
              if (!procWeeks[idx]) return '';
              if (procMetric === 'configRatio') return `${procWeeks[idx].year}年${procWeeks[idx].weekNo}月`;
              return `${procWeeks[idx].year}年第${procWeeks[idx].weekNo}周`;
            }}
            getHoverSubtitle={(idx) => procWeeks[idx]?.rangeRaw ? `统计月份：${procWeeks[idx].rangeRaw}` : ''}
            targetValue={(() => {
              if (procMetric === 'returnRate') return 30;
              if (procMetric === 'configRatio') return 0.5;
              if (procMetric === 'newEmpReturn') return 60;
              if (procMetric === 'therapistYield') return 80;
              return null;
            })()}
            targetLabel={(() => {
              if (procMetric === 'returnRate') return '目标 30%';
              if (procMetric === 'configRatio') return '目标 0.50';
              if (procMetric === 'newEmpReturn') return '目标 60%';
              if (procMetric === 'therapistYield') return '目标 80%';
              return '目标';
            })()}
            targetColor="#4b5563"
          />
        ) : (
          <div className="bg-white p-4 rounded-lg shadow-sm text-center text-gray-500">暂无数据</div>
        )}
        <div className="mt-4 bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <h4 className="text-base font-semibold text-gray-700 mb-3 pl-2 border-l-4 border-[#a40035]">
              {procMetric === 'returnRate' ? '城市维度项目回头率统计' : '城市维度数据统计'}
          </h4>
          <DataTable data={sortedProcCityRows} columns={cityColumnsComputed} onSort={handleProcSort} sortConfig={procSortConfig} />
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal}></div>
          <div className="relative bg-white rounded-lg shadow-lg w-[90vw] max-w-4xl p-6 space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#a40035] rounded-full"></span>
                {selectedCity} · 下钻详情
              </h3>
              <button
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                onClick={closeModal}
                title="关闭"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
              <div className="space-y-4">
              {LineTrendStyle.renderHeader(
                isPriceDecompositionModal
                  ? '城市平均客单价变化趋势'
                  : (procMetric === 'configRatio'
                    ? '城市床位人员配置比变化趋势'
                    : procMetric === 'therapistYield'
                      ? '城市推拿师产值达标率趋势'
                      : procMetric === 'returnRate'
                        ? '城市项目回头率变化趋势'
                        : procMetric === 'newEmpReturn'
                          ? '城市新员工回头率达标率趋势'
                          : '城市平均客单价变化趋势'),
                isPriceDecompositionModal ? '元/人次' : (procMetric === 'configRatio' ? '人/床' : procMetric === 'therapistYield' ? '%' : procMetric === 'returnRate' ? '%' : '元/人次')
              )}
              {LineTrendStyle.renderAuxControls({
                showYoY,
                setShowYoY: () => setShowYoY(!showYoY),
                showTrend,
                setShowTrend: () => setShowTrend(!showTrend),
                showExtremes,
                setShowExtremes: () => setShowExtremes(!showExtremes)
              })}
              <LineTrendChart
                values={weeklyPrice}
                valuesYoY={weeklyPriceLY}
                xLabels={(procMetric === 'newEmpReturn' || procMetric === 'therapistYield' || procMetric === 'configRatio' || isPriceDecompositionModal)
                  ? weeks.map(w => w.label)
                  : weeks.map(w => `第${String(w.weekNo).padStart(2, '0')}周`)}
                showYoY={showYoY}
                showTrend={showTrend}
                showExtremes={showExtremes}
                yAxisFormatter={(v) => {
                  if (procMetric === 'configRatio') return Number(v).toFixed(2);
                  if (procMetric === 'returnRate' || procMetric === 'newEmpReturn' || procMetric === 'therapistYield') return Math.round(v);
                  return Number(v).toFixed(2);
                }}
                valueFormatter={(v) => {
                  if (isPriceDecompositionModal) return `¥ ${Number(v).toFixed(2)}`;
                  if (procMetric === 'configRatio') return `${Number(v).toFixed(2)}`;
                  if (procMetric === 'newEmpReturn') return `${Number(v).toFixed(2)}%`;
                  if (procMetric === 'therapistYield' || procMetric === 'returnRate') return `${Number(v).toFixed(1)}%`;
                  return `¥ ${Number(v).toFixed(2)}`;
                }}
                colorPrimary={LineTrendStyle.COLORS.primary}
                colorYoY={LineTrendStyle.COLORS.yoy}
                width={LineTrendStyle.DIMENSIONS.width}
                height={LineTrendStyle.DIMENSIONS.height}
                valuesPct={weeklyYoYRates}
                getHoverTitle={(idx) => {
                  if (!weeks[idx]) return '';
                  if (procMetric === 'configRatio') return `${weeks[idx].year}年${weeks[idx].weekNo}月`;
                  return `${weeks[idx].year}年第${weeks[idx].weekNo}周`;
                }}
                getHoverSubtitle={(idx) => weeks[idx]?.fullLabel ? `统计月份：${weeks[idx].fullLabel}` : ''}
                includeLastPointInTrend={LineTrendStyle.computeIncludeLastPointInTrend(weeks && weeks.length ? weeks[weeks.length - 1]?.fullLabel : null)}
                targetValue={(() => {
                  if (isPriceDecompositionModal) return null;
                  if (procMetric === 'returnRate') return 30;
                  if (procMetric === 'configRatio') return 0.5;
                  if (procMetric === 'newEmpReturn') return 60;
                  if (procMetric === 'therapistYield') return 80;
                  return null;
                })()}
                targetLabel={(() => {
                  if (isPriceDecompositionModal) return '目标';
                  if (procMetric === 'returnRate') return '目标 30%';
                  if (procMetric === 'configRatio') return '目标 0.50';
                  if (procMetric === 'newEmpReturn') return '目标 60%';
                  if (procMetric === 'therapistYield') return '目标 80%';
                  return '目标';
                })()}
                targetColor="#4b5563"
              />
              <div>
                <h4 className="text-base font-semibold text-gray-700 mb-3 pl-2 border-l-4 border-[#a40035]">
                  {procMetric === 'newEmpReturn' ? '技术副总负责门店新员工回头率统计' : procMetric === 'therapistYield' ? '门店产值达标率统计' : '门店维度统计'}
                </h4>
                {isModalTableLoading ? (
                  <div className="text-center py-4">数据正在加载，请等待...</div>
                ) : (
                  <DataTable data={sortedStoreRows} columns={modalColumnsComputed} onSort={handleStoreSort} sortConfig={storeSortConfig} />
                )}
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
