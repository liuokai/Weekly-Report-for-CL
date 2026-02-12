import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import DataContainer from '../../components/Common/DataContainer';
import DataTable from '../../components/Common/DataTable';
import FilterDropdown from '../../components/Common/FilterDropdown';
import useFetchData from '../../hooks/useFetchData';
import useTableSorting from '../../components/Common/useTableSorting';
import { BusinessTargets } from '../../config/businessTargets';

/**
 * 2026年城市新店投资与现金流预算执行情况
 * 
 * 数据源：server/sqls/cash_flow_new_store_and_cashflow_operation.sql
 */
const CityBudgetExecutionContainer = () => {
  const { data: rawData, loading } = useFetchData('getCashFlowNewStoreAndOperation');
  
  // 分析总结状态
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // 获取分析总结
  useEffect(() => {
    const fetchAnalysis = async () => {
      setAnalysisLoading(true);
      try {
        const response = await axios.post('/api/generate-city-budget-summary');
        if (response.data && response.data.status === 'success') {
          setAnalysisResult(response.data.analysis);
        }
      } catch (error) {
        console.error("Failed to fetch analysis:", error);
      } finally {
        setAnalysisLoading(false);
      }
    };
    
    fetchAnalysis();
  }, []);
  
  // 获取月份列表
  const monthList = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];
    const months = [...new Set(rawData.map(item => item['month']))];
    return months.sort().reverse(); // 降序排列，最新的月份在前
  }, [rawData]);
  
  // 默认筛选为最新的月份
  const [selectedMonth, setSelectedMonth] = useState('');

  // 当 monthList 更新且当前未选中月份时，默认选中最新的月份
  useEffect(() => {
    if (monthList.length > 0 && !selectedMonth) {
      setSelectedMonth(monthList[0]);
    }
  }, [monthList, selectedMonth]);

  // 获取各城市上年末资金结余配置
  const cityCapitalBalanceTargets = useMemo(() => {
    return BusinessTargets.capitalBalance.target2025.cityTargets || {};
  }, []);

  // 处理数据：根据选择的月份筛选，并注入“上年末资金结余”
  const { tableData, summaryRow } = useMemo(() => {
    if (!rawData || rawData.length === 0 || !selectedMonth) return { tableData: [], summaryRow: null };

    // 筛选出选中月份的数据
    const filteredData = rawData.filter(item => item['month'] === selectedMonth);

    // 注入上年末资金结余数据
    // 注意：如果是“合计”行，上年末资金结余也需要累加吗？
    // 根据 SQL 逻辑，后端已经返回了“合计”行。
    // 我们需要区分普通行和合计行。
    // 如果是普通行，从配置读取；如果是“合计”行，从配置汇总。
    
    // 计算所有城市的上年末资金结余总和（用于合计行）
    const totalLastYearBalance = Object.values(cityCapitalBalanceTargets).reduce((acc, curr) => acc + curr, 0);

    const processedData = filteredData.map(item => {
      let lastYearBalance = 0;
      if (item['city_name'] === '合计') {
        lastYearBalance = totalLastYearBalance;
      } else {
        lastYearBalance = cityCapitalBalanceTargets[item['city_name']] || 0;
      }
      
      return {
        ...item,
        'last_year_capital_balance': lastYearBalance
      };
    });

    // 分离合计行和普通数据行
    const dataRows = processedData.filter(item => item['city_name'] !== '合计');
    const summary = processedData.find(item => item['city_name'] === '合计');

    return { tableData: dataRows, summaryRow: summary };
  }, [rawData, selectedMonth, cityCapitalBalanceTargets]);

  // 格式化金额
  const formatMoney = (val) => {
    if (val === null || val === undefined) return '-';
    return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const columns = [
    {
      key: 'city',
      title: '城市',
      dataIndex: 'city_name',
      width: '120px',
      fixed: 'left',
      render: (text) => <span className="font-medium text-gray-900">{text}</span>
    },
    {
      key: 'lastYearBalance',
      title: '上年末资金结余',
      dataIndex: 'last_year_capital_balance',
      align: 'right',
      width: '180px',
      render: (val) => (
        <span className={`${val >= 0 ? 'text-gray-700' : 'text-red-600'}`}>
          {formatMoney(val)}
        </span>
      )
    },
    {
      key: 'investment',
      title: '截止当月累计新店投资',
      dataIndex: 'cumulative_new_store_investment',
      align: 'right',
      width: '180px',
      render: (val) => <span className="text-gray-700">{formatMoney(val)}</span>
    },
    {
      key: 'cashflow_budget',
      title: '截止当月累计现金流预算值',
      dataIndex: 'cumulative_cash_flow_budget',
      align: 'right',
      width: '180px',
      render: (val) => <span className="text-gray-700">{formatMoney(val)}</span>
    },
    {
      key: 'cashflow_actual',
      title: '截止当月累计经营现金流',
      dataIndex: 'cumulative_cash_flow_actual',
      align: 'right',
      width: '180px',
      render: (val) => (
        <span className={`${val >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatMoney(val)}
        </span>
      )
    },
    {
      key: 'achievement',
      title: '现金流达成率',
      dataIndex: 'cash_flow_achievement_ratio_display',
      align: 'right',
      width: '120px',
      render: (val) => <span className="font-medium text-gray-900">{val}</span>
    },
    {
      key: 'balance',
      title: '截止当月累计资金结余',
      dataIndex: 'cumulative_capital_balance',
      align: 'right',
      width: '180px',
      render: (val) => (
        <span className={`font-bold ${val >= 0 ? 'text-green-700' : 'text-red-700'}`}>
          {formatMoney(val)}
        </span>
      )
    }
  ];

  // 使用排序 Hook
  const { sortedData, sortConfig, handleSort } = useTableSorting(columns, tableData);

  const renderFilters = () => (
    <div className="flex flex-row relative z-40">
        <FilterDropdown 
            label="月份" 
            value={selectedMonth} 
            options={monthList} 
            onChange={setSelectedMonth} 
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
      {/* 智能分析总结模块 - 样式对齐新店总结 */}
      <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-lg shadow-sm">
         <div className="flex items-start gap-3">
            <div className="p-1.5 bg-[#a40035]/10 rounded mt-0.5 shrink-0">
               <svg className="w-4 h-4 text-[#a40035]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
            </div>
            <div className="flex-1">
               <h3 className="text-sm font-bold text-gray-800 mb-1">分析总结</h3>
               <div className="text-sm text-gray-600 leading-relaxed">
                  {analysisLoading ? (
                    <div className="flex items-center gap-2 py-1">
                       <div className="animate-spin h-4 w-4 border-2 border-[#a40035] border-t-transparent rounded-full"></div>
                       <span>正在生成智能分析...</span>
                    </div>
                  ) : analysisResult ? (
                     <div className="whitespace-pre-wrap text-gray-700">
                        {analysisResult}
                     </div>
                  ) : (
                     <div className="text-gray-400 italic">暂无分析数据</div>
                  )}
               </div>
            </div>
         </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : (
        <DataTable
          columns={columns}
          data={sortedData}
          getKey={(item) => item['city_name']}
          pagination={false}
          emptyText="暂无数据"
          onSort={handleSort}
          sortConfig={sortConfig}
          summaryRow={summaryRow}
          summaryPosition="bottom"
          summaryClassName="bg-gray-100 font-bold"
        />
      )}
    </DataContainer>
  );
};

export default CityBudgetExecutionContainer;
