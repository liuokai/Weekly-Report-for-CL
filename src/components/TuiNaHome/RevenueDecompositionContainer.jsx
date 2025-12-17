import React, { useMemo, useState, useEffect } from "react";
import DataContainer from "../Common/DataContainer";
import DataTable from "../Common/DataTable";
import { parseCSV } from "../../utils/dataLoader";
import LineTrendChart from "../Common/LineTrendChart";

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

  const baseData = useMemo(
    () => [
      { city: "北京", revenue: 2557547.5, target: 3000000, budget: 180000, budgetSpent: 135000 },
      { city: "上海", revenue: 18263334.94, target: 19000000, budget: 260000, budgetSpent: 182000 },
      { city: "广州", revenue: 15647750.63, target: 16500000, budget: 220000, budgetSpent: 165000 },
      { city: "深圳", revenue: 59508119.94, target: 61000000, budget: 480000, budgetSpent: 392000 },
      { city: "杭州", revenue: 19714582.48, target: 20500000, budget: 210000, budgetSpent: 168000 },
      { city: "南京", revenue: 5615580.3, target: 6000000, budget: 120000, budgetSpent: 91000 },
      { city: "宁波", revenue: 3112302.03, target: 3500000, budget: 90000, budgetSpent: 62000 },
      { city: "成都", revenue: 169832812.69, target: 175000000, budget: 900000, budgetSpent: 735000 },
      { city: "重庆", revenue: 49291854.41, target: 51000000, budget: 420000, budgetSpent: 336000 }
    ],
    []
  );

  const rows = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const dayOfYear = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
    const isLeap = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0));
    const totalDaysYear = isLeap ? 366 : 365;
    const timeProgressRatio = totalDaysYear > 0 ? (dayOfYear / totalDaysYear) : 0;
    return baseData.map((d) => {
      const phasedTarget = d.target ? d.target * timeProgressRatio : 0;
      const completionRate = d.target ? (d.revenue / d.target) * 100 : 0;
      const completionProgress = phasedTarget ? (d.revenue / phasedTarget) * 100 : 0;
      const consumptionRate = d.budget ? (d.budgetSpent / d.budget) * 100 : 0;
      const phasedBudget = d.budget ? d.budget * timeProgressRatio : 0;
      const consumptionProgress = phasedBudget ? (d.budgetSpent / phasedBudget) * 100 : 0;
      return {
        城市名称: d.city,
        营业额: Math.round(d.revenue),
        营业额目标: Math.round(d.target),
        营业额完成进度: `${completionProgress.toFixed(1)}%`,
        营业额完成率: `${completionRate.toFixed(1)}%`,
        预算金额: Math.round(d.budget),
        预算花费金额: Math.round(d.budgetSpent),
        预算消耗进度: `${consumptionProgress.toFixed(1)}%`,
        预算消耗率: `${consumptionRate.toFixed(1)}%`,
      };
    });
  }, [baseData]);

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
    const city = baseData.find(c => c.city === cityName);
    if (city) {
      const weekRanges = buildLast12Weeks();
      setWeeks(weekRanges);
      const base = city.revenue / 52;
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

      const today = new Date();
      const year = today.getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const dayOfYear = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
      const isLeap = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0));
      const totalDaysYear = isLeap ? 366 : 365;
      const timeProgressRatio = totalDaysYear > 0 ? (dayOfYear / totalDaysYear) : 0;

      let storeNames = [];
      const normalizeCity = (n) => String(n || "").replace(/市$/, "").trim();
      try {
        const resp = await fetch("/src/data/store_list.csv");
        const text = await resp.text();
        const parsed = parseCSV(text);
        storeNames = parsed.rows
          .filter(r => normalizeCity(r["城市名称"]) === normalizeCity(cityName))
          .map(r => r["门店名称"]);
      } catch {
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
        return weeklyValues[selectedWeekIndex] * share * perf;
      });
      const totalRaw = rawRevenues.reduce((a, b) => a + b, 0) || 1;
      const scale = weeklyValues[selectedWeekIndex] / totalRaw;
      const stores = storeNames.map((name, idx) => {
        const share = weights[idx] || 1 / (storeNames.length || 1);
        const sRevenue = rawRevenues[idx] * scale;
        const sTarget = (city.target / 52) * share;
        const sBudget = (city.budget / 52) * share;
        const sSpent = (city.budgetSpent / 52) * share * consFactor(name, selectedWeekIndex);
        const phasedTarget = sTarget * timeProgressRatio;
        const phasedBudget = sBudget * timeProgressRatio;
        const completionRate = sTarget ? (sRevenue / sTarget) * 100 : 0;
        const completionProgress = phasedTarget ? (sRevenue / phasedTarget) * 100 : 0;
        const consumptionRate = sBudget ? (sSpent / sBudget) * 100 : 0;
        const consumptionProgress = phasedBudget ? (sSpent / phasedBudget) * 100 : 0;
        return {
          城市名称: name,
          营业额: Math.round(sRevenue),
          营业额目标: Math.round(sTarget),
          营业额完成进度: `${completionProgress.toFixed(1)}%`,
          营业额完成率: `${completionRate.toFixed(1)}%`,
          预算金额: Math.round(sBudget),
          预算花费金额: Math.round(sSpent),
          预算消耗进度: `${consumptionProgress.toFixed(1)}%`,
          预算消耗率: `${consumptionRate.toFixed(1)}%`,
        };
      });
      setStoreRows(stores);
    } else {
      setWeeklyData([]);
      setStoreRows([]);
    }
    setIsModalOpen(true);
  };

  const METRICS = [
    { key: "revenue", label: "周度营业额", unit: "元", format: (val) => `¥ ${Math.round(val).toLocaleString("zh-CN")}`, axisFormat: (val) => (val / 10000).toFixed(0) + "万" },
    { key: "ytdRevenue", label: "年度累计营业额", unit: "元", format: (val) => `¥ ${Math.round(val).toLocaleString("zh-CN")}`, axisFormat: (val) => (val / 100000000).toFixed(2) + "亿" },
    { key: "dailyAvgRevenue", label: "天均营业额", unit: "元", format: (val) => `¥ ${Math.round(val).toLocaleString("zh-CN")}`, axisFormat: (val) => (val / 10000).toFixed(1) + "万" },
    { key: "dailyAvgPrice", label: "天均客单价", unit: "元", format: (val) => `¥ ${val.toFixed(2)}`, axisFormat: (val) => Math.round(val) },
    { key: "avgServiceDuration", label: "推拿师日均服务时长", unit: "分钟", format: (val) => `${Math.round(val)} 分钟`, axisFormat: (val) => Math.round(val) },
    { key: "dailyAvgCustomer", label: "天均客次量", unit: "人次", format: (val) => `${Math.round(val)} 人次`, axisFormat: (val) => Math.round(val) },
  ];

  const buildCitySeries = () => {
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
          className="text-blue-600 hover:text-blue-800 underline"
          onClick={() => openCityModal(String(value).split("·")[0])}
        >
          {value}
        </button>
      )
    },
    { key: "rev", title: "营业额", dataIndex: "营业额" },
    { key: "revTarget", title: "营业额目标", dataIndex: "营业额目标" },
    { 
      key: "revProgress", 
      title: "营业额完成进度", 
      dataIndex: "营业额完成进度",
      render: (value, row) => {
        const num = parseFloat(value);
        const isMin = minProgress !== null && num === minProgress;
        const isOver = num > 100;
        const cls = isMin ? "text-green-600 font-semibold" : (isOver ? "text-red-600 font-semibold" : "text-gray-700");
        return <span className={cls}>{value}</span>;
      }
    },
    { 
      key: "revRate", 
      title: "营业额完成率", 
      dataIndex: "营业额完成率",
      render: (value) => {
        const num = parseFloat(value);
        const isOver = num > 100;
        const cls = isOver ? "text-red-600 font-semibold" : "text-gray-700";
        return <span className={cls}>{value}</span>;
      }
    },
    { key: "budget", title: "预算金额", dataIndex: "预算金额" },
    { key: "budgetSpent", title: "预算花费金额", dataIndex: "预算花费金额" },
    { 
      key: "budgetProgress", 
      title: "预算消耗进度", 
      dataIndex: "预算消耗进度",
      render: (value) => {
        const num = parseFloat(value);
        const isMin = minBudgetProgress !== null && num === minBudgetProgress;
        const isOver = num > 100;
        const cls = isMin ? "text-green-600 font-semibold" : (isOver ? "text-red-600 font-semibold" : "text-gray-700");
        return <span className={cls}>{value}</span>;
      }
    },
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
    { key: "rev", title: "营业额", dataIndex: "营业额" },
    { key: "revTarget", title: "营业额目标", dataIndex: "营业额目标" },
    { 
      key: "revProgress", 
      title: "营业额完成进度", 
      dataIndex: "营业额完成进度",
      render: (value) => {
        const num = parseFloat(value);
        const isOver = num > 100;
        const cls = isOver ? "text-red-600 font-semibold" : "text-gray-700";
        return <span className={cls}>{value}</span>;
      }
    },
    { 
      key: "revRate", 
      title: "营业额完成率", 
      dataIndex: "营业额完成率",
      render: (value) => {
        const num = parseFloat(value);
        const isOver = num > 100;
        const cls = isOver ? "text-red-600 font-semibold" : "text-gray-700";
        return <span className={cls}>{value}</span>;
      }
    },
    { key: "budget", title: "预算金额", dataIndex: "预算金额" },
    { key: "budgetSpent", title: "预算花费金额", dataIndex: "预算花费金额" },
    { 
      key: "budgetProgress", 
      title: "预算消耗进度", 
      dataIndex: "预算消耗进度",
      render: (value) => {
        const num = parseFloat(value);
        const isOver = num > 100;
        const cls = isOver ? "text-red-600 font-semibold" : "text-gray-700";
        return <span className={cls}>{value}</span>;
      }
    },
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

  const renderContent = () => {
    return (
      <div className="space-y-4">
        <DataTable data={rows} columns={columns} />
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
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">门店维度统计</p>
                    <select
                      className="px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                      value={selectedWeekIndex}
                      onChange={(e) => {
                        const idx = parseInt(e.target.value, 10);
                        setSelectedWeekIndex(idx);
                        const city = baseData.find(c => c.city === selectedCity);
                        if (!city) return;
                        const today = new Date();
                        const year = today.getFullYear();
                        const startOfYear = new Date(year, 0, 1);
                        const dayOfYear = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
                        const isLeap = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0));
                        const totalDaysYear = isLeap ? 366 : 365;
                        const timeProgressRatio = totalDaysYear > 0 ? (dayOfYear / totalDaysYear) : 0;
                        const normalizeCity = (n) => String(n || "").replace(/市$/, "").trim();
                        fetch("/src/data/store_list.csv")
                          .then(r => r.text())
                          .then(t => {
                            const parsed = parseCSV(t);
                            const storeNames = parsed.rows
                              .filter(r => normalizeCity(r["城市名称"]) === normalizeCity(selectedCity))
                              .map(r => r["门店名称"]);
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
                              const r = ((sum + weekIdx * 17) % 101) / 100;
                              const delta = (r - 0.5) * 0.1;
                              return 1 + delta;
                            };
                            const consFactor = (name, weekIdx) => {
                              const s = String(name);
                              let sum = 0;
                              for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i) * 1.3;
                              const r = ((sum + weekIdx * 23) % 101) / 100;
                              const delta = (r - 0.5) * 0.12;
                              return 1 + delta;
                            };
                            const weights = computeWeights(storeNames);
                            const rawRevenues = storeNames.map((name, i) => {
                              const share = weights[i] || 1 / (storeNames.length || 1);
                              return weeklyData[idx] * share * perfFactor(name, idx);
                            });
                            const totalRaw = rawRevenues.reduce((a, b) => a + b, 0) || 1;
                            const scale = weeklyData[idx] / totalRaw;
                            const updated = storeNames.map((name, i) => {
                              const share = weights[i] || 1 / (storeNames.length || 1);
                              const sRevenue = rawRevenues[i] * scale;
                              const sTarget = (city.target / 52) * share;
                              const sBudget = (city.budget / 52) * share;
                              const sSpent = (city.budgetSpent / 52) * share * consFactor(name, idx);
                              const phasedTarget = sTarget * timeProgressRatio;
                              const phasedBudget = sBudget * timeProgressRatio;
                              const completionRate = sTarget ? (sRevenue / sTarget) * 100 : 0;
                              const completionProgress = phasedTarget ? (sRevenue / phasedTarget) * 100 : 0;
                              const consumptionRate = sBudget ? (sSpent / sBudget) * 100 : 0;
                              const consumptionProgress = phasedBudget ? (sSpent / phasedBudget) * 100 : 0;
                              return {
                                城市名称: name,
                                营业额: Math.round(sRevenue),
                                营业额目标: Math.round(sTarget),
                                营业额完成进度: `${completionProgress.toFixed(1)}%`,
                                营业额完成率: `${completionRate.toFixed(1)}%`,
                                预算金额: Math.round(sBudget),
                                预算花费金额: Math.round(sSpent),
                                预算消耗进度: `${consumptionProgress.toFixed(1)}%`,
                                预算消耗率: `${consumptionRate.toFixed(1)}%`,
                              };
                            });
                            setStoreRows(updated);
                          })
                          .catch(() => {});
                      }}
                    >
                      {weeks.map((w, i) => (
                        <option key={i} value={i}>{w.label}</option>
                      ))}
                    </select>
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
      title="城市营业完成情况"
      data={{ rows }}
      renderContent={renderContent}
    />
  );
};

export default RevenueDecompositionContainer;
