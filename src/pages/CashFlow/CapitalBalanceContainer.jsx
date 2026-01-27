import React, { useMemo, useState } from 'react';
import BusinessTargets from '../../config/businessTargets';
import DataContainer from '../../components/Common/DataContainer';
/**
 * 资金结余数据容器（模拟数据版）
 * 展示总部与各城市的资金相关指标：
 * - 2025 年末资金结余
 * - 预计 2026 年经营资金结余【门店】
 * - 预计 2026 年经营资金结余【总部】
 * - 预计 2026 年资金安全线
 * - 预计 2026 年自有资金可用金额
 * - 预计 2026 年开店支出
 * - 预计 2026 年实际结余资金
 */
const CapitalBalanceContainer = () => {
  const cityTargets2025 = BusinessTargets.capitalBalance?.target2025?.cityTargets || {};
  const cityList = Object.keys(cityTargets2025);
  const [scope, setScope] = useState('总部'); // '总部' | '城市'
  const [selectedCity, setSelectedCity] = useState(cityList[0] || null);

  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '-';
    return `¥ ${Math.round(Number(val)).toLocaleString('zh-CN')}`;
  };

  const max2025CityBalance = useMemo(() => {
    return Math.max(0, ...Object.values(cityTargets2025).map(Number));
  }, [cityTargets2025]);

  // 生成模拟的 2026 相关指标（可随时替换为真实数据）
  const mockForecast = useMemo(() => {
    // 总部：按城市合计
    const hq2025Balance = Object.values(cityTargets2025).reduce((s, v) => s + Number(v || 0), 0);
    const hqStoreOperating2026 = hq2025Balance * 0.92; // 假设经营资金略低于 2025 结余
    const hqSafetyLine2026 = hq2025Balance * 0.60;     // 安全线设为 60% 的 2025 合计
    const hqOwnFunds2026 = hqSafetyLine2026 * 0.4;     // 自有可用资金设为安全线的 40%
    const openBudgetWan = Number(BusinessTargets.store?.newStore?.budget || 0); // 单位：万
    const hqOpenSpend2026 = openBudgetWan * 10000;     // 转为：元
    const hqActualRemaining2026 = hqStoreOperating2026 + hqOwnFunds2026 - hqOpenSpend2026;

    // 城市：基于各城市 2025 结余生成
    const cityForecastMap = {};
    cityList.forEach((city) => {
      const base = Number(cityTargets2025[city] || 0);
      const storeOperating = base * 0.90;
      const safetyLine = base * 0.55;
      const ownFunds = safetyLine * 0.35;
      const openSpend = (openBudgetWan * 10000) * 0.08; // 以总部开店支出按 8% 分摊作为示意
      const actualRemaining = storeOperating + ownFunds - openSpend;
      cityForecastMap[city] = {
        balance2025: base,
        storeOperating2026: storeOperating,
        safetyLine2026: safetyLine,
        ownFunds2026: ownFunds,
        openSpend2026: openSpend,
        actualRemaining2026: actualRemaining
      };
    });

    return {
      headquarters: {
        balance2025: hq2025Balance,
        storeOperating2026: hqStoreOperating2026,
        safetyLine2026: hqSafetyLine2026,
        ownFunds2026: hqOwnFunds2026,
        openSpend2026: hqOpenSpend2026,
        actualRemaining2026: hqActualRemaining2026
      },
      cities: cityForecastMap
    };
  }, [cityTargets2025, cityList]);

  const ScopeSwitch = () => (
    <div className="flex items-center gap-2">
      <button
        className={`px-3 py-1.5 rounded-md text-sm border ${scope === '总部' ? 'bg-[#a40035] text-white border-[#a40035]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
        onClick={() => setScope('总部')}
      >
        总部
      </button>
      <button
        className={`px-3 py-1.5 rounded-md text-sm border ${scope === '城市' ? 'bg-[#a40035] text-white border-[#a40035]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
        onClick={() => setScope('城市')}
      >
        城市
      </button>
    </div>
  );

  const CityDropdown = () => (
    <div className="relative inline-block ml-3">
      <select
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none"
        value={selectedCity || ''}
        onChange={(e) => setSelectedCity(e.target.value)}
      >
        {cityList.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  );

  const MetricCard = ({ title, value, highlight = false, sub }) => (
    <div className={`p-4 rounded-lg border ${highlight ? 'border-[#a40035] bg-[#a40035]/5' : 'border-gray-100 bg-gray-50/50'} flex flex-col gap-1`}>
      <span className="text-sm text-gray-600">{title}</span>
      <span className={`text-xl font-bold ${highlight ? 'text-[#a40035]' : 'text-gray-900'}`}>{formatCurrency(value)}</span>
      {sub ? <span className="text-xs text-gray-500">{sub}</span> : null}
    </div>
  );

  const ProgressBar = ({ label, value, base }) => {
    const pct = base > 0 ? Math.max(0, Math.min(100, Math.round((value / base) * 100))) : 0;
    const danger = value < base;
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">{label}</span>
          <span className={`font-medium ${danger ? 'text-[#a40035]' : 'text-green-600'}`}>{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full ${danger ? 'bg-[#a40035]' : 'bg-green-600'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  const renderHeadquartersView = () => {
    const m = mockForecast.headquarters;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard title="2025 年末资金结余" value={m.balance2025} highlight />
        <MetricCard title="预计 2026 年经营资金结余【门店】" value={m.storeOperating2026} />
        <MetricCard title="预计 2026 年资金安全线" value={m.safetyLine2026} sub="参考：60% × 2025 合计" />
        <MetricCard title="预计 2026 年自有资金可用金额" value={m.ownFunds2026} />
        <MetricCard title="预计 2026 年开店支出" value={m.openSpend2026} />
        <MetricCard title="预计 2026 年实际结余资金" value={m.actualRemaining2026} highlight />

        <div className="md:col-span-2 lg:col-span-3 p-4 rounded-lg border border-gray-100 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ProgressBar label="经营结余 / 安全线" value={m.storeOperating2026} base={m.safetyLine2026} />
            <ProgressBar label="实际结余 / 安全线" value={m.actualRemaining2026} base={m.safetyLine2026} />
            <ProgressBar label="开店支出 / 经营结余" value={m.openSpend2026} base={m.storeOperating2026} />
          </div>
        </div>
      </div>
    );
  };

  const renderCityView = () => {
    const m = mockForecast.cities[selectedCity] || {};
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard title="2025 年末资金结余" value={m.balance2025} highlight />
          <MetricCard title="预计 2026 年经营资金结余【门店】" value={m.storeOperating2026} />
          <MetricCard title="预计 2026 年资金安全线" value={m.safetyLine2026} />
          <MetricCard title="预计 2026 年自有资金可用金额" value={m.ownFunds2026} />
          <MetricCard title="预计 2026 年开店支出" value={m.openSpend2026} />
          <MetricCard title="预计 2026 年实际结余资金" value={m.actualRemaining2026} highlight />
        </div>

        <div className="p-4 rounded-lg border border-gray-100 bg-white">
          <h4 className="text-sm font-bold text-gray-700 mb-3">城市对比（2025 年末资金结余）</h4>
          <div className="space-y-2">
            {cityList.map((city) => {
              const val = Number(cityTargets2025[city] || 0);
              const widthPct = max2025CityBalance > 0 ? Math.round((val / max2025CityBalance) * 100) : 0;
              const active = city === selectedCity;
              return (
                <div key={city} className="flex items-center gap-3">
                  <div className="w-24 text-xs text-gray-600">{city}</div>
                  <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${active ? 'bg-[#a40035]' : 'bg-gray-400'}`} style={{ width: `${widthPct}%` }} />
                  </div>
                  <div className={`w-28 text-right text-xs ${active ? 'text-[#a40035] font-semibold' : 'text-gray-600'}`}>
                    {formatCurrency(val)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const Filters = () => (
    <div className="flex items-center">
      <ScopeSwitch />
      {scope === '城市' && <CityDropdown />}
    </div>
  );

  return (
    <DataContainer
      title="资金结余与安全线概览（模拟）"
      renderFilters={Filters}
      maxHeight="none"
    >
      <div className="space-y-6">
        {scope === '总部' ? renderHeadquartersView() : renderCityView()}
      </div>
    </DataContainer>
  );
};

export default CapitalBalanceContainer;
