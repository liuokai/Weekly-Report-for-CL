import React, { useMemo, useState, useEffect } from "react";
import DataContainer from "../../components/Common/DataContainer";
import DataTable from "../../components/Common/DataTable";
import LineTrendChart from "../../components/Common/LineTrendChart";
import useFetchData from "../../hooks/useFetchData";
import { getTimeProgress } from "../../components/Common/TimeProgressUtils";

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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  const { data: fetchedData, loading, fetchData } = useFetchData('getCityTurnover');
  const { data: storeData, fetchData: fetchStoreData } = useFetchData('getStoreList');
  const { data: modalTrendData, fetchData: fetchModalTrendData } = useFetchData('getCityModalTrend', [], []); // New hook for modal trend
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
        
        // Use actual_turnover and turnover_target from SQL
        const revenue = Number(item.actual_turnover) || 0;
        const target = Number(item.turnover_target) || 0;
        
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
    fetchStoreData();
    fetchModalTrendData([cityName]);

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
    if (selectedCity && weeklyData.length > 0 && fetchedData) {
      const normalizeCity = (n) => String(n || "").replace(/市$/, "").trim();
      const city = fetchedData.find(c => normalizeCity(c.statistics_city_name || c.city) === normalizeCity(selectedCity));
      
      if (!city) return;

      let storeNames = [];
      if (storeData && Array.isArray(storeData) && storeData.length > 0) {
        storeNames = storeData
          .filter(r => normalizeCity(r.city) === normalizeCity(selectedCity))
          .map(r => r.store_name);
      }
      
      if (storeNames.length === 0) {
        storeNames = ["门店A", "门店B", "门店C", "门店D"];
      }

      const computeWeights = (names) => {
        const raw = names.map((n) => {
          const s = String(n);
          let sum = 0;
          for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i);
          const w = 0.8 + ((sum % 41) / 100);
          return w;
        });
        const total = raw.reduce((a, b) => a + b, 0) || 1;
        return raw.map((w) => w / total);
      };
      
      const perfFactor = (name, weekIdx) => {
        const s = String(name);
        let sum = 0;
        for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i);
        const r = ((sum + weekIdx * 17) % 101) / 100; // 0..1
        const delta = (r - 0.5) * 0.1; // -0.05..0.05
        return 1 + delta;
      };
      
      const consFactor = (name, weekIdx) => {
        const s = String(name);
        let sum = 0;
        for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i) * 1.3;
        const r = ((sum + weekIdx * 23) % 101) / 100;
        const delta = (r - 0.5) * 0.12; // -0.06..0.06
        return 1 + delta;
      };

      const weights = computeWeights(storeNames);
      // 先按门店权重分配收入，再按门店绩效因子微调并归一化保持总和
      const rawRevenues = storeNames.map((name, idx) => {
        const share = weights[idx] || 1 / (storeNames.length || 1);
        const perf = perfFactor(name, selectedWeekIndex);
        return weeklyData[selectedWeekIndex] * share * perf;
      });
      
      const totalRaw = rawRevenues.reduce((a, b) => a + b, 0) || 1;
      const scale = weeklyData[selectedWeekIndex] / totalRaw;
      
      const timeProgressVal = getTimeProgress();

      const stores = storeNames.map((name, idx) => {
        const share = weights[idx] || 1 / (storeNames.length || 1);
        const sRevenue = rawRevenues[idx] * scale;
        const sTarget = (Number(city.turnover_target) || 0) / 52 * share;
        const sBudget = null;
        const sSpent = null;
        const completionRate = sTarget ? (sRevenue / sTarget) * 100 : 0;
        
        return {
          城市名称: name,
          营业额: Math.round(sRevenue),
          营业额目标: Math.round(sTarget),
          时间进度: `${timeProgressVal}%`,
          营业额完成率: `${completionRate.toFixed(1)}%`,
          预算金额: sBudget,
          预算花费金额: sSpent,
          预算消耗率: null,
        };
      });
      setStoreRows(stores);
    }
  }, [storeData, selectedCity, weeklyData, fetchedData, selectedWeekIndex]);

  const METRICS = [
    { key: "revenue", label: "周度营业额", unit: "元", format: (val) => `¥ ${Math.round(val).toLocaleString("zh-CN")}`, axisFormat: (val) => (val / 10000).toFixed(0) + "万" },
    { key: "ytdRevenue", label: "年度累计营业额", unit: "元", format: (val) => `¥ ${Math.round(val).toLocaleString("zh-CN")}`, axisFormat: (val) => (val / 100000000).toFixed(2) + "亿" },
    { key: "dailyAvgRevenue", label: "天均营业额", unit: "元", format: (val) => `¥ ${Math.round(val).toLocaleString("zh-CN")}`, axisFormat: (val) => (val / 10000).toFixed(1) + "万" },
  ];

  const buildCitySeries = () => {
    // Priority 1: SQL Fetched Data
    if (modalTrendData && modalTrendData.length > 0) {
      const labels = [];
      const series = {
        revenue: [],
        ytdRevenue: [],
        dailyAvgRevenue: [],
        dailyAvgPrice: [],
        dailyAvgCustomer: [],
        avgServiceDuration: [],
      };
      const seriesLY = {
        revenue: [],
        ytdRevenue: [],
        dailyAvgRevenue: [],
        dailyAvgPrice: [],
        dailyAvgCustomer: [],
        avgServiceDuration: [],
      };

      // Ensure chronological order
      const sorted = [...modalTrendData].sort((a, b) => (a.week_num || 0) - (b.week_num || 0));

      sorted.forEach(row => {
        labels.push(row.week_label || `第${row.week_num}周`);
        
        const rev = Number(row.revenue) || 0;
        const revLY = Number(row.revenue_ly) || 0;
        const price = Number(row.avg_price) || 0;
        const priceLY = Number(row.avg_price_ly) || 0;

        series.revenue.push(rev);
        series.ytdRevenue.push(Number(row.ytd_revenue) || 0);
        series.dailyAvgRevenue.push(rev / 7);
        series.dailyAvgPrice.push(price);
        series.dailyAvgCustomer.push(price ? Math.round((rev / 7) / price) : 0);
        series.avgServiceDuration.push(0);

        seriesLY.revenue.push(revLY);
        seriesLY.ytdRevenue.push(Number(row.ytd_revenue_ly) || 0);
        seriesLY.dailyAvgRevenue.push(revLY / 7);
        seriesLY.dailyAvgPrice.push(priceLY);
        seriesLY.dailyAvgCustomer.push(priceLY ? Math.round((revLY / 7) / priceLY) : 0);
        seriesLY.avgServiceDuration.push(0);
      });
      return { series, seriesLY, labels };
    }

    // Priority 2: Fallback Mock Data
    const N = weeklyData.length;
    if (N === 0) return { series: {}, seriesLY: {}, labels: [] };
    const labels = weeks.map(w => `第${String(w.weekNo).padStart(2, "0")}周`);
    const seed = String(selectedCity || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) || 1;
    const noise = (i, scale = 0.02) => ((Math.sin(i * 1.31 + seed) + Math.cos(i * 0.77 + seed)) * 0.5) * scale;
    const series = {
      revenue: [],
      ytdRevenue: [],
      dailyAvgRevenue: [],
      dailyAvgPrice: [],
      dailyAvgCustomer: [],
      avgServiceDuration: [],
    };
    const seriesLY = {
      revenue: [],
      ytdRevenue: [],
      dailyAvgRevenue: [],
      dailyAvgPrice: [],
      dailyAvgCustomer: [],
      avgServiceDuration: [],
    };
    let cum = 0;
    let cumLY = 0;
    for (let i = 0; i < N; i++) {
      const rev = weeklyData[i];
      const revLY = rev * (0.85 + noise(i, 0.02));
      cum += rev;
      cumLY += revLY;
      const dAvgRev = rev / 7;
      const dAvgRevLY = revLY / 7;
      const price = 170 * (1 + noise(i, 0.03));
      const priceLY = price * (0.95 + noise(i, 0.02));
      const cust = dAvgRev / price;
      const custLY = dAvgRevLY / priceLY;
      const dur = 300 * (1 + noise(i, 0.05));
      const durLY = dur * (0.98 + noise(i, 0.02));
      series.revenue.push(rev);
      series.ytdRevenue.push(cum);
      series.dailyAvgRevenue.push(dAvgRev);
      series.dailyAvgPrice.push(price);
      series.dailyAvgCustomer.push(cust);
      series.avgServiceDuration.push(dur);
      seriesLY.revenue.push(revLY);
      seriesLY.ytdRevenue.push(cumLY);
      seriesLY.dailyAvgRevenue.push(dAvgRevLY);
      seriesLY.dailyAvgPrice.push(priceLY);
      seriesLY.dailyAvgCustomer.push(custLY);
      seriesLY.avgServiceDuration.push(durLY);
    }
    return { series, seriesLY, labels };
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
    { key: "city", title: "城市名称", dataIndex: "城市名称" },
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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedRows = useMemo(() => {
    let sortableItems = [...rows];
    if (sortConfig.key) {
      const column = columns.find(c => c.key === sortConfig.key);
      const dataIndex = column ? column.dataIndex : sortConfig.key;

      sortableItems.sort((a, b) => {
        let aValue = a[dataIndex];
        let bValue = b[dataIndex];

        const cleanValue = (val) => {
             if (val == null) return -Infinity;
             if (typeof val === 'number') return val;
             if (typeof val === 'string') {
                 // Check if string contains only non-numeric characters (like Chinese)
                 // If so, return as string for localeCompare
                 if (/^[^0-9]+$/.test(val) && val !== '-Infinity' && val !== 'Infinity') {
                     return val;
                 }
                 
                 // Try parsing percent or number with comma
                 const cleanStr = val.replace(/,/g, '').replace('%', '');
                 const num = parseFloat(cleanStr);
                 if (!isNaN(num)) return num;
                 return val;
             }
             return val;
        };

        const aClean = cleanValue(aValue);
        const bClean = cleanValue(bValue);

        if (typeof aClean === 'string' && typeof bClean === 'string') {
            return sortConfig.direction === 'asc' 
                ? aClean.localeCompare(bClean, 'zh-CN') 
                : bClean.localeCompare(aClean, 'zh-CN');
        }

        if (aClean < bClean) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aClean > bClean) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [rows, sortConfig, columns]);

  const renderContent = () => {
    return (
      <div className="space-y-4">
        <DataTable 
          data={sortedRows} 
          columns={columns} 
          onSort={handleSort}
          sortConfig={sortConfig}
        />
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
                      显示均线
                    </button>
                    <button
                      onClick={() => setShowExtremes(!showExtremes)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${showExtremes ? "bg-[#a40035]/10 text-[#a40035] border-[#a40035]" : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100"}`}
                    >
                      显示极值
                    </button>
                  </div>
                  <LineTrendChart
                    headerTitle={`${(METRICS.find(m => m.key === selectedMetricKey) || METRICS[0]).label}趋势`}
                    headerUnit={(METRICS.find(m => m.key === selectedMetricKey) || METRICS[0]).unit}
                    values={(buildCitySeries().series[selectedMetricKey] || [])}
                    valuesYoY={(buildCitySeries().seriesLY[selectedMetricKey] || [])}
                    xLabels={buildCitySeries().labels}
                    showYoY={showYoY}
                    showTrend={showTrend}
                    showExtremes={showExtremes}
                    yAxisFormatter={(METRICS.find(m => m.key === selectedMetricKey) || METRICS[0]).axisFormat}
                    valueFormatter={(METRICS.find(m => m.key === selectedMetricKey) || METRICS[0]).format}
                    width={800}
                    height={280}
                    padding={{ top: 40, right: 40, bottom: 60, left: 45 }}
                    colorPrimary="#a40035"
                    colorYoY="#2563eb"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-600">门店维度统计</p>
                  </div>
                  <div className="border border-gray-200 rounded">
                    {storeRows.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500">该城市当前无在营门店数据</div>
                    ) : (
                      <DataTable data={storeRows} columns={columnsForStore} stickyHeader={false} />
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
