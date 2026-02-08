import React, { useMemo } from 'react';
import useFetchData from '../../hooks/useFetchData';

// Icons
const IconLoss = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const IconStore = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
    <path d="M2 7h20"/>
    <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>
  </svg>
);

const IconEmpty = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="m9 12 2 2 4-4"/>
  </svg>
);

const CashFlowContinuousLossContainer = () => {
  const { data: lossList, loading, error, fetchData } = useFetchData('getCashFlowContinuousLoss', [], [], { manual: false });

  // 格式化金额
  const fmtMoney = (val) => {
    if (val === null || val === undefined) return '-';
    return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // 按城市 -> 门店分组
  const groupedByCity = useMemo(() => {
    if (!lossList) return {};
    return lossList.reduce((acc, item) => {
      const city = item['城市名称'] || '其他';
      const storeCode = item['门店编码'];
      if (!acc[city]) acc[city] = {};
      if (!acc[city][storeCode]) {
        acc[city][storeCode] = { info: item, records: [] };
      }
      acc[city][storeCode].records.push(item);
      return acc;
    }, {});
  }, [lossList]);

  const totalStores = useMemo(() => {
    const cities = Object.keys(groupedByCity);
    return cities.reduce((sum, city) => sum + Object.keys(groupedByCity[city]).length, 0);
  }, [groupedByCity]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100 bg-[#a40035]/5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#a40035] flex items-center gap-2">
          <IconLoss />
          现金流持续亏损门店
          <span className="ml-2 text-sm font-normal bg-[#a40035]/10 text-[#a40035] px-2 py-0.5 rounded-full">
            {loading ? '...' : (error ? '-' : `${totalStores} 家`)}
          </span>
        </h2>
        {error && (
          <button 
            onClick={() => fetchData()} 
            className="text-xs text-[#a40035] hover:text-[#8a002d] underline"
          >
            重试
          </button>
        )}
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : totalStores === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
             <IconEmpty />
             <p className="mt-3 text-sm text-gray-400">暂无持续亏损门店</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.keys(groupedByCity).map((city) => {
              const storesMap = groupedByCity[city];
              const storeCodes = Object.keys(storesMap);

              return (
                <div key={city} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-700">{city}</h3>
                    <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {storeCodes.length} 家门店
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {storeCodes.map(code => {
                      const { info, records } = storesMap[code];
                      const sortedRecords = records.sort((a, b) => a['季度'].localeCompare(b['季度']));
                      const totalNetProfit = sortedRecords.reduce((sum, r) => sum + (Number(r['季度净利润']) || 0), 0);
                      const totalDep = sortedRecords.reduce((sum, r) => sum + (Number(r['季度折旧']) || 0), 0);
                      const totalCash = sortedRecords.reduce((sum, r) => sum + (Number(r['季度现金流']) || 0), 0);
                      const totalDeduction = sortedRecords.reduce((sum, r) => sum + (Number(r['季度现金流考核扣款']) || 0), 0);

                      return (
                        <div key={code} className="border border-gray-200 rounded-lg bg-gray-50/30 overflow-hidden">
                          <div className="p-4 bg-white border-b border-gray-100">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-[#a40035]/5 rounded-lg text-[#a40035]">
                                <IconStore />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-gray-800 truncate">{info['门店名称']}</h4>
                                  <span className="text-xs text-gray-400 font-mono px-1.5 py-0.5 bg-gray-100 rounded">{code}</span>
                                </div>
                                <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                  <span>城市总: {info['城市总'] || '-'}</span>
                                  <span>技术副总: {info['技术副总'] || '-'}</span>
                                </div>
                                <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                  <span>开业日期: {info['开业日期']?.split('T')[0] || '-'}</span>
                                  <span>新店爬坡期: {info['爬坡期']}</span>
                                  <span>爬坡期结束月份: {info['爬坡期结束月份']}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-4">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm text-left">
                                <thead>
                                  <tr className="text-xs text-gray-500 border-b border-gray-200">
                                    <th className="pb-2 font-medium pl-2">季度</th>
                                    <th className="pb-2 font-medium text-right">季度净利润</th>
                                    <th className="pb-2 font-medium text-right">季度折旧</th>
                                    <th className="pb-2 font-medium text-right">季度现金流</th>
                                    <th className="pb-2 font-medium text-right">扣款标准</th>
                                    <th className="pb-2 font-medium text-right pr-2">考核扣款</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {sortedRecords.map((r, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50">
                                      <td className="py-2.5 pl-2 font-medium text-gray-700">{r['季度']}</td>
                                      <td className="py-2.5 text-right text-gray-600">{fmtMoney(r['季度净利润'])}</td>
                                      <td className="py-2.5 text-right text-gray-600">{fmtMoney(r['季度折旧'])}</td>
                                      <td className={`py-2.5 text-right font-medium ${Number(r['季度现金流']) < 0 ? 'text-green-600' : 'text-[#a40035]'}`}>
                                        {fmtMoney(r['季度现金流'])}
                                      </td>
                                      <td className="py-2.5 text-right text-gray-600">{r['季度现金流考核扣款标准']}</td>
                                      <td className="py-2.5 text-right pr-2 text-[#a40035] font-medium">{fmtMoney(r['季度现金流考核扣款'])}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {sortedRecords.length > 1 && (
                              <div className="mt-3 border-t border-dashed border-gray-200 pt-3">
                                <div className="flex flex-wrap gap-4 text-xs">
                                  <span className="text-gray-600">合计净利润: <span className="font-semibold text-gray-800">{fmtMoney(totalNetProfit)}</span></span>
                                  <span className="text-gray-600">合计折旧: <span className="font-semibold text-gray-800">{fmtMoney(totalDep)}</span></span>
                                  <span className="text-gray-600">合计现金流: <span className={`font-semibold ${totalCash < 0 ? 'text-green-600' : 'text-[#a40035]'}`}>{fmtMoney(totalCash)}</span></span>
                                  <span className="text-gray-600">合计扣款: <span className="font-semibold text-[#a40035]">{fmtMoney(totalDeduction)}</span></span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CashFlowContinuousLossContainer;
