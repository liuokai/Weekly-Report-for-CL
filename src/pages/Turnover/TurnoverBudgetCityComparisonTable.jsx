import React, { useEffect, useMemo, useRef, useState } from "react";
import DataContainer from "../../components/Common/DataContainer";
import useFetchData from "../../hooks/useFetchData";

const TITLE = "城市营业额预算实际对比";
const FIELD_KEYS = {
  month: "月份",
  city: "城市名称",
  budgetOld: "老店营业额-预算",
  budgetNew: "新店营业额-预算",
  actualOld: "老店营业额-实际",
  actualNew: "新店营业额-实际"
};

const SECONDARY_HEADERS = [
  "预算-老店",
  "预算-新店",
  "预算-合计",
  "实际-老店",
  "实际-新店",
  "实际-合计",
  "完成率-老店",
  "完成率-新店",
  "完成率-合计"
];

const SUMMARY_CITY = "合计";

const normalizeCity = (value) => {
  const text = String(value || "").trim();
  return text;
};

const toNumber = (value) => {
  if (value == null || value === "") return 0;
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
};

const hasAmountValue = (value) => {
  if (value == null || value === "") return false;
  const num = Number(value);
  return !Number.isNaN(num);
};

const formatAmount = (value) => {
  if (!hasAmountValue(value)) return "-";
  return Number(value).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatPercent = (value) => `${(toNumber(value) * 100).toFixed(2)}%`;

const parseMonthValue = (value) => {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!year || month < 1 || month > 12) return null;

  return `${match[1]}-${match[2]}`;
};

const getLastMonthValue = () => {
  const now = new Date();
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = lastMonthDate.getFullYear();
  const month = String(lastMonthDate.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const buildDefaultMonthRange = (months) => {
  if (!months.length) return { startMonth: "", endMonth: "" };

  const lastMonth = getLastMonthValue();
  const firstAvailableMonth = months[0];
  const lastAvailableMonth = months[months.length - 1];
  const year = (lastAvailableMonth.split("-")[0] || "").trim();
  const defaultStartCandidate = year ? `${year}-01` : firstAvailableMonth;

  const startMonth = months.includes(defaultStartCandidate)
    ? defaultStartCandidate
    : months.find((month) => month >= defaultStartCandidate) || firstAvailableMonth;

  let endMonth = months.includes(lastMonth)
    ? lastMonth
    : [...months].reverse().find((month) => month < lastMonth) || lastAvailableMonth;

  if (endMonth < startMonth) {
    endMonth = startMonth;
  }

  return { startMonth, endMonth };
};

const buildTableRows = (rows, startMonth, endMonth) => {
  if (!Array.isArray(rows) || !rows.length || !startMonth || !endMonth) return [];

  const rangeRows = rows.filter((row) => {
    const month = String(row[FIELD_KEYS.month] || "").trim();
    return month && month >= startMonth && month <= endMonth;
  });

  if (!rangeRows.length) return [];

  const cityMap = new Map();
  const cityOrder = [];

  rangeRows.forEach((row) => {
    const city = normalizeCity(row[FIELD_KEYS.city]);
    if (!city) return;

    if (city !== SUMMARY_CITY && !cityMap.has(city)) {
      cityOrder.push(city);
    }

    const current = cityMap.get(city) || {
      city,
      oldBudget: 0,
      newBudget: 0,
      totalBudget: 0,
      oldActual: 0,
      newActual: 0,
      totalActual: 0
    };

    current.oldBudget += toNumber(row[FIELD_KEYS.budgetOld]);
    current.newBudget += toNumber(row[FIELD_KEYS.budgetNew]);
    current.oldActual += toNumber(row[FIELD_KEYS.actualOld]);
    current.newActual += toNumber(row[FIELD_KEYS.actualNew]);
    current.totalBudget = current.oldBudget + current.newBudget;
    current.totalActual = current.oldActual + current.newActual;

    cityMap.set(city, current);
  });

  const mappedRows = Array.from(cityMap.values());
  const summary = mappedRows.reduce(
    (acc, row) => ({
      city: SUMMARY_CITY,
      oldBudget: acc.oldBudget + row.oldBudget,
      newBudget: acc.newBudget + row.newBudget,
      totalBudget: acc.totalBudget + row.totalBudget,
      oldActual: acc.oldActual + row.oldActual,
      newActual: acc.newActual + row.newActual,
      totalActual: acc.totalActual + row.totalActual
    }),
    {
      city: SUMMARY_CITY,
      oldBudget: 0,
      newBudget: 0,
      totalBudget: 0,
      oldActual: 0,
      newActual: 0,
      totalActual: 0
    }
  );

  return [...mappedRows, summary].sort((a, b) => {
    if (a.city === SUMMARY_CITY) return 1;
    if (b.city === SUMMARY_CITY) return -1;

    const aIndex = cityOrder.indexOf(a.city);
    const bIndex = cityOrder.indexOf(b.city);
    return (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) - (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex);
  });
};

const SelectorDropdown = ({ options, value, onChange, placeholder, minWidth = "130px" }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-sm font-medium text-gray-700 flex items-center gap-2 justify-between"
        style={{ minWidth }}
      >
        <span className="truncate">{value || placeholder}</span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 max-h-60 overflow-y-auto bg-gray-100 border border-gray-200 rounded-lg shadow-lg z-50">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 hover:bg-gray-200 ${
                value === option ? "text-[#a40035] font-semibold" : "text-gray-700"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const TurnoverBudgetCityComparisonTable = () => {
  const { data: rowsRaw, loading, error } = useFetchData("getTurnoverBudgetCity", [], []);
  const rows = Array.isArray(rowsRaw) ? rowsRaw : [];

  const monthOptions = useMemo(
    () => [...new Set(rows.map((row) => parseMonthValue(row[FIELD_KEYS.month])).filter(Boolean))].sort(),
    [rows]
  );

  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");

  useEffect(() => {
    if (!monthOptions.length) return;

    const defaults = buildDefaultMonthRange(monthOptions);
    setStartMonth((current) => (current && monthOptions.includes(current) ? current : defaults.startMonth));
    setEndMonth((current) => (current && monthOptions.includes(current) ? current : defaults.endMonth));
  }, [monthOptions]);

  useEffect(() => {
    if (!startMonth || !endMonth) return;
    if (startMonth > endMonth) {
      setEndMonth(startMonth);
    }
  }, [startMonth, endMonth]);

  const startMonthOptions = useMemo(
    () => monthOptions.filter((option) => !endMonth || option <= endMonth),
    [monthOptions, endMonth]
  );

  const endMonthOptions = useMemo(
    () => monthOptions.filter((option) => !startMonth || option >= startMonth),
    [monthOptions, startMonth]
  );

  const tableRows = useMemo(() => buildTableRows(rows, startMonth, endMonth), [rows, startMonth, endMonth]);

  const renderFilters = () => (
    <div className="flex flex-wrap gap-3 justify-end">
      <SelectorDropdown options={startMonthOptions} value={startMonth} onChange={setStartMonth} placeholder="开始月份" />
      <SelectorDropdown options={endMonthOptions} value={endMonth} onChange={setEndMonth} placeholder="结束月份" />
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return <div className="py-12 text-center text-gray-500">数据加载中...</div>;
    }

    if (error) {
      return <div className="py-12 text-center text-red-500">数据加载失败: {error}</div>;
    }

    if (!tableRows.length) {
      return <div className="py-12 text-center text-gray-500">暂无数据</div>;
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] border-collapse text-sm text-center text-black">
          <thead className="bg-gray-50 text-xs text-gray-600">
            <tr>
              <th rowSpan={2} className="border border-gray-300 px-4 py-2 font-bold min-w-[100px]">
                城市
              </th>
              <th colSpan={3} className="border border-gray-300 px-4 py-2 font-bold bg-gray-100 min-w-[330px]">
                预算营业额
              </th>
              <th colSpan={3} className="border border-gray-300 px-4 py-2 font-bold bg-gray-100 min-w-[330px]">
                实际营业额
              </th>
              <th colSpan={3} className="border border-gray-300 px-4 py-2 font-bold bg-gray-100 min-w-[300px]">
                实际/预算
              </th>
            </tr>
            <tr>
              {SECONDARY_HEADERS.map((headerKey) => (
                <th key={headerKey} className="border border-gray-300 px-4 py-2 font-bold bg-gray-50 min-w-[100px]">
                  {headerKey.split("-")[1]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, index) => {
              const isSummary = row.city === SUMMARY_CITY;
              const rowBg = isSummary ? "bg-red-50 font-bold" : index % 2 === 0 ? "bg-white" : "bg-gray-50";
              const oldCompletion = row.oldBudget ? row.oldActual / row.oldBudget : 0;
              const newCompletion = row.newBudget ? row.newActual / row.newBudget : 0;
              const totalCompletion = row.totalBudget ? row.totalActual / row.totalBudget : 0;

              return (
                <tr key={`${row.city}-${index}`} className={rowBg}>
                  <td className={`border border-gray-300 px-4 py-2 ${isSummary ? "text-[#a40035]" : ""}`}>{row.city}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{formatAmount(row.oldBudget)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{formatAmount(row.newBudget)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{formatAmount(row.totalBudget)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{formatAmount(row.oldActual)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{formatAmount(row.newActual)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{formatAmount(row.totalActual)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{formatPercent(oldCompletion)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{formatPercent(newCompletion)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{formatPercent(totalCompletion)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <DataContainer
      title={TITLE}
      data={{ rows: tableRows, startMonth, endMonth }}
      maxHeight="none"
      renderFilters={renderFilters}
      renderContent={renderContent}
    />
  );
};

export default TurnoverBudgetCityComparisonTable;
