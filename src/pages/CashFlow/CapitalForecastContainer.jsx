import React, { useMemo, useState, useEffect } from 'react';
import BusinessTargets from '../../config/businessTargets';
import DataContainer from '../../components/Common/DataContainer';
import FilterDropdown from '../../components/Common/FilterDropdown';
import useFetchData from '../../hooks/useFetchData';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList } from 'recharts';

/**
 * 2026年公司总部及城市维度资金测算周报容器
 * 
 * 核心逻辑：
 * 1. 自有资金可用金额 = 2025年末资金结余 + 预计2026年经营资金结余【门店】 + 预计2026年经营资金结余【总部】 - 预计2026年资金安全线
 * 2. 实际结余资金 = 自有资金可用金额 - 预计2026年开店支出
 * 
 * 展示：
 * - 纵向科目：7个核心指标
 * - 横向维度：2025年末值、2026年已发生值、2026年待发生值、2026年滚动全年值、2026年初预算值、差异
 */
const CapitalForecastContainer = () => {
  // 获取城市列表（从配置中获取，实际应结合后端数据）
  const cityTargets2025 = BusinessTargets.capitalBalance?.target2025?.cityTargets || {};
  const cityList = ['总部', ...Object.keys(cityTargets2025)];
  
  const [selectedCity, setSelectedCity] = useState('总部');

  const { data: cashFlowMonthlyData, fetchData } = useFetchData('getCashFlowBudgetMonthly', [], [], { manual: false });
  const { data: safetyLineData } = useFetchData('getCashFlowCapitalSafetyLine', [], [], { manual: false });
  const { data: newStoreProcessData } = useFetchData('getCashFlowNewStoreProcess', [], [], { manual: false });

  // 调试日志：观察实际获取到的数据
  useEffect(() => {
    console.log('[CapitalForecastContainer] cashFlowMonthlyData:', cashFlowMonthlyData);
    console.log('[CapitalForecastContainer] safetyLineData:', safetyLineData);
    console.log('[CapitalForecastContainer] newStoreProcessData:', newStoreProcessData);
  }, [cashFlowMonthlyData, safetyLineData, newStoreProcessData]);

  const storeCashFlowAnnual = useMemo(() => {
    if (!Array.isArray(cashFlowMonthlyData) || cashFlowMonthlyData.length === 0) {
      return {
        occurred: null,
        pending: null,
        rolling: null,
        budget: null
      };
    }
    let occurred = 0;
    let pending = 0;
    let rolling = 0;
    let budget = 0;

    // 动态获取当前年份
    const now = new Date();
    const currentYear = String(now.getFullYear());

    for (const row of cashFlowMonthlyData) {
      // 过滤年份：只统计当年的数据
      if (!row.month || !row.month.startsWith(currentYear)) {
        continue;
      }

      // 过滤城市：如果是总部则统计所有，否则只统计选中城市
      // 注意：后端 SQL 现已按城市分组返回，字段中包含 city_name
      if (selectedCity !== '总部' && row.city_name !== selectedCity) {
        continue;
      }
      
      // 使用 cash_flow 相关字段 (经营资金结余)
      occurred += Number(row.total_cash_flow_actual || 0);
      pending += Number(row.remaining_cash_flow_budget || 0);
      rolling += Number(row.total_cash_flow_rolling || 0);
      budget += Number(row.total_cash_flow_budget || 0);
    }
    return { occurred, pending, rolling, budget };
  }, [cashFlowMonthlyData, selectedCity]);

  const safetyLineTotal = useMemo(() => {
    if (!Array.isArray(safetyLineData) || safetyLineData.length === 0) return null;
    
    if (selectedCity === '总部') {
      // 当用户查看“总部”维度时，展示的资金安全线为该 SQL 执行后所有城市+总部的条数的和
      return safetyLineData.reduce((total, row) => total + Number(row.total_funds || 0), 0);
    } else {
      // 当用户查看各个城市维度时，展示的资金安全线数值为对应城市的数值
      const cityData = safetyLineData.find(row => row.city_name === selectedCity);
      return cityData ? Number(cityData.total_funds || 0) : 0;
    }
  }, [safetyLineData, selectedCity]);

  // 计算预计2026年开店支出
  // 包含：预算值（全年目标）、已发生值（至今实际）、滚动值（暂定=预算）、待发生值（滚动-已发生）
  const openingExpenditure = useMemo(() => {
    if (!Array.isArray(newStoreProcessData) || newStoreProcessData.length === 0) {
      return { budget: 0, occurred: 0 };
    }

    let totalNewStoresBudget = 0;
    let totalReinstallsBudget = 0;
    let totalNewStoresActual = 0;
    let totalReinstallsActual = 0;

    const newStoreBudgetUnit = Number(BusinessTargets.capitalBalance?.newStoreInvestmentBudget || 0);
    const oldStoreBudgetUnit = Number(BusinessTargets.capitalBalance?.oldStoreRenovationBudget || 0);

    for (const row of newStoreProcessData) {
      // 排除 SQL 返回的汇总行，防止重复计算
      if (row.city_name === '月度合计') {
        continue;
      }

      // 过滤城市：如果是总部则统计所有，否则只统计选中城市
      // 注意：SQL返回的字段名为中文别名
      if (selectedCity !== '总部' && row.city_name !== selectedCity) {
        continue;
      }

      // 过滤年份：动态获取当前年份，只统计当年的数据
      // 例如：当前是 2026 年，则统计 2026-01 至今；当前是 2027 年，则统计 2027-01 至今
      const now = new Date();
      const currentYear = String(now.getFullYear());

      // 假设 row.month 格式为 'YYYY-MM'
      if (!row.month || !row.month.startsWith(currentYear)) {
        continue;
      }

      // 预算值：累加当前年份的全年目标
      totalNewStoresBudget += Number(row['new_store_target'] || 0);
      totalReinstallsBudget += Number(row['reinstall_target'] || 0);

      // 已发生值：只统计当年 1 月至今（<=当前月份）的实际数量
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      if (row.month <= currentMonth) {
        totalNewStoresActual += Number(row['new_store_count'] || 0);
        totalReinstallsActual += Number(row['reinstall_count'] || 0);
      }
    }

    const budget = (totalNewStoresBudget * newStoreBudgetUnit) + (totalReinstallsBudget * oldStoreBudgetUnit);
    const occurred = (totalNewStoresActual * newStoreBudgetUnit) + (totalReinstallsActual * oldStoreBudgetUnit);

    return { budget, occurred };
  }, [newStoreProcessData, selectedCity]);

  // 获取配置数据 (2025 年末资金结余)
  const getConfigurationData = (city) => {
    const isHQ = city === '总部';
    const configuredTotal = BusinessTargets.capitalBalance?.target2025?.totalBalance;
    const balance2025 = isHQ
      ? Number(configuredTotal || 0)
      : Number(cityTargets2025[city] || 0);
    
    // 总部经营结余预算值
    const hqProfitBudget = isHQ 
      ? Number(BusinessTargets.headquartersCostAccounting?.summary?.headquartersProfit || 0)
      : 0;

    return { balance2025, hqProfitBudget };
  };

  const data = useMemo(() => {
    const configData = getConfigurationData(selectedCity);
    
    // 构建 7 行数据
    // 1. 2025年末资金结余
    const row1 = {
      id: '1',
      subject: '2025年末资金结余',
      col_2025_end: configData.balance2025,
      col_2026_occurred: null,
      col_2026_pending: null,
      col_2026_rolling: configData.balance2025, 
      col_2026_budget: configData.balance2025,  
      isBold: false
    };

    // 2. 预计2026年经营资金结余（父科目）
    // 汇总：门店 + 总部
    const row2_parent = {
      id: '2_parent',
      subject: '预计2026年经营资金结余',
      col_2025_end: null,
      col_2026_occurred: (storeCashFlowAnnual.occurred || 0),
      col_2026_pending: (storeCashFlowAnnual.pending || 0),
      col_2026_rolling: (storeCashFlowAnnual.rolling || 0) + (selectedCity === '总部' ? (configData.hqProfitBudget || 0) : 0),
      col_2026_budget: (storeCashFlowAnnual.budget || 0) + (selectedCity === '总部' ? (configData.hqProfitBudget || 0) : 0),
      isBold: true
    };

    // 2.1 预计2026年经营资金结余【门店】
    const row2 = {
      id: '2',
      subject: '预计2026年经营资金结余【门店】',
      col_2025_end: null,
      col_2026_occurred: storeCashFlowAnnual.occurred,
      col_2026_pending: storeCashFlowAnnual.pending,
      col_2026_rolling: storeCashFlowAnnual.rolling,
      col_2026_budget: storeCashFlowAnnual.budget,
      isBold: false,
      isIndent: true,
      isGray: true
    };

    // 2.2 预计2026年经营资金结余【总部】
    const row3 = {
      id: '3',
      subject: '预计2026年经营资金结余【总部】',
      col_2025_end: null,
      col_2026_occurred: null,
      col_2026_pending: null,
      col_2026_rolling: configData.hqProfitBudget,
      col_2026_budget: configData.hqProfitBudget,
      isBold: false,
      isIndent: true,
      isGray: true
    };

    // 4. 预计2026年资金安全线
    const row4 = {
      id: '4',
      subject: '预计2026年资金安全线',
      col_2025_end: null,
      col_2026_occurred: null, 
      col_2026_pending: null,
      col_2026_rolling: safetyLineTotal,
      col_2026_budget: safetyLineTotal,
      isBold: false
    };

    // 5. 预计2026年自有资金可用金额
    // 逻辑：2025年末资金结余 + (预计2026年经营资金结余【门店】+ 预计2026年经营资金结余【总部】) - 预计2026年资金安全线
    // 即：2025年末资金结余 + 预计2026年经营资金结余(父) - 预计2026年资金安全线
    const availableFundsRolling = (row1.col_2026_rolling || 0) + 
                                  (row2_parent.col_2026_rolling || 0) - 
                                  (row4.col_2026_rolling || 0);

    // 预算值计算逻辑同上，使用 col_2026_budget 列
    const availableFundsBudget = (row1.col_2026_budget || 0) +
                                 (row2_parent.col_2026_budget || 0) -
                                 (row4.col_2026_budget || 0);

    const row5 = {
      id: '5',
      subject: '预计2026年自有资金可用金额',
      col_2025_end: null,
      col_2026_occurred: null, 
      col_2026_pending: null,
      col_2026_rolling: availableFundsRolling,
      col_2026_budget: availableFundsBudget,
      isHighlight: true 
    };

    // 6. 预计2026年开店支出
    const row6 = {
      id: '6',
      subject: '预计2026年开店支出',
      col_2025_end: null,
      col_2026_occurred: openingExpenditure.occurred,
      col_2026_pending: openingExpenditure.budget - openingExpenditure.occurred,
      // 确认：2026年滚动全年值逻辑当前为空，暂定等于2026年初预算值
      col_2026_rolling: openingExpenditure.budget,
      col_2026_budget: openingExpenditure.budget,
      isBold: false
    };

    // 7. 预计2026年实际结余资金
    // 逻辑：预计2026年自有资金可用金额 - 预计2026年开店支出
    const actualBalanceBudget = availableFundsBudget - (openingExpenditure.budget || 0);
    const actualBalanceRolling = availableFundsRolling - (row6.col_2026_rolling || 0);

    const row7 = {
      id: '7',
      subject: '预计2026年实际结余资金',
      col_2025_end: null,
      col_2026_occurred: null,
      col_2026_pending: null,
      col_2026_rolling: actualBalanceRolling,
      col_2026_budget: actualBalanceBudget,
      isHighlight: true 
    };

    // 构建行顺序：2025年末 -> 经营结余(父) -> 经营结余(门店) -> 经营结余(总部) -> 资金安全线 -> ...
    const rows = [row1, row2_parent];
    
    // 只有在总部视角下才展示拆分明细（门店、总部）
    // 当选择特定城市时，父科目数据等于门店数据，无需展示子科目
    if (selectedCity === '总部') {
      rows.push(row2);
      rows.push(row3);
    }
    
    rows.push(row4, row5, row6, row7);

    return rows;
  }, [selectedCity, storeCashFlowAnnual, safetyLineTotal, openingExpenditure]);

  const formatMoney = (val) => {
    if (val === null || val === undefined) return '-';
    return val.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const formatWan = (val) => {
    if (val === null || val === undefined) return '-';
    const wan = Number(val) / 10000;
    return `${wan.toLocaleString('zh-CN', { maximumFractionDigits: 0 })} 万`;
  };
  const formatWanAxis = (val) => {
    const wan = Number(val) / 10000;
    return `${wan.toFixed(0)}万`;
  };
  const formatYuan = (val) => {
    if (val === null || val === undefined) return '-';
    return `¥ ${Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };
  const configData = useMemo(() => getConfigurationData(selectedCity), [selectedCity]);
  const balance2025 = configData.balance2025 || 0;
  const operatingTotal = (storeCashFlowAnnual.rolling || 0) + (selectedCity === '总部' ? (configData.hqProfitBudget || 0) : 0);
  const operatingOccurred = storeCashFlowAnnual.occurred || 0;
  const operatingPending = Math.max((operatingTotal || 0) - (operatingOccurred || 0), 0);
  const safetyLine = safetyLineTotal || 0;
  const availableFunds = (balance2025 || 0) + (operatingTotal || 0) - (safetyLine || 0);
  const openSpendBudget = openingExpenditure.budget || 0;
  const openSpendOccurred = openingExpenditure.occurred || 0;
  const openSpendPending = Math.max((openSpendBudget || 0) - (openSpendOccurred || 0), 0);
  const finalBalance = (availableFunds || 0) - (openSpendBudget || 0);
  const waterfallData = useMemo(() => {
    const step1 = balance2025;
    const step2 = step1 + operatingTotal;
    const step3 = step2 - safetyLine;
    const step4 = step3 - openSpendBudget;
    return [
      { name: '2025年末资金结余', base: 0, delta: step1, type: 'total' },
      { name: '预计2026年经营资金结余', base: step1, delta: operatingTotal, type: 'increase' },
      { name: '预计2026年资金安全线', base: step2, delta: -safetyLine, type: 'decrease' },
      { name: '预计2026年开店支出', base: step3, delta: -openSpendBudget, type: 'decrease' },
      { name: '预计2026年实际结余资金', base: 0, delta: step4, type: 'total' }
    ];
  }, [balance2025, operatingTotal, safetyLine, openSpendBudget]);
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const p = payload.find(d => d.dataKey === 'delta');
      if (!p) return null;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-md text-sm">
          <div className="font-bold text-gray-800 mb-1">{label}</div>
          <div className="text-gray-600">数值：<span className="font-medium text-gray-900">{formatWan(p.value)}</span></div>
        </div>
      );
    }
    return null;
  };

  const renderFilters = () => (
    <div className="flex flex-row relative z-40">
        <FilterDropdown 
            label="城市" 
            value={selectedCity} 
            options={cityList} 
            onChange={setSelectedCity}
            showAllOption={false}
        />
    </div>
  );

  return (
    <DataContainer
      title="2026年公司总部及城市资金测算"
      renderFilters={renderFilters}
      maxHeight="none"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="p-4 rounded-lg border border-gray-200 bg-white">
            <div className="text-xs text-gray-500 mb-1">2025年末资金结余</div>
            <div className="text-2xl font-bold text-gray-900">{formatWan(balance2025)}</div>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 bg-white">
            <div className="text-xs text-gray-500 mb-1">预计2026年经营资金结余</div>
            <div className="text-2xl font-bold text-green-600">{formatWan(operatingTotal)}</div>
            <div className="text-xs text-gray-500 mt-1">已发生：{formatWan(operatingOccurred)}</div>
            <div className="text-xs text-gray-500">待发生：{formatWan(operatingPending)}</div>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 bg-white">
            <div className="text-xs text-gray-500 mb-1">预计2026年资金安全线</div>
            <div className="text-2xl font-bold text-red-600">{formatWan(safetyLine)}</div>
          </div>
          <div className="p-4 rounded-lg border border-[#a40035] bg-[#a40035]/5">
            <div className="text-xs text-[#a40035] mb-1">预计2026年自有资金可用金额</div>
            <div className="text-2xl font-bold text-[#a40035]">{formatWan(availableFunds)}</div>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 bg-white">
            <div className="text-xs text-gray-500 mb-1">预计2026年开店支出</div>
            <div className="text-2xl font-bold text-red-600">{formatWan(openSpendBudget)}</div>
            <div className="text-xs text-gray-500 mt-1">已发生：{formatWan(openSpendOccurred)}</div>
            <div className="text-xs text-gray-500">待发生：{formatWan(openSpendPending)}</div>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 bg-white">
            <div className="text-xs text-gray-500 mb-1">预计2026年实际结余资金</div>
            <div className="text-2xl font-bold text-gray-900">{formatWan(finalBalance)}</div>
          </div>
        </div>

        <div className="w-full h-[420px] rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm font-bold text-gray-700 mb-3">资金流向瀑布图（单位：万元）</div>
          <div className="w-full h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                <YAxis tickFormatter={formatWanAxis} tick={{ fontSize: 12, fill: '#9ca3af' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="base" stackId="stack" fill="#e5e7eb" />
                <Bar dataKey="delta" stackId="stack">
                  {waterfallData.map((entry, index) => {
                    const type = entry.type;
                    let fill = '#a40035';
                    if (type === 'increase') fill = '#16a34a';
                    if (type === 'decrease') fill = '#ef4444';
                    return <Cell key={`cell-${index}`} fill={fill} />;
                  })}
                  <LabelList dataKey="delta" position="top" formatter={(v) => (Number(v) / 10000).toFixed(0) + '万'} className="text-xs fill-gray-700" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DataContainer>
  );
};

export default CapitalForecastContainer;
