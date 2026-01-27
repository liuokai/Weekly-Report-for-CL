import React, { useMemo, useState, useRef, useEffect } from 'react';
import BusinessTargets from '../../config/businessTargets';
import DataContainer from '../../components/Common/DataContainer';
import DataTable from '../../components/Common/DataTable';

// FilterDropdown 组件（样式与新店进度保持一致）
const FilterDropdown = ({ label, value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isSelected = value !== null && value !== undefined && value !== '全部';

  return (
    <div className={`relative inline-block text-left mr-4 ${isOpen ? 'z-50' : 'z-10'}`} ref={dropdownRef}>
      <button
        type="button"
        className={`inline-flex justify-between w-40 rounded-md border shadow-sm px-4 py-2 bg-white text-sm font-medium focus:outline-none ${
          isSelected 
            ? 'border-[#a40035] text-[#a40035]' 
            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {value || `全部${label}`}
        <svg 
          className={`-mr-1 ml-2 h-5 w-5 ${isSelected ? 'text-[#a40035]' : 'text-gray-500'}`} 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="origin-top-left absolute left-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 max-h-60 overflow-y-auto z-50">
          <div className="py-1">
            {options.map((opt) => (
              <button
                key={opt}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  value === opt 
                    ? 'bg-[#a40035] text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => { onChange(opt); setIsOpen(false); }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

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

  // 模拟数据生成器 (后续替换为 SQL 聚合数据)
  const getMockData = (city) => {
    // 基础数值 (根据城市名哈希生成一些差异化数据，仅用于演示)
    const baseFactor = city === '总部' ? 10 : (city.length + 1); 
    const isHQ = city === '总部';

    // 2025 年末资金结余
    // 总部取所有城市之和 (模拟), 城市取配置值
    const balance2025 = isHQ 
      ? Object.values(cityTargets2025).reduce((acc, val) => acc + Number(val), 0)
      : Number(cityTargets2025[city] || 0);

    // 辅助函数：生成某行的完整数据
    const createRowData = (yearBudget) => {
      const occurred = yearBudget * 0.35; // 假设已发生 35%
      const pending = yearBudget * 0.65;  // 假设待发生 65%
      const rolling = occurred + pending; // 滚动全年值
      return { occurred, pending, rolling, budget: yearBudget };
    };

    // 各项指标预算基数 (模拟)
    const storeOperatingBudget = balance2025 * 0.8;
    const hqOperatingBudget = isHQ ? balance2025 * 0.2 : 0; // 城市没有总部经营结余
    // 资金安全线逻辑调整：全部门店的一个月工资 + 全部员工的半个月工资
    // 这是一个相对固定的存量概念，不适用“已发生+待发生”
    // 模拟值：假设为 balance2025 的 40%
    const safetyLineValue = balance2025 * 0.4;
    
    const openStoreBudget = isHQ ? 30000000 : 3000000; // 总部3000万，城市300万

    // 生成各行数据
    const storeOp = createRowData(storeOperatingBudget);
    const hqOp = createRowData(hqOperatingBudget);
    const openStore = createRowData(openStoreBudget);

    // 计算核心汇总行逻辑
    // 自有资金可用金额 = 2025年末资金结余 + 门店经营 + 总部经营 - 安全线
    const ownFunds = {
      occurred: 0, // 2025年末值不参与已发生/待发生计算，只在滚动值体现? 
                   // 需求定义：2026年滚动全年值 = [已发生值] + [待发生值]
                   // 但公式包含 2025年末余额（这是存量）。
                   // 这里假设：自有资金可用金额的“滚动全年值” = 2025存量 + 2026滚动增量
                   // 为了表格展示一致性，我们把 2025年末值单独列展示，
                   // 这里的 occurred/pending/rolling 指的是 2026 年度的变动部分 + 2025 基数?
                   // 根据需求表格结构：
                   // "2025年末值" 仅第一行有值。
                   // "2026年滚动全年值" = 已发生 + 待发生 (对于流量科目)
                   // 对于存量科目(自有资金、实际结余)，滚动值应包含 2025 年末值。
    };

    return {
      balance2025,
      storeOp,
      hqOp,
      safetyLineValue,
      openStore
    };
  };

  const data = useMemo(() => {
    const mock = getMockData(selectedCity);
    
    // 构建 7 行数据
    // 1. 2025年末资金结余
    const row1 = {
      id: '1',
      subject: '2025年末资金结余',
      col_2025_end: mock.balance2025,
      col_2026_occurred: null,
      col_2026_pending: null,
      col_2026_rolling: mock.balance2025, 
      col_2026_budget: mock.balance2025,  
      isBold: false
    };

    // 2. 预计2026年经营资金结余【门店】
    const row2 = {
      id: '2',
      subject: '预计2026年经营资金结余【门店】',
      col_2025_end: null,
      col_2026_occurred: mock.storeOp.occurred,
      col_2026_pending: mock.storeOp.pending,
      col_2026_rolling: mock.storeOp.occurred + mock.storeOp.pending,
      col_2026_budget: mock.storeOp.budget,
      isBold: false
    };

    // 3. 预计2026年经营资金结余【总部】
    const row3 = {
      id: '3',
      subject: '预计2026年经营资金结余【总部】',
      col_2025_end: null,
      col_2026_occurred: mock.hqOp.occurred,
      col_2026_pending: mock.hqOp.pending,
      col_2026_rolling: mock.hqOp.occurred + mock.hqOp.pending,
      col_2026_budget: mock.hqOp.budget,
      isBold: false
    };

    // 4. 预计2026年资金安全线
    // 特殊逻辑：待发生值为空，滚动值 = 固定计算逻辑（模拟值）
    const row4 = {
      id: '4',
      subject: '预计2026年资金安全线',
      col_2025_end: null,
      col_2026_occurred: null, 
      col_2026_pending: null,
      col_2026_rolling: mock.safetyLineValue,
      col_2026_budget: mock.safetyLineValue, // 预算通常等于这个固定计算值
      isBold: false
    };

    // 5. 预计2026年自有资金可用金额 (计算行)
    // 公式: 2025年末资金结余 + 门店经营 + 总部经营 - 安全线
    // 滚动全年值 = Row1(滚动) + Row2(滚动) + Row3(滚动) - Row4(滚动)
    // 已发生值 = Row2(已发生) + Row3(已发生) (注意：安全线和期初不参与流转)
    // 待发生值 = Row2(待发生) + Row3(待发生)
    const row5 = {
      id: '5',
      subject: '预计2026年自有资金可用金额',
      col_2025_end: null,
      col_2026_occurred: row2.col_2026_occurred + row3.col_2026_occurred, 
      col_2026_pending: row2.col_2026_pending + row3.col_2026_pending,
      col_2026_rolling: row1.col_2026_rolling + row2.col_2026_rolling + row3.col_2026_rolling - row4.col_2026_rolling,
      col_2026_budget: row1.col_2026_budget + row2.col_2026_budget + row3.col_2026_budget - row4.col_2026_budget,
      isHighlight: true 
    };

    // 6. 预计2026年开店支出
    const row6 = {
      id: '6',
      subject: '预计2026年开店支出',
      col_2025_end: null,
      col_2026_occurred: mock.openStore.occurred,
      col_2026_pending: mock.openStore.pending,
      col_2026_rolling: mock.openStore.occurred + mock.openStore.pending,
      col_2026_budget: mock.openStore.budget,
      isBold: false
    };

    // 7. 预计2026年实际结余资金 (计算行)
    // 公式: Row5 - Row6
    // 滚动值 = Row5(滚动) - Row6(滚动)
    // 已发生 = Row5(已发生) - Row6(已发生)
    // 待发生 = Row5(待发生) - Row6(待发生)
    // 确保数值为正值（模拟逻辑：如果是负数，可能是预算超支，这里暂不强制转正，仅做绝对值或保持原值，通常是正值）
    const row7Rolling = row5.col_2026_rolling - row6.col_2026_rolling;
    
    const row7 = {
      id: '7',
      subject: '预计2026年实际结余资金',
      col_2025_end: null,
      col_2026_occurred: row5.col_2026_occurred - row6.col_2026_occurred,
      col_2026_pending: row5.col_2026_pending - row6.col_2026_pending,
      col_2026_rolling: row7Rolling,
      col_2026_budget: row5.col_2026_budget - row6.col_2026_budget,
      isHighlight: true 
    };

    return [row1, row2, row3, row4, row5, row6, row7];
  }, [selectedCity]);

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
