import React, { useMemo, useState } from 'react';
import BusinessTargets from '../../config/businessTargets';
import DataContainer from '../../components/Common/DataContainer';
import DataTable from '../../components/Common/DataTable';
import FilterDropdown from '../../components/Common/FilterDropdown';

/**
 * 2026年城市新店投资与现金流预算执行情况
 * 
 * 包含科目：
 * 1. 新店投资
 * 2. 经营现金流
 * 3. 年度结余 (计算逻辑：经营现金流 - 新店投资)
 */
const CityBudgetExecutionContainer = () => {
  // 获取城市列表
  const cityTargets2025 = BusinessTargets.capitalBalance?.target2025?.cityTargets || {};
  const cityList = ['总部', ...Object.keys(cityTargets2025)];
  
  const [selectedCity, setSelectedCity] = useState('总部');

  // 模拟数据生成器
  const getMockData = (city) => {
    // 基础因子
    const baseFactor = city === '总部' ? 5 : (city.length + 2);
    
    // 1. 新店投资 (Flow)
    const investmentBudget = 3000000 * baseFactor;
    const investmentOccurred = investmentBudget * 0.2;
    const investmentPending = investmentBudget * 0.8;
    const investment2025 = investmentBudget * 0.9; // 2025对比值

    // 2. 经营现金流 (Flow)
    const operatingBudget = 5000000 * baseFactor;
    const operatingOccurred = operatingBudget * 0.3;
    const operatingPending = operatingBudget * 0.75; // 稍微超支一点
    const operating2025 = operatingBudget * 0.85;

    // 3. 年度结余 (Balance/Net Flow)
    // 逻辑：结余 = 经营 - 投资
    // 2025年末值：这里的定义可能是 2025年的净现金流？或者 2025年末的资金余额？
    // 根据表格上下文，如果是“年度结余”，通常指当年的净增减额。
    // 如果指“资金余额”，通常会叫“期末余额”。
    // 这里假设是当年的净现金流 (Net Cash Flow)
    const balance2025 = operating2025 - investment2025;
    const balanceBudget = operatingBudget - investmentBudget;
    const balanceOccurred = operatingOccurred - investmentOccurred;
    const balancePending = operatingPending - investmentPending;
    const balanceRolling = (operatingOccurred + operatingPending) - (investmentOccurred + investmentPending);

    return {
      investment: {
        val2025: investment2025,
        occurred: investmentOccurred,
        pending: investmentPending,
        rolling: investmentOccurred + investmentPending,
        budget: investmentBudget
      },
      operating: {
        val2025: operating2025,
        occurred: operatingOccurred,
        pending: operatingPending,
        rolling: operatingOccurred + operatingPending,
        budget: operatingBudget
      },
      balance: {
        val2025: balance2025,
        occurred: balanceOccurred,
        pending: balancePending,
        rolling: balanceRolling,
        budget: balanceBudget
      }
    };
  };

  const data = useMemo(() => {
    const mock = getMockData(selectedCity);
    
    const row1 = {
      id: '1',
      subject: '新店投资',
      col_2025_end: mock.investment.val2025,
      col_2026_occurred: mock.investment.occurred,
      col_2026_pending: mock.investment.pending,
      col_2026_rolling: mock.investment.rolling,
      col_2026_budget: mock.investment.budget,
    };

    const row2 = {
      id: '2',
      subject: '经营现金流',
      col_2025_end: mock.operating.val2025,
      col_2026_occurred: mock.operating.occurred,
      col_2026_pending: mock.operating.pending,
      col_2026_rolling: mock.operating.rolling,
      col_2026_budget: mock.operating.budget,
    };

    const row3 = {
      id: '3',
      subject: '年度结余',
      col_2025_end: mock.balance.val2025,
      col_2026_occurred: mock.balance.occurred,
      col_2026_pending: mock.balance.pending,
      col_2026_rolling: mock.balance.rolling,
      col_2026_budget: mock.balance.budget,
      isHighlight: true
    };

    return [row1, row2, row3];
  }, [selectedCity]);

  // 格式化金额
  const formatMoney = (val) => {
    if (val === null || val === undefined) return '-';
    return val.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // 渲染差异列
  const renderDiff = (row) => {
    if (row.col_2026_rolling === null || row.col_2026_budget === null) return '-';
    
    const diff = row.col_2026_rolling - row.col_2026_budget;
    const pct = row.col_2026_budget !== 0 ? (diff / row.col_2026_budget) * 100 : 0;
    
    // 差异颜色逻辑：
    // 对于“新店投资”（支出项），正差异（超支）通常为红，负差异（节约）为绿？
    // 对于“经营现金流”（收入项），正差异（超收）为绿，负差异（短收）为红？
    // 目前沿用通用逻辑：大于0为绿，小于0为红（假设正差异代表“多出来的钱”或“多出来的数值”）。
    // 如果用户有特定要求（如支出超支为红），需调整。目前保持一致性。
    // 考虑到“年度结余”如果多了是好事（绿）。
    // “新店投资”如果多了是坏事（红）。
    // 暂时统一逻辑，后续可根据 subject 调整。
    
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
      title: '2025年末值', // 或 2025年发生值，根据用户需求标题是“2025年年末值”
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
      className: 'bg-blue-50/30',
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
      className: 'bg-gray-50/50',
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
      title="2026年城市新店投资与现金流预算执行情况"
      renderFilters={renderFilters}
      maxHeight="none"
    >
      <DataTable
        columns={columns}
        data={data}
        rowClassName={(row) => row.isHighlight ? 'bg-[#a40035]/5 hover:bg-[#a40035]/10' : ''}
        pagination={false}
      />
    </DataContainer>
  );
};

export default CityBudgetExecutionContainer;
