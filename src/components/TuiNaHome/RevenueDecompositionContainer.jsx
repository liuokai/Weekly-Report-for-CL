import React, { useMemo, useState, useEffect } from "react";
import DataContainer from "../Common/DataContainer";
import DataTable from "../Common/DataTable";
import { parseCSV } from "../../utils/dataLoader";

const RevenueDecompositionContainer = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(11);
  const [storeRows, setStoreRows] = useState([]);

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

  const LineChart = ({ data, weeks }) => {
    if (!data || data.length === 0) return <div className="text-gray-500">暂无数据</div>;
    const width = 900;
    const height = 240;
    const bottomSpace = 44;
    const svgHeight = height + bottomSpace;
    const padding = 30;
    const maxVal = Math.max(...data) * 1.1;
    const minVal = Math.min(...data) * 0.9;
    const xStep = (width - padding * 2) / (data.length - 1);
    const points = data.map((v, i) => {
      const x = padding + i * xStep;
      const y = padding + (height - padding * 2) * (1 - (v - minVal) / (maxVal - minVal));
      return { x, y };
    });
    const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const [hover, setHover] = useState(null);
    const fmtYMD = (dt) => `${String(dt.getFullYear()).slice(-2)}${String(dt.getMonth() + 1).padStart(2, "0")}${String(dt.getDate()).padStart(2, "0")}`;
    return (
      <svg viewBox={`0 0 ${width} ${svgHeight}`} className="w-full h-full">
        <polyline points={`${padding},${height - padding} ${width - padding},${height - padding}`} stroke="#e5e7eb" fill="none" />
        <polyline points={`${padding},${padding} ${padding},${height - padding}`} stroke="#e5e7eb" fill="none" />
        <path d={path} stroke="#a40035" strokeWidth="2" fill="none" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="#a40035"
            onMouseEnter={() => setHover({ x: p.x, y: p.y, idx: i })}
            onMouseMove={() => setHover({ x: p.x, y: p.y, idx: i })}
            onMouseLeave={() => setHover(null)}
          />
        ))}
        {points.map((p, i) => (
          <text
            key={`xl-${i}`}
            x={p.x}
            y={height - padding + 16}
            fontSize="10"
            textAnchor="middle"
            fill="#6b7280"
          >
            {weeks?.[i] ? `W${String(weeks[i].weekNo).padStart(2, "0")}` : ""}
          </text>
        ))}
        {points.map((p, i) => (
          <text
            key={`val-${i}`}
            x={p.x}
            y={p.y - 8}
            fontSize="10"
            textAnchor="middle"
            fill="#374151"
          >
            {Math.round(data[i]).toLocaleString("zh-CN")}
          </text>
        ))}
        <text x={padding} y={padding - 10} fontSize="12" fill="#6b7280">营业额</text>
        {hover && weeks?.[hover.idx] && (
          <>
            {(() => {
              const w = 160;
              const h = 70;
              const ox = 12;
              const oy = -12;
              const tx = Math.min(Math.max(hover.x + ox, padding), width - padding - w);
              const ty = Math.min(Math.max(hover.y + oy, padding), svgHeight - h - 4);
              const wk = weeks[hover.idx];
              const range = `${fmtYMD(wk.start)}-${fmtYMD(wk.end)}`;
              const weekNum = String(wk.weekNo).padStart(2, "0");
              const rev = Math.round(data[hover.idx]).toLocaleString("zh-CN");
              return (
                <g>
                  <rect x={tx} y={ty} width={w} height={h} rx="6" ry="6" fill="#ffffff" stroke="#e5e7eb" />
                  <text x={tx + 10} y={ty + 18} fontSize="12" fill="#111827">营业额：{rev}</text>
                  <text x={tx + 10} y={ty + 36} fontSize="12" fill="#374151">周数：{weekNum}</text>
                  <text x={tx + 10} y={ty + 54} fontSize="12" fill="#6b7280">日期范围：{range}</text>
                </g>
              );
            })()}
          </>
        )}
      </svg>
    );
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
            <div className="relative bg-white rounded-lg shadow-lg w-[90vw] max-w-4xl p-6 space-y-4 h-[85vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{selectedCity} · 下钻详情</h3>
                <button
                  className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsModalOpen(false)}
                >
                  关闭
                </button>
              </div>
              <div className="flex-1 min-h-0 flex flex-col gap-4">
                <div className="flex-[4] min-h-0 space-y-2">
                  <p className="text-sm text-gray-600">当周营业额（周维度）</p>
                  <div className="w-full h-full">
                    <LineChart 
                      data={weeklyData} 
                      weeks={weeks}
                    />
                  </div>
                </div>
                <div className="flex-[6] min-h-0 space-y-2 flex flex-col">
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
                  <div className="flex-1 min-h-0 overflow-y-auto border border-gray-200 rounded">
                    {storeRows.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500">该城市当前无在营门店数据</div>
                    ) : (
                      <DataTable data={storeRows} columns={columnsForStore} />
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
      title="营业额拆解"
      data={{ rows }}
      renderContent={renderContent}
    />
  );
};

export default RevenueDecompositionContainer;
