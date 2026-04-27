import React, { useMemo } from 'react';
import BusinessTargets from '../../config/businessTargets';
import useFetchData from '../../hooks/useFetchData';
import DataContainer from '../../components/Common/DataContainer';

const CITY_NAME_MAP = {
  成都市: '四川省',
};

const normCity = (name) => CITY_NAME_MAP[name] || name;

const HEADER_CELL_CLASS = 'border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600';
const BODY_CELL_CLASS = 'border border-gray-200 px-3 py-2 text-gray-700';

const CapitalForecastTable = () => {
  const cityTargets2025 = BusinessTargets.capitalBalance?.target2025?.cityTargets || {};
  const cityList = ['总部', ...Object.keys(cityTargets2025)];

  const { data: cashFlowMonthlyData } = useFetchData('getCashFlowBudgetMonthly', [], [], { manual: false });
  const { data: safetyLineData } = useFetchData('getCashFlowCapitalSafetyLine', [], [], { manual: false });
  const { data: newStoreProcessData } = useFetchData('getCashFlowNewStoreProcess', [], [], { manual: false });

  const currentYear = String(new Date().getFullYear());

  const cashFlowByCity = useMemo(() => {
    const result = {};
    if (!Array.isArray(cashFlowMonthlyData)) return result;

    for (const row of cashFlowMonthlyData) {
      if (!row.month || !row.month.startsWith(currentYear)) continue;
      const city = normCity(row.city_name || '__unknown__');
      if (!result[city]) result[city] = { occurred: 0, pending: 0, rolling: 0, budget: 0 };
      result[city].occurred += Number(row.total_cash_flow_actual || 0);
      result[city].pending += Number(row.remaining_cash_flow_budget || 0);
      result[city].rolling += Number(row.total_cash_flow_rolling || 0);
      result[city].budget += Number(row.total_cash_flow_budget || 0);
    }

    return result;
  }, [cashFlowMonthlyData, currentYear]);

  const openSpendByCity = useMemo(() => {
    const result = {};
    if (!Array.isArray(newStoreProcessData)) return result;

    for (const row of newStoreProcessData) {
      if (row.city_name === '月度合计') continue;
      if (!row.month || !row.month.startsWith(currentYear)) continue;
      const city = normCity(row.city_name || '__unknown__');
      if (!result[city]) result[city] = { occurred: 0, pending: 0 };
      result[city].occurred += Number(row.sum_new_funds || 0);
      result[city].pending += Number(row.sum_expected_funds || 0);
    }

    return result;
  }, [newStoreProcessData, currentYear]);

  const safetyByCity = useMemo(() => {
    const result = {};
    if (!Array.isArray(safetyLineData)) return result;

    for (const row of safetyLineData) {
      result[normCity(row.city_name)] = Number(row.total_funds || 0);
    }

    return result;
  }, [safetyLineData]);

  const tableRows = useMemo(() => {
    return cityList.map((city) => {
      const isHQ = city === '总部';

      const balance2025 = isHQ
        ? Number(BusinessTargets.capitalBalance?.target2025?.totalBalance || 0)
        : Number(cityTargets2025[city] || 0);

      const hqProfitBudget = isHQ
        ? Number(BusinessTargets.headquartersCostAccounting?.summary?.headquartersProfit || 0)
        : 0;

      let operatingOccurred = 0;
      let operatingRolling = 0;
      if (isHQ) {
        for (const v of Object.values(cashFlowByCity)) {
          operatingOccurred += v.occurred;
          operatingRolling += v.rolling;
        }
        operatingRolling += hqProfitBudget;
      } else {
        const cf = cashFlowByCity[city] || {};
        operatingOccurred = cf.occurred || 0;
        operatingRolling = cf.rolling || 0;
      }

      const operatingPending = Math.max(operatingRolling - operatingOccurred, 0);

      const safetyLine = isHQ
        ? Object.values(safetyByCity).reduce((sum, value) => sum + value, 0)
        : safetyByCity[city] || 0;

      const availableFunds = balance2025 + operatingRolling - safetyLine;

      let openOccurred = 0;
      let openPending = 0;
      if (isHQ) {
        for (const v of Object.values(openSpendByCity)) {
          openOccurred += v.occurred;
          openPending += v.pending;
        }
      } else {
        const os = openSpendByCity[city] || {};
        openOccurred = os.occurred || 0;
        openPending = os.pending || 0;
      }

      const openTotal = openOccurred + openPending;
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
      if (a.isHQ) return 1;
      if (b.isHQ) return -1;
      return a.finalBalance - b.finalBalance;
    });
  }, [cityList, cashFlowByCity, safetyByCity, openSpendByCity, cityTargets2025]);

  const formatWan = (value) => {
    if (value === null || value === undefined) return '-';
    return (Number(value) / 10000).toFixed(2);
  };

  return (
    <DataContainer title="2026年公司总部及城市资金测算" maxHeight="none">
      <div className="text-xs text-gray-500 text-left pr-2 mb-1">单位：万元</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-center table-fixed border-collapse border border-gray-300">
          <colgroup>
            <col style={{ width: '7%' }} />
            {Array.from({ length: 10 }).map((_, i) => (
              <col key={i} style={{ width: '9.3%' }} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-gray-100">
              <th rowSpan={2} className={`${HEADER_CELL_CLASS} whitespace-nowrap`}>城市</th>
              <th rowSpan={2} className={HEADER_CELL_CLASS}>2025年末资金结余</th>
              <th colSpan={3} className={HEADER_CELL_CLASS}>预计2026年经营资金结余</th>
              <th rowSpan={2} className={HEADER_CELL_CLASS}>预计2026年资金安全线</th>
              <th rowSpan={2} className={HEADER_CELL_CLASS}>预计自有资金可用金额</th>
              <th colSpan={3} className={HEADER_CELL_CLASS}>预计2026年开店支出</th>
              <th rowSpan={2} className={HEADER_CELL_CLASS}>预计2026年实际结余资金</th>
            </tr>
            <tr className="bg-gray-100">
              <th className={HEADER_CELL_CLASS}>已发生值</th>
              <th className={HEADER_CELL_CLASS}>待发生值</th>
              <th className={HEADER_CELL_CLASS}>合计</th>
              <th className={HEADER_CELL_CLASS}>已发生值</th>
              <th className={HEADER_CELL_CLASS}>待发生值</th>
              <th className={HEADER_CELL_CLASS}>合计</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, idx) => (
              <tr
                key={row.city}
                className={`${row.isHQ ? 'bg-[#a40035]/5' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-gray-50`}
              >
                <td className={`${BODY_CELL_CLASS} font-medium whitespace-nowrap`}>{row.city}</td>
                <td className={BODY_CELL_CLASS}>{formatWan(row.balance2025)}</td>
                <td className={BODY_CELL_CLASS}>{formatWan(row.operatingOccurred)}</td>
                <td className={BODY_CELL_CLASS}>{formatWan(row.operatingPending)}</td>
                <td className={BODY_CELL_CLASS}>{formatWan(row.operatingTotal)}</td>
                <td className={BODY_CELL_CLASS}>{formatWan(row.safetyLine)}</td>
                <td className={BODY_CELL_CLASS}>{formatWan(row.availableFunds)}</td>
                <td className={BODY_CELL_CLASS}>{formatWan(row.openOccurred)}</td>
                <td className={BODY_CELL_CLASS}>{formatWan(row.openPending)}</td>
                <td className={BODY_CELL_CLASS}>{formatWan(row.openTotal)}</td>
                <td className={BODY_CELL_CLASS}>{formatWan(row.finalBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DataContainer>
  );
};

export default CapitalForecastTable;
