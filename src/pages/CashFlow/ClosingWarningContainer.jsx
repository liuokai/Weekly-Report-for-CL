import React, { useMemo } from 'react';
import useFetchData from '../../hooks/useFetchData';

// Icons components
const IconAlert = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
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

const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
    <line x1="16" x2="16" y1="2" y2="6"/>
    <line x1="8" x2="8" y1="2" y2="6"/>
    <line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
);

const ClosingWarningContainer = () => {
  const { data: warningList, loading, error, fetchData } = useFetchData('getCashFlowClosingWarning', [], [], { manual: false });

  console.log('[ClosingWarningContainer] render:', { warningList, loading, error });

  // 始终渲染容器结构，避免错误状态下组件消失
  const isEmpty = !warningList || warningList.length === 0;
  const count = warningList ? warningList.length : 0;
  
  // 诉求2: 按城市分组
  const groupedStores = useMemo(() => {
    if (!warningList) return {};
    return warningList.reduce((acc, store) => {
      const city = store['城市名称'] || '其他';
      if (!acc[city]) acc[city] = [];
      acc[city].push(store);
      return acc;
    }, {});
  }, [warningList]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100 bg-[#a40035]/5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#a40035] flex items-center gap-2">
          <IconAlert />
          触发闭店预警门店
          <span className="ml-2 text-sm font-normal bg-[#a40035]/10 text-[#a40035] px-2 py-0.5 rounded-full">
            {loading ? '...' : (error ? '-' : `${count} 家`)}
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
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#a40035] mb-2"></div>
            <p>正在加载预警数据...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 bg-red-50 rounded border border-red-100">
            <div className="flex justify-center mb-2 text-red-400">
              <IconAlert />
            </div>
            <h3 className="text-red-800 font-medium mb-1">数据加载失败</h3>
            <p className="text-sm text-red-600 mb-3">{error.message || String(error)}</p>
            <div className="text-xs text-gray-500 max-w-md mx-auto space-y-1">
              <p>可能原因：</p>
              <ul className="list-disc list-inside text-left pl-4">
                <li>后端服务未启动或正在重启</li>
                <li>后端接口配置未生效（请尝试重启后端服务）</li>
                <li>数据库连接异常</li>
              </ul>
            </div>
            <button 
              onClick={() => fetchData()}
              className="mt-4 px-4 py-2 bg-white border border-red-200 text-red-600 rounded hover:bg-red-50 text-sm transition-colors"
            >
              重新加载
            </button>
          </div>
        ) : isEmpty ? (
          <div className="text-center text-gray-500 py-8 bg-gray-50 rounded border border-dashed border-gray-200">
            <div className="flex justify-center mb-2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <p>当前没有触发闭店预警的门店</p>
            <p className="text-xs text-gray-400 mt-1">（后端服务需重启以加载最新配置）</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedStores).map(([city, stores]) => (
              <div key={city}>
                <h3 className="text-sm font-bold text-gray-500 mb-3 pl-1 border-l-4 border-[#a40035] leading-tight">
                  {city} <span className="font-normal text-xs text-gray-400 ml-1">({stores.length}家)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {stores.map((store, index) => (
                    <WarningCard key={store['门店编码'] || index} store={store} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const WarningCard = ({ store }) => {
  const fmtMoney = (val) => val ? Number(val).toLocaleString('zh-CN', { maximumFractionDigits: 0 }) : '-';
  
  // 诉求6: 调整开业日期格式 (YYYY-MM-DD)
  const fmtDate = (dateStr) => {
    if (!dateStr) return '-';
    // 假设后端返回的是 YYYY-MM-DD HH:mm:ss 或类似格式，截取前10位
    return String(dateStr).substring(0, 10);
  };

  // 辅助函数：根据当前季度计算前几个季度的绝对名称
  // currentQuarter 格式为 "YYYY-QX"
  const getPrevQuarterLabel = (currentQuarter, offset) => {
    if (!currentQuarter || !currentQuarter.includes('-Q')) return '';
    
    try {
      const [yearStr, qStr] = currentQuarter.split('-Q');
      let year = parseInt(yearStr);
      let q = parseInt(qStr);
      
      // 计算偏移
      // 向前推 offset 个季度
      let totalQ = year * 4 + (q - 1) - offset;
      
      const newYear = Math.floor(totalQ / 4);
      const newQ = (totalQ % 4) + 1;
      
      return `${newYear}-Q${newQ}`;
    } catch (e) {
      console.error('Quarter parse error', e);
      return '';
    }
  };

  const currentQuarter = store['季度'];

  // 辅助组件：财务指标详情块
  const FinanceDetailBlock = ({ label, quarterLabel, ratio, revenue, labor, fixed, dataCutoffDate, isLast = false }) => (
    <div className={`py-2 ${!isLast ? 'border-b border-dashed border-gray-200' : ''}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-end gap-1">
          <span className="text-gray-800 font-medium text-xs">{label}</span>
          {quarterLabel && (
            <span className="text-[10px] text-gray-400 font-normal transform translate-y-px">{quarterLabel}</span>
          )}
        </div>
        <span className={`font-bold ${parseFloat(ratio) > 100 ? 'text-[#a40035]' : 'text-gray-900'}`}>
          {ratio}
        </span>
      </div>
      
      <div className="bg-white/60 rounded p-2 space-y-1.5 text-xs border border-gray-100/50">
         <div className="flex justify-between items-center">
            <span className="text-gray-500">主营收入</span>
            <span className="text-gray-700 font-medium">{fmtMoney(revenue)}</span>
         </div>
         <div className="flex justify-between items-center">
            <span className="text-gray-500">人工成本</span>
            <span className="text-gray-700">{fmtMoney(labor)}</span>
         </div>
         <div className="flex justify-between items-center">
            <span className="text-gray-500">固定成本</span>
            <span className="text-gray-700">{fmtMoney(fixed)}</span>
         </div>
      </div>
      {dataCutoffDate && (
        <div className="mt-1 text-right">
          <span className="text-[10px] text-gray-400">数据截止至 {dataCutoffDate}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="border border-[#a40035]/20 rounded-lg bg-white hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
      <div className="p-4 border-b border-[#a40035]/10 bg-[#a40035]/5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-end gap-2">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <span className="text-[#a40035]/70"><IconStore /></span>
                {store['门店名称']}
              </h3>
              {/* 诉求3: 门店编码标注 */}
              <span className="text-[10px] text-gray-400 font-mono mb-1">
                {store['门店编码']}
              </span>
            </div>

            {/* 诉求7: 城市总、技术副总与开业日期放置到一起 */}
            {/* 诉求2: 开业日期标注文本 */}
            <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
               <span className="flex items-center gap-1">
                 <IconCalendar className="w-3 h-3"/> 
                 <span>开业日期: {fmtDate(store['开业日期'])}</span>
               </span>
               <span className="w-px h-3 bg-gray-300"></span>
               <span>城市总: {store['城市总姓名'] || '-'}</span>
               <span className="w-px h-3 bg-gray-300"></span>
               <span>技术副总: {store['技术副总姓名'] || '-'}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-3 p-2 bg-white border border-[#a40035]/20 rounded text-sm text-[#a40035] font-medium flex gap-2 items-start">
           <span className="shrink-0 mt-0.5"><IconAlert /></span>
           {store['预警原因']}
        </div>
      </div>

      {/* 诉求4: 去掉折叠，直接展示详情 */}
      {/* 诉求5: 优化数据分组 */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm flex-1">
        
        {/* 分组1: 连续三个季度成本占比 */}
        <div className="space-y-1 bg-gray-50/50 p-3 rounded border border-gray-100">
           <h4 className="text-xs font-bold text-gray-500 border-b border-gray-200 pb-1 mb-2">成本占比趋势</h4>
           
           <FinanceDetailBlock 
             label="上上季度"
             quarterLabel={getPrevQuarterLabel(currentQuarter, 2)}
             ratio={store['上上季度成本占比']}
             revenue={store['上上季度主营业务收入']}
             labor={store['上上季度人工成本']}
             fixed={store['上上季度固定成本']}
             dataCutoffDate={store['上上季度季度末月份']}
           />

           <FinanceDetailBlock 
             label="上季度"
             quarterLabel={getPrevQuarterLabel(currentQuarter, 1)}
             ratio={store['上季度成本占比']}
             revenue={store['上季度主营业务收入']}
             labor={store['上季度人工成本']}
             fixed={store['上季度固定成本']}
             dataCutoffDate={store['上季度季度末月份']}
           />
           
           <FinanceDetailBlock 
             label="当期"
             quarterLabel={currentQuarter}
             ratio={store['当期成本占比（本季度完整月份）']}
             revenue={store['主营业务收入（本季度完整月份）']}
             labor={store['人工成本（本季度完整月份）']}
             fixed={store['固定成本（本季度完整月份）']}
             dataCutoffDate={store['季度末月份']}
             isLast={true}
           />
        </div>

        {/* 分组2: 累计经营现金流与折旧 */}
        <div className="space-y-3 bg-gray-50/50 p-3 rounded border border-gray-100 h-fit">
           <h4 className="text-xs font-bold text-gray-500 border-b border-gray-200 pb-1 mb-2">现金流与折旧</h4>
           
           {/* 诉求4: 调整顺序，先展示累计亏损占比 */}
           <div className="flex justify-between items-center pb-2 border-b border-dashed border-gray-200">
              <span className="text-gray-800 font-medium text-xs">累计亏损占比</span>
              <span className="font-bold text-[#a40035]">{store['累计现金流亏损占比']}</span>
           </div>

           <div className="bg-white/60 rounded p-2 space-y-1.5 text-xs border border-gray-100/50">
             <div className="flex justify-between items-center">
                <span className="text-gray-500">总折旧</span>
                <span className="font-medium text-gray-700">{fmtMoney(store['总折旧'])}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-gray-500">累计经营现金流</span>
                <span className={`font-medium ${store['累计经营现金流'] < 0 ? 'text-green-600' : 'text-[#a40035]'}`}>
                  {fmtMoney(store['累计经营现金流'])}
                </span>
             </div>
           </div>
           
           {store['季度末月份'] && (
             <div className="mt-1 text-right">
               <span className="text-[10px] text-gray-400">数据截止至 {store['季度末月份']}</span>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default ClosingWarningContainer;