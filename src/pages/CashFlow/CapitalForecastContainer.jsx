import React, { useMemo, useState, useEffect } from 'react';
import BusinessTargets from '../../config/businessTargets';
import DataContainer from '../../components/Common/DataContainer';
import DataTable from '../../components/Common/DataTable';
import FilterDropdown from '../../components/Common/FilterDropdown';
import useFetchData from '../../hooks/useFetchData';

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
      totalNewStoresBudget += Number(row['新店目标'] || 0);
      totalReinstallsBudget += Number(row['重装目标'] || 0);

      // 已发生值：只统计当年 1 月至今（<=当前月份）的实际数量
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      if (row.month <= currentMonth) {
        totalNewStoresActual += Number(row['新店数量'] || 0);
        totalReinstallsActual += Number(row['重装数量'] || 0);
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

    // 2. 预计2026年经营资金结余【门店】
    const row2 = {
      id: '2',
      subject: '预计2026年经营资金结余【门店】',
      col_2025_end: null,
      col_2026_occurred: storeCashFlowAnnual.occurred,
      col_2026_pending: storeCashFlowAnnual.pending,
      col_2026_rolling: storeCashFlowAnnual.rolling,
      col_2026_budget: storeCashFlowAnnual.budget,
      isBold: false
    };

    // 3. 预计2026年经营资金结余【总部】
    const row3 = {
      id: '3',
      subject: '预计2026年经营资金结余【总部】',
      col_2025_end: null,
      col_2026_occurred: null,
      col_2026_pending: null,
      col_2026_rolling: configData.hqProfitBudget,
      col_2026_budget: configData.hqProfitBudget,
      isBold: false
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
    // 逻辑：2025年末资金结余 + 预计2026年经营资金结余【门店】+ 预计2026年经营资金结余【总部】 - 预计2026年资金安全线
    // 注意：如果不在总部视角，row3 (总部经营结余) 应该视为 0
    const availableFundsRolling = (row1.col_2026_rolling || 0) + 
                                  (row2.col_2026_rolling || 0) + 
                                  (selectedCity === '总部' ? (row3.col_2026_rolling || 0) : 0) - 
                                  (row4.col_2026_rolling || 0);

    // 预算值计算逻辑同上，使用 col_2026_budget 列
    const availableFundsBudget = (row1.col_2026_budget || 0) +
                                 (row2.col_2026_budget || 0) +
                                 (selectedCity === '总部' ? (row3.col_2026_budget || 0) : 0) -
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

    const rows = [row1, row2];
    // 只有在总部视角下才展示“预计2026年经营资金结余【总部】”
    if (selectedCity === '总部') {
      rows.push(row3);
    }
    rows.push(row4, row5, row6, row7);

    return rows;
  }, [selectedCity, storeCashFlowAnnual, safetyLineTotal, openingExpenditure]);

  // 格式化金额
  const formatMoney = (val) => {
    if (val === null || val === undefined) return '-';
    return val.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // 渲染差异列
  const renderDiff = (row) => {
    // 只有滚动值和预算值都存在时才比较
    if (row.col_2026_rolling === null || row.col_2026_budget === null) return '-';
    
    const diff = row.col_2026_rolling - row.col_2026_budget;
    const pct = row.col_2026_budget !== 0 ? (diff / row.col_2026_budget) * 100 : 0;
    
    // 差异值的颜色逻辑：通常正差异（结余更多）为绿，负差异为红
    // 除非是支出项（如开店支出），如果支出多了（正差异），反而是坏事？
    // 但需求只说“差异值为滚动-预算”，未指定颜色方向，这里沿用通用的红绿逻辑：
    // 大于等于0为绿（或默认黑），小于0为红？
    // 用户之前的逻辑是：滚动<预算为红，滚动>预算为绿。
    const colorClass = diff >= 0 ? 'text-green-600' : 'text-red-600';
    const sign = diff > 0 ? '+' : '';
    
    return (
      <div className={`flex flex-col items-end ${colorClass}`}>
        <span className="font-medium">{formatMoney(diff)}</span>
        <span className="text-xs opacity-80">({sign}{pct.toFixed(2)}%)</span>
      </div>
    );
  };

  const columns = [
    {
      key: 'subject',
      title: '资金预测科目',
      dataIndex: 'subject',
      width: '240px',
      fixed: 'left',
      render: (text, row) => (
        <span className={`${row.isHighlight ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
          {text}
        </span>
      )
    },
    {
      key: 'col_2025_end',
      title: '2025年末值',
      dataIndex: 'col_2025_end',
      align: 'right',
      width: '150px',
      render: (val) => <span className="text-gray-600">{formatMoney(val)}</span>
    },
    {
      key: 'col_2026_occurred',
      title: '2026年已发生值',
      dataIndex: 'col_2026_occurred',
      align: 'right',
      width: '150px',
      className: 'bg-blue-50/30', // 微弱淡蓝底色
      render: (val, row) => (
        <span className={`${row.isHighlight ? 'font-semibold' : ''} text-gray-700`}>
          {formatMoney(val)}
        </span>
      )
    },
    {
      key: 'col_2026_pending',
      title: '2026年待发生值',
      dataIndex: 'col_2026_pending',
      align: 'right',
      width: '150px',
      className: 'bg-gray-50/50', // 微弱淡灰底色
      render: (val, row) => (
        <span className={`${row.isHighlight ? 'font-semibold' : ''} text-gray-700`}>
          {formatMoney(val)}
        </span>
      )
    },
    {
      key: 'col_2026_rolling',
      title: '2026年滚动全年值',
      dataIndex: 'col_2026_rolling',
      align: 'right',
      width: '160px',
      render: (val, row) => (
        <span className="font-bold text-gray-900">
          {formatMoney(val)}
        </span>
      )
    },
    {
      key: 'col_2026_budget',
      title: '2026年初预算值',
      dataIndex: 'col_2026_budget',
      align: 'right',
      width: '150px',
      render: (val) => <span className="text-gray-600">{formatMoney(val)}</span>
    },
    {
      key: 'diff',
      title: '差异',
      width: '140px',
      align: 'right',
      render: (_, row) => renderDiff(row)
    }
  ];

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
      <DataTable
        columns={columns}
        data={data}
        rowClassName={(row) => row.isHighlight ? 'bg-[#a40035]/5 hover:bg-[#a40035]/10' : ''}
        // 禁用默认分页，展示所有行
        pagination={false}
      />
    </DataContainer>
  );
};

export default CapitalForecastContainer;
