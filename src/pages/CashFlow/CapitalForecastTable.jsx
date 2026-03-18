import React, { useMemo } from 'react';
import BusinessTargets from '../../config/businessTargets';
import useFetchData from '../../hooks/useFetchData';
import DataContainer from '../../components/Common/DataContainer';

/**
 * 2026年资金测算汇总表
 * 行维度：总部 + 各城市
 * 列维度：2025年末资金结余、预计2026年经营资金结余（已发生/待发生/合计）、
 *         预计2026年资金安全线、预计自有资金可用金额、
 *         预计2026年开店支出（已发生/待发生/合计）、预计2026年实际结余资金
 */
const CapitalForecastTable = () => {
  const cityTargets2025 = BusinessTargets.capitalBalance?.target2025?.cityTargets || {};
  const cityList = ['总部', ...Object.keys(cityTargets2025)];

  const { data: cashFlowMonthlyData } = useFetchData('getCashFlowBudgetMonthly', [], [], { manual: false });
  const { data: safetyLineData } = useFetchData('getCashFlowCapitalSafetyLine', [], [], { manual: false });
  const { data: newStoreProcessData } = useFetchData('getCashFlowNewStoreProcess', [], [], { manual: false });

  const currentYear = String(new Date().getFullYear());

  // 按城市汇总经营现金流数据
  const cashFlowByCity = useMemo(() => {
    const result = {};
    if (!Array.isArray(cashFlowMonthlyData)) return result;
    for (const row of cashFlowMonthlyData) {
      if (!row.month || !row.month.startsWith(currentYear)) continue;
      const city = row.city_name || '__unknown__';
      if (!result[city]) result[city] = { occurred: 0, pending: 0, rolling: 0, budget: 0 };
      result[city].occurred += Number(row.total_cash_flow_actual || 0);
      result[city].pending  += Number(row.remaining_cash_flow_budget || 0);
      result[city].rolling  += Number(row.total_cash_flow_rolling || 0);
      result[city].budget   += Number(row.total_cash_flow_budget || 0);
    }
    return result;
  }, [cashFlowMonthlyData, currentYear]);

  // 按城市汇总开店支出数据
  const openSpendByCity = useMemo(() => {
    const result = {};
    if (!Array.isArray(newStoreProcessData)) return result;
    for (const row of newStoreProcessData) {
      if (row.city_name === '月度合计') continue;
      if (!row.month || !row.month.startsWith(currentYear)) continue;
      const city = row.city_name || '__unknown__';
      if (!result[city]) result[city] = { occurred: 0, pending: 0 };
      result[city].occurred += Number(row.sum_new_funds || 0);
      result[city].pending  += Number(row.sum_expected_funds || 0);
    }
    return result;
  }, [newStoreProcessData, currentYear]);

  // 按城市获取资金安全线
  const safetyByCity = useMemo(() => {
    const result = {};
    if (!Array.isArray(safetyLineData)) return result;
    for (const row of safetyLineData) {
      result[row.city_name] = Number(row.total_funds || 0);
    }
    return result;
  }, [safetyLineData]);

  // 计算每行数据
  const tableRows = useMemo(() => {
    return cityList.map((city) => {
      const isHQ = city === '总部';

      // 2025年末资金结余
      const balance2025 = isHQ
        ? Number(BusinessTargets.capitalBalance?.target2025?.totalBalance || 0)
        : Number(cityTargets2025[city] || 0);

      // 总部利润预算（仅总部视角）
      const hqProfitBudget = isHQ
        ? Number(BusinessTargets.headquartersCostAccounting?.summary?.headquartersProfit || 0)
        : 0;

      // 经营资金结余
      let operatingOccurred = 0;
      let operatingRolling = 0;
      if (isHQ) {
        // 总部：汇总所有城市
        for (const v of Object.values(cashFlowByCity)) {
          operatingOccurred += v.occurred;
          operatingRolling  += v.rolling;
        }
        operatingRolling += hqProfitBudget;
      } else {
        const cf = cashFlowByCity[city] || {};
        operatingOccurred = cf.occurred || 0;
        operatingRolling  = cf.rolling  || 0;
      }
      const operatingPending = Math.max(operatingRolling - operatingOccurred, 0);

      // 资金安全线
      let safetyLine = 0;
      if (isHQ) {
        safetyLine = Object.values(safetyByCity).reduce((s, v) => s + v, 0);
      } else {
        safetyLine = safetyByCity[city] || 0;
      }

      // 自有资金可用金额
      const availableFunds = balance2025 + operatingRolling - safetyLine;

      // 开店支出
      let openOccurred = 0;
      let openPending = 0;
      if (isHQ) {
        for (const v of Object.values(openSpendByCity)) {
          openOccurred += v.occurred;
          openPending  += v.pending;
        }
      } else {
        const os = openSpendByCity[city] || {};
        openOccurred = os.occurred || 0;
        openPending  = os.pending  || 0;
      }
      const openTotal = openOccurred + openPending;

      // 实际结余资金
      const finalBalance = availableFunds - openTotal;

      return {
        city,
        isHQ,
        balance2025,
        operatingOccurred,
        operatingPending,
        operatingTotal: operatingRolling,
        safetyLine,
        availableFunds,
        openOccurred,
        openPending,
        openTotal,
        finalBalance,
      };
    }).sort((a, b) => {
      // 总部行始终置顶，其余按实际结余资金升序
      if (a.isHQ) return -1;
      if (b.isHQ) return 1;
      return a.finalBalance - b.finalBalance;
    });
  }, [cityList, cashFlowByCity, safetyByCity, openSpendByCity, cityTargets2025]);

  const formatWan = (val) => {
    if (val === null || val === undefined) return '-';
    const wan = Number(val) / 10000;
    return wan.toFixed(2);
  };

  const finalBalanceColor = (val) =>
    val >= 0 ? 'text-[#a40035]' : 'text-green-600';

  return (
    <DataContainer title="2026年公司总部及城市资金测算" maxHeight="none">
      <div className="text-xs text-gray-500 text-left pr-2 mb-1">单位：万元</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-center table-fixed">
          <colgroup>
            {/* 城市列略窄，其余 10 列等宽 */}
            <col style={{ width: '7%' }} />
            {Array.from({ length: 10 }).map((_, i) => (
              <col key={i} style={{ width: '9.3%' }} />
            ))}
          </colgroup>
          <thead>
            {/* 第一行：合并表头 */}
            <tr className="bg-gray-100 border-b border-gray-300">
              <th rowSpan={2} className="px-2 py-3 font-bold text-gray-800 border-r border-gray-300 whitespace-nowrap">城市</th>
              <th rowSpan={2} className="px-2 py-3 font-bold text-gray-800 border-r border-gray-300">2025年末资金结余</th>
              <th colSpan={3} className="px-2 py-3 font-bold text-gray-800 border-r border-gray-300">预计2026年经营资金结余</th>
              <th rowSpan={2} className="px-2 py-3 font-bold text-gray-800 border-r border-gray-300">预计2026年资金安全线</th>
              <th rowSpan={2} className="px-2 py-3 font-bold text-gray-800 border-r border-gray-300">预计自有资金可用金额</th>
              <th colSpan={3} className="px-2 py-3 font-bold text-gray-800 border-r border-gray-300">预计2026年开店支出</th>
              <th rowSpan={2} className="px-2 py-3 font-bold text-gray-800">预计2026年实际结余资金</th>
            </tr>
            {/* 第二行：子表头 */}
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="px-2 py-2 font-semibold text-gray-600 border-r border-gray-200">已发生值</th>
              <th className="px-2 py-2 font-semibold text-gray-600 border-r border-gray-200">待发生值</th>
              <th className="px-2 py-2 font-semibold text-gray-600 border-r border-gray-300">合计</th>
              <th className="px-2 py-2 font-semibold text-gray-600 border-r border-gray-200">已发生值</th>
              <th className="px-2 py-2 font-semibold text-gray-600 border-r border-gray-200">待发生值</th>
              <th className="px-2 py-2 font-semibold text-gray-600 border-r border-gray-300">合计</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, idx) => (
              <tr
                key={row.city}
                className={`border-b border-gray-200 ${row.isHQ ? 'bg-[#a40035]/5 font-bold' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-gray-50`}
              >
                <td className="px-2 py-3 font-medium text-gray-900 border-r border-gray-200 whitespace-nowrap">{row.city}</td>
                <td className="px-2 py-3 text-gray-900 border-r border-gray-200">{formatWan(row.balance2025)}</td>
                <td className="px-2 py-3 text-gray-900 border-r border-gray-200">{formatWan(row.operatingOccurred)}</td>
                <td className="px-2 py-3 text-gray-900 border-r border-gray-200">{formatWan(row.operatingPending)}</td>
                <td className="px-2 py-3 text-gray-900 border-r border-gray-300">{formatWan(row.operatingTotal)}</td>
                <td className="px-2 py-3 text-gray-900 border-r border-gray-200">{formatWan(row.safetyLine)}</td>
                <td className="px-2 py-3 text-gray-900 border-r border-gray-200">{formatWan(row.availableFunds)}</td>
                <td className="px-2 py-3 text-gray-900 border-r border-gray-200">{formatWan(row.openOccurred)}</td>
                <td className="px-2 py-3 text-gray-900 border-r border-gray-200">{formatWan(row.openPending)}</td>
                <td className="px-2 py-3 text-gray-900 border-r border-gray-300">{formatWan(row.openTotal)}</td>
                <td className="px-2 py-3 text-gray-900">{formatWan(row.finalBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DataContainer>
  );
};

export default CapitalForecastTable;
