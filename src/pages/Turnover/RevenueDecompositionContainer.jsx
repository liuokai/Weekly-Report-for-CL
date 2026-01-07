import React, { useMemo, useState, useEffect } from "react";
import DataContainer from "../../components/Common/DataContainer";
import DataTable from "../../components/Common/DataTable";
import LineTrendChart from "../../components/Common/LineTrendChart";
import useFetchData from "../../hooks/useFetchData";
import { getTimeProgress } from "../../components/Common/TimeProgressUtils";
import BusinessTargets from "../../config/businessTargets";
import useTableSorting from "../../components/Common/useTableSorting";

// Static config removed as per user request (mock data is meaningless)

const RevenueDecompositionContainer = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(11);
  const [storeRows, setStoreRows] = useState([]);
  const [selectedMetricKey, setSelectedMetricKey] = useState("revenue");
  const [showYoY, setShowYoY] = useState(false);
  const [showTrend, setShowTrend] = useState(true);
  const [showExtremes, setShowExtremes] = useState(true);
  
  const { data: fetchedData, loading, fetchData } = useFetchData('getCityTurnover');
  const { data: storeWeeklyData, loading: storeWeeklyLoading, fetchData: fetchStoreWeeklyData } = useFetchData('getCityStoreWeeklyTurnover', [], [], { manual: true });
  const { data: modalTrendData, loading: modalLoading, error: modalError, fetchData: fetchModalTrendData } = useFetchData('getCityWeeklyTrend', [], [], { manual: true });
  const { data: modalCumData, loading: modalCumLoading, error: modalCumError, fetchData: fetchModalCumData } = useFetchData('getCityWeeklyCumTrend', [], [], { manual: true });
  const { data: modalAvgDayData, loading: modalAvgDayLoading, error: modalAvgDayError, fetchData: fetchModalAvgDayData } = useFetchData('getCityWeeklyAvgDayTrend', [], [], { manual: true });
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (fetchedData && Array.isArray(fetchedData) && fetchedData.length > 0) {
      const timeProgressVal = getTimeProgress();
      const totalRevenue = fetchedData.reduce((acc, curr) => acc + (Number(curr.actual_turnover) || 0), 0);

      const processedRows = fetchedData.map(item => {
        // Fallback logic for city name if statistics_city_name is missing/null
        const city = item.statistics_city_name || item.city || '未知城市';
        
        // Use actual_turnover from SQL；目标仅由配置控制
        const revenue = Number(item.actual_turnover) || 0;
        const configTargets = BusinessTargets?.turnover?.cityTargets || {};
        const targetFromConfig = configTargets[city];
        const target = targetFromConfig != null ? Number(targetFromConfig) : 0;
        
        // Budget data is not available in SQL yet, showing as missing per user request
        const budget = null;
        const budgetSpent = null;

        // Calculations
        const completionRate = target ? (revenue / target) * 100 : 0;
        const contributionRate = totalRevenue ? (revenue / totalRevenue) * 100 : 0;

        return {
          城市名称: city,
          营业额: Math.round(revenue),
          营业额目标: Math.round(target),
          时间进度: `${timeProgressVal}%`,
          营业额完成率: `${completionRate.toFixed(1)}%`,
          预算金额: budget,
          预算花费金额: budgetSpent,
          预算消耗率: null,
          营业额贡献率: `${contributionRate.toFixed(1)}%` 
        };
      });
      setRows(processedRows);
    } else {
      setRows([]);
    }
  }, [fetchedData]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen]);


  const progressNumbers = rows.map(r => parseFloat(r["营业额完成进度"]));
  const minProgress = progressNumbers.length > 0 ? Math.min(...progressNumbers) : null;
  const budgetProgressNumbers = rows.map(r => parseFloat(r["预算消耗进度"]));
  const minBudgetProgress = budgetProgressNumbers.length > 0 ? Math.min(...budgetProgressNumbers) : null;

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
    const fmtYMD = (dt) => `${String(dt.getFullYear()).slice(-2)}${String(dt.getMonth() + 1).padStart(2, "0")}${String(dt.getDate()).padStart(2, "0")}`;
    const weekNo = getISOWeek(d);
    const label = `第 ${String(weekNo).padStart(2, "0")} 周（${fmtYMD(monday)}-${fmtYMD(sunday)}）`;
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
    setIsModalOpen(true);
    setSelectedMetricKey("revenue");
    fetchStoreWeeklyData([cityName]);
    fetchModalTrendData([cityName]);
    fetchModalCumData([cityName]);
    fetchModalAvgDayData([cityName]);

    const normalizeCity = (n) => String(n || "").replace(/市$/, "").trim();
    const city = fetchedData ? fetchedData.find(c => normalizeCity(c.statistics_city_name || c.city) === normalizeCity(cityName)) : null;

    if (city) {
      const weekRanges = buildLast12Weeks();
      setWeeks(weekRanges);
      
      // If we don't have SQL data yet (loading or empty), we set up fallback structure
      // But actual rendering checks modalTrendData in buildCitySeries
      const base = (Number(city.actual_turnover) || 0) / 52;
      const nameSeed = String(cityName).split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      const N = weekRanges.length;
      const weeklyValues = weekRanges.map((_, i) => {
        const smooth = 1 + 0.012 * Math.sin((i / N) * 2 * Math.PI);
        const noiseRaw = ((nameSeed + i * 31) % 100) / 100; // 0..1
        const noise = (noiseRaw - 0.5) * 0.01; // -0.005..0.005
        const factor = smooth + noise;
        return Math.round(base * factor);
      });
      setWeeklyData(weeklyValues);
      setSelectedWeekIndex(11);
    } else {
      setWeeklyData([]);
      setStoreRows([]);
    }
  };

  useEffect(() => {
    if (selectedCity && storeWeeklyData && Array.isArray(storeWeeklyData) && storeWeeklyData.length > 0) {
      let maxYear = 0;
      let maxWeek = 0;
      
      // Map to store accumulated annual revenue
      const storeAnnualRevenueMap = new Map();

      storeWeeklyData.forEach(item => {
          if (item.year > maxYear) {
              maxYear = item.year;
              maxWeek = item.week;
          } else if (item.year === maxYear && item.week > maxWeek) {
              maxWeek = item.week;
          }
      });
      
      // Calculate annual revenue for maxYear
      storeWeeklyData.forEach(item => {
        if (item.year === maxYear) {
           const currentTotal = storeAnnualRevenueMap.get(item.store_name) || 0;
           storeAnnualRevenueMap.set(item.store_name, currentTotal + (Number(item.current_value) || 0));
        }
      });

      const latestData = storeWeeklyData.filter(item => item.year === maxYear && item.week === maxWeek);
      const timeProgressVal = getTimeProgress();

      const stores = latestData.map(item => {
        return {
          城市名称: item.store_name,
          本周营业额: Math.round(Number(item.current_value) || 0),
          本周营业额同比: item.yoy_change !== null ? `${item.yoy_change}%` : '-',
          年度营业额: Math.round(storeAnnualRevenueMap.get(item.store_name) || 0),
          营业额目标: null,
          时间进度: `${timeProgressVal}%`,
          营业额完成率: null,
          预算金额: null,
          预算花费金额: null,
          预算消耗率: null,
        };
      });
      
      stores.sort((a, b) => b.本周营业额 - a.本周营业额);
      setStoreRows(stores);
    } else {
      setStoreRows([]);
    }
  }, [storeWeeklyData, selectedCity]);

  const METRICS = [
    { key: "revenue", label: "周度营业额", unit: "元", format: (val) => `¥ ${Math.round(val).toLocaleString("zh-CN")}`, axisFormat: (val) => (val / 10000).toFixed(0) + "万" },
    { key: "ytdRevenue", label: "年度累计营业额", unit: "元", format: (val) => `¥ ${Math.round(val).toLocaleString("zh-CN")}`, axisFormat: (val) => (val / 100000000).toFixed(2) + "亿" },
    { key: "dailyAvgRevenue", label: "天均营业额", unit: "元", format: (val) => `¥ ${Math.round(val).toLocaleString("zh-CN")}`, axisFormat: (val) => (val / 10000).toFixed(1) + "万" },
  ];

  const calculateTrendLineLogic = (values, rawData) => {
    if (!values || values.length === 0) return true;
    const lastIndex = values.length - 1;
    const lastItem = rawData && rawData[lastIndex];
    if (!lastItem || !lastItem.date_range) return true;
    
    const parts = lastItem.date_range.split('~');
    if (parts.length < 2) return true;
    
    const endDateStr = parts[1].trim();
    const endDate = new Date(endDateStr);
    const today = new Date();
    endDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    
    return endDate < today;
  };

  const buildCitySeries = () => {
    let currentData = [];
    let currentKey = '';
    let lyKey = null;

    if (selectedMetricKey === 'revenue') {
      currentData = modalTrendData;
      currentKey = 'current_value';
      lyKey = 'last_year_value';
    } else if (selectedMetricKey === 'ytdRevenue') {
      currentData = modalCumData;
      currentKey = 'running_total_revenue';
      lyKey = null;
    } else if (selectedMetricKey === 'dailyAvgRevenue') {
      currentData = modalAvgDayData;
      currentKey = '周天均营业额';
      lyKey = '去年同期天均营业额';
    }

    if (currentData && currentData.length > 0) {
      const labels = [];
      const series = { [selectedMetricKey]: [] };
      const seriesLY = { [selectedMetricKey]: [] };
      const sortedAll = [...currentData].sort((a, b) => {
        const ya = Number(a.year || a.s_year || 0);
        const yb = Number(b.year || b.s_year || 0);
        if (ya !== yb) return ya - yb;
        const wa = Number(a.week || a.s_week || 0);
        const wb = Number(b.week || b.s_week || 0);
        return wa - wb;
      });
      const recent12 = sortedAll.slice(-12);
      
      recent12.forEach(row => {
        const weekNum = String(row.week).padStart(2, '0');
        labels.push(`第${weekNum}周`);
        
        const val = Number(row[currentKey]) || 0;
        series[selectedMetricKey].push(val);
        
        if (lyKey) {
          const valLY = Number(row[lyKey]) || 0;
          seriesLY[selectedMetricKey].push(valLY);
        } else {
          seriesLY[selectedMetricKey].push(0);
        }
      });
      
      return { series, seriesLY, labels, rawData: recent12 };
    }

    return { series: {}, seriesLY: {}, labels: [], rawData: [] };
  };

  const columns = [
    { 
      key: "city", 
      title: "城市名称", 
      dataIndex: "城市名称",
      render: (value) => (
        <button
          className="text-[#a40035] hover:underline font-medium"
          onClick={() => openCityModal(String(value).split("·")[0])}
        >
          {value}
        </button>
      )
    },
    { 
      key: "revTarget", 
      title: "营业额目标", 
      dataIndex: "营业额目标",
      render: (value) => value ? Number(value).toLocaleString() : value
    },
    { 
      key: "rev", 
      title: "营业额", 
      dataIndex: "营业额",
      render: (value) => value ? Number(value).toLocaleString() : value
    },
    { 
      key: "revRate", 
      title: "营业额完成率", 
      dataIndex: "营业额完成率",
      render: (value, row) => {
        const rateNum = parseFloat(value);
        const timeNum = parseFloat(row?.["时间进度"] || "0");
        const highlight = rateNum > timeNum;
        const cls = highlight ? "text-red-600 font-semibold" : "text-gray-700";
        return <span className={cls}>{value}</span>;
      }
    },
    { key: "timeProgress", title: "时间进度", dataIndex: "时间进度" },
    { key: "budget", title: "预算金额", dataIndex: "预算金额" },
    { key: "budgetSpent", title: "预算花费金额", dataIndex: "预算花费金额" },
    { 
      key: "budgetRate", 
      title: "预算消耗率", 
      dataIndex: "预算消耗率",
      render: (value) => {
        const num = parseFloat(value);
        const isOver = num > 100;
        const cls = isOver ? "text-red-600 font-semibold" : "text-gray-700";
        return <span className={cls}>{value}</span>;
      }
    },
  ];

  const columnsForStore = [
    { key: "city", title: "门店名称", dataIndex: "城市名称" },
    { 
      key: "revTarget", 
      title: "营业额目标", 
      dataIndex: "营业额目标",
      render: (value) => value ? Number(value).toLocaleString() : value
    },
    {
      key: "annualRev",
      title: "年度营业额",
      dataIndex: "年度营业额",
      render: (value) => value ? Number(value).toLocaleString() : value
    },
    { 
      key: "revRate", 
      title: "营业额完成率", 
      dataIndex: "营业额完成率",
      render: (value, row) => {
        if (!value) return '-';
        const rateNum = parseFloat(value);
        const timeNum = parseFloat(row?.["时间进度"] || "0");
        const highlight = rateNum > timeNum;
        const cls = highlight ? "text-red-600 font-semibold" : "text-gray-700";
        return <span className={cls}>{value}</span>;
      }
    },
    { 
      key: "rev", 
      title: "本周营业额", 
      dataIndex: "本周营业额",
      render: (value) => value ? Number(value).toLocaleString() : value
    },
    {
      key: "revYoY",
      title: "本周营业额同比",
      dataIndex: "本周营业额同比",
      render: (value) => {
        if (!value || value === '-') return '-';
        const num = parseFloat(value);
        const color = num >= 0 ? "text-red-600" : "text-green-600";
        return <span className={`${color} font-medium`}>{value}</span>;
      }
    },
    { key: "timeProgress", title: "时间进度", dataIndex: "时间进度" },
    { key: "budget", title: "预算金额", dataIndex: "预算金额" },
    { key: "budgetSpent", title: "预算花费金额", dataIndex: "预算花费金额" },
    { 
      key: "budgetRate", 
      title: "预算消耗率", 
      dataIndex: "预算消耗率",
      render: (value) => {
        if (!value) return '-';
        const num = parseFloat(value);
        const isOver = num > 100;
        const cls = isOver ? "text-red-600 font-semibold" : "text-gray-700";
        return <span className={cls}>{value}</span>;
      }
    },
  ];

  const { sortedData, sortConfig, handleSort } = useTableSorting(columns, rows);
  const { sortedData: sortedStoreRows, sortConfig: storeSortConfig, handleSort: handleStoreSort } = useTableSorting(columnsForStore, storeRows);

  const renderContent = () => {
    const { series, seriesLY, labels, rawData } = buildCitySeries();

    return (
      <div className="space-y-4">
        <DataTable 
          data={sortedData} 
          columns={columns} 
          onSort={handleSort}
          sortConfig={sortConfig}
        />
        {isModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
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
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {METRICS.map((metric) => (
                      <button
                        key={metric.key}
                        onClick={() => setSelectedMetricKey(metric.key)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedMetricKey === metric.key ? "bg-[#a40035]/10 text-[#a40035]" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                      >
                        {metric.label}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setShowYoY(!showYoY)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${showYoY ? "bg-[#2563eb]/10 text-[#2563eb] border-[#2563eb]" : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100"}`}
                    >
                      显示同比
                    </button>
                    <button
                      onClick={() => setShowTrend(!showTrend)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${showTrend ? "bg-[#a40035]/10 text-[#a40035] border-[#a40035]" : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100"}`}
                    >
                      显示趋势
                    </button>
                    <button
                      onClick={() => setShowExtremes(!showExtremes)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${showExtremes ? "bg-[#a40035]/10 text-[#a40035] border-[#a40035]" : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100"}`}
                    >
                      显示极值
                    </button>
                  </div>

                  <div className="min-h-[300px] w-full bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                    {(modalLoading || modalCumLoading || modalAvgDayLoading) ? (
                      <div className="flex flex-col items-center text-gray-400">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#a40035] rounded-full animate-spin mb-2"></div>
                        <span>数据加载中...</span>
                      </div>
                    ) : (modalError || modalCumError || modalAvgDayError) ? (
                        <div className="text-red-500">
                            数据加载失败: {modalError || modalCumError || modalAvgDayError}
                        </div>
                    ) : (
                      <LineTrendChart
                        headerTitle={`${(METRICS.find(m => m.key === selectedMetricKey) || METRICS[0]).label}趋势`}
                        headerUnit={(METRICS.find(m => m.key === selectedMetricKey) || METRICS[0]).unit}
                        values={(series[selectedMetricKey] || [])}
                        valuesYoY={(seriesLY[selectedMetricKey] || [])}
                        xLabels={labels}
                        showYoY={showYoY}
                        showTrend={showTrend}
                        showExtremes={showExtremes}
                        includeLastPointInTrend={calculateTrendLineLogic(series[selectedMetricKey], rawData)}
                        yAxisFormatter={(METRICS.find(m => m.key === selectedMetricKey) || METRICS[0]).axisFormat}
                        valueFormatter={(METRICS.find(m => m.key === selectedMetricKey) || METRICS[0]).format}
                        width={800}
                        height={280}
                        padding={{ top: 40, right: 40, bottom: 60, left: 45 }}
                        colorPrimary="#a40035"
                        colorYoY="#2563eb"
                      />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-600">门店维度统计</p>
                  </div>
                  <div className="border border-gray-200 rounded">
                    {storeRows.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500">该城市当前无在营门店数据</div>
                    ) : (
                      <DataTable data={sortedStoreRows} columns={columnsForStore} stickyHeader={false} onSort={handleStoreSort} sortConfig={storeSortConfig} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <DataContainer
      title="城市营业额完成情况"
      data={{ rows }}
      maxHeight="none"
      renderContent={renderContent}
    />
  );
};

export default RevenueDecompositionContainer;
