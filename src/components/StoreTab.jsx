import React, { useMemo, useState, useEffect } from 'react';
import DataTable from './Common/DataTable';
import LineTrendChart from './Common/LineTrendChart';

const StoreTab = () => {
  // 模拟数据 - 门店指标
  const storeMetrics = {
    total: 198,       // 门店数量
    newOpened: 36,    // 新开门店数量
    closed: 14,       // 闭店门店数量
    netIncrease: 22,  // 净增门店数量
    target: 20,       // 新店目标
  };

  // 计算完成率
  const completionRate = Math.round((storeMetrics.netIncrease / storeMetrics.target) * 100);

  // 模拟数据 - 预算指标
  const budgetMetrics = {
    budgetTotal: 298, // 新增预算总值
    cumulativeInvestment: 240, // 累计投资金额 (模拟值)
    newStoreInvestment: 185,
    renovationInvestment: 55
  };

  // 计算时间进度
  const today = new Date(); // 使用当前环境时间
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const endOfYear = new Date(today.getFullYear(), 11, 31);
  const timeProgress = Math.min(100, Math.max(0, ((today - startOfYear) / (endOfYear - startOfYear)) * 100));

  // 预算使用进度
  const budgetProgress = Math.round((budgetMetrics.cumulativeInvestment / budgetMetrics.budgetTotal) * 100);

  return (
    <div className="space-y-6">
       {/* 概览容器 */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="w-1 h-5 bg-[#a40035] rounded-full mr-3"></span>
            门店数量与预算执行情况概览
          </h2>

          <div className="flex flex-col">
            {/* 上部：门店指标 */}
            <div className="pb-4">
              <div className="relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                   {/* 左侧：超大字号门店总数 */}
                   <div className="flex-1 text-center md:text-left md:pl-4">
                      <p className="text-sm text-gray-600 mb-2">当前门店总数</p>
                      <div className="flex items-baseline justify-center md:justify-start gap-2 mb-4">
                        <p className="text-7xl font-extrabold text-[#a40035] tracking-tight">{storeMetrics.total}</p>
                        <span className="text-xl font-medium text-gray-500">家</span>
                      </div>
                      
                      {/* 进度条：净增目标完成率 vs 时间进度 */}
                      <div className="w-full max-w-[360px] mx-auto md:mx-0">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>净增目标完成率 {completionRate}%</span>
                          <span>时间进度 {Math.round(timeProgress)}%</span>
                        </div>
                        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                          {/* 实际完成进度 */}
                          <div 
                            className={`absolute left-0 top-0 bottom-0 rounded-full transition-all duration-500 ${completionRate >= timeProgress ? 'bg-[#a40035]' : 'bg-orange-400'}`}
                            style={{ width: `${Math.min(100, completionRate)}%` }}
                          />
                          {/* 时间进度标记线 */}
                          <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-black/30 z-10"
                            style={{ left: `${timeProgress}%` }}
                          />
                        </div>
                      </div>
                   </div>

                   {/* 右侧：其他指标上下排布 (2x2 Grid) */}
                   <div className="flex-1 w-full">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">今年新开</p>
                            <p className="text-xl font-bold text-gray-800">{storeMetrics.newOpened}</p>
                         </div>
                         <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">今年闭店</p>
                            <p className="text-xl font-bold text-gray-800">{storeMetrics.closed}</p>
                         </div>
                         <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">净增门店</p>
                            <p className={`text-xl font-bold ${storeMetrics.netIncrease >= storeMetrics.target ? 'text-[#a40035]' : 'text-green-600'}`}>{storeMetrics.netIncrease}</p>
                         </div>
                         <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">年度新店目标</p>
                            <p className="text-xl font-bold text-gray-800">{storeMetrics.target}</p>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            {/* 分割线 */}
            <div className="h-px bg-gray-100 my-2" />

            {/* 下部：预算指标 */}
             <div className="pt-4">
               <div className="p-0">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                     {/* 左侧：预算值与累计投资金额 */}
                     <div className="flex-1 md:pl-4">
                         <div className="flex items-center justify-center md:justify-start gap-8 mb-4">
                             {/* 预算值 */}
                             <div className="text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                  <p className="text-sm text-gray-600">预算金额</p>
                                </div>
                                <div className="flex items-baseline justify-center md:justify-start gap-2">
                                   <p className="text-6xl font-extrabold text-gray-400 tracking-tight">{budgetMetrics.budgetTotal}</p>
                                   <span className="text-lg font-medium text-gray-400">万元</span>
                                </div>
                             </div>

                             {/* 分隔竖线 */}
                             <div className="w-px h-16 bg-gray-200 hidden md:block"></div>

                             {/* 累计投资金额 */}
                             <div className="text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                  <p className="text-sm text-gray-600">累计投资金额</p>
                                </div>
                                <div className="flex items-baseline justify-center md:justify-start gap-2">
                                   <p className="text-6xl font-extrabold text-gray-800 tracking-tight">{budgetMetrics.cumulativeInvestment}</p>
                                   <span className="text-lg font-medium text-gray-400">万元</span>
                                </div>
                             </div>
                         </div>

                         {/* 进度条：预算使用进度 (位于下方) */}
                         <div className="w-full max-w-[360px] mx-auto md:mx-0">
                           <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                             <span>预算使用率 {budgetProgress}%</span>
                             <span>时间进度 {Math.round(timeProgress)}%</span>
                           </div>
                           <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                             {/* 实际完成进度 */}
                             <div 
                               className={`absolute left-0 top-0 bottom-0 rounded-full transition-all duration-500 ${budgetProgress > 100 ? 'bg-[#a40035]' : 'bg-green-600'}`}
                               style={{ width: `${Math.min(100, budgetProgress)}%` }}
                             />
                             {/* 时间进度标记线 */}
                             <div 
                               className="absolute top-0 bottom-0 w-0.5 bg-black/30 z-10"
                               style={{ left: `${timeProgress}%` }}
                             />
                           </div>
                         </div>
                     </div>

                    {/* 右侧：其他预算指标上下排布 */}
                    <div className="flex-1 w-full space-y-4">
                       <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-700">新店投资金额</span>
                          </div>
                          <span className="text-xl font-bold text-gray-600">{budgetMetrics.newStoreInvestment}</span>
                       </div>

                       <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-700">重装投资金额</span>
                          </div>
                          <span className="text-xl font-bold text-gray-600">{budgetMetrics.renovationInvestment}</span>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
       </div>

       {/* 城市维度数据容器：门店数量与预算执行情况表格 */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
         <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
           <span className="w-1 h-5 bg-[#a40035] rounded-full mr-3"></span>
           城市维度门店数量与预算执行情况
         </h2>
         <CityStoresSection />
       </div>
    </div>
  );
};

export default StoreTab;

const CityStoresSection = () => {
  const [selectedCity, setSelectedCity] = useState(null);
  const [activeMetric, setActiveMetric] = useState('门店数量');
  const [showYoY, setShowYoY] = useState(false);
  const [showAverage, setShowAverage] = useState(false);
  const [showExtremes, setShowExtremes] = useState(true);

  const baseRows = useMemo(() => ([
    { 城市: '成都市', 门店数量: 91, 新开门店数量: 10, 闭店门店数量: 9, 净增门店数量: 1, 新开门店目标: 6, 目标对照: -5 },
    { 城市: '重庆市', 门店数量: 30, 新开门店数量: 2, 闭店门店数量: 2, 净增门店数量: 0, 新开门店目标: 2, 目标对照: -2 },
    { 城市: '深圳市', 门店数量: 27, 新开门店数量: 7, 闭店门店数量: 2, 净增门店数量: 5, 新开门店目标: 6, 目标对照: -1 },
    { 城市: '杭州市', 门店数量: 11, 新开门店数量: 3, 闭店门店数量: 1, 净增门店数量: 2, 新开门店目标: 0, 目标对照: 2 },
    { 城市: '南京市', 门店数量: 5, 新开门店数量: 1, 闭店门店数量: 0, 净增门店数量: 1, 新开门店目标: 0, 目标对照: 1 },
    { 城市: '宁波市', 门店数量: 3, 新开门店数量: 0, 闭店门店数量: 0, 净增门店数量: 0, 新开门店目标: 0, 目标对照: 0 },
    { 城市: '广州市', 门店数量: 9, 新开门店数量: 2, 闭店门店数量: 0, 净增门店数量: 2, 新开门店目标: 0, 目标对照: 2 },
    { 城市: '上海市', 门店数量: 9, 新开门店数量: 2, 闭店门店数量: 0, 净增门店数量: 2, 新开门店目标: 0, 目标对照: 2 },
    { 城市: '北京市', 门店数量: 13, 新开门店数量: 9, 闭店门店数量: 0, 净增门店数量: 9, 新开门店目标: 6, 目标对照: 3 },
  ]), []);

  const rowsWithBudget = useMemo(() => {
    return baseRows.map(r => {
      // 预算逻辑调整：
      // 1. 仅当新开门店目标 > 0 时才有预算
      // 2. 预算 = 新开门店目标 * 70 (万)
      // 3. 模拟新店投资金额与使用率
      let budget = 0;
      let used = 0;
      let usage = 0;

      if (r.新开门店目标 > 0) {
        budget = r.新开门店目标 * 70;
        // 模拟已用金额：预算的 40% ~ 110% 之间波动，体现真实执行情况
        used = Math.round(budget * (0.4 + Math.random() * 0.7));
        usage = Math.round((used / budget) * 100);
      }

      return {
        ...r,
        新店投资预算金额: budget > 0 ? budget : '-',
        新店投资金额: budget > 0 ? used : '-',
        预算使用率: budget > 0 ? `${usage}%` : '-'
      };
    });
  }, [baseRows]);

  const columns = useMemo(() => ([
    { 
      key: 'city', 
      title: '城市', 
      dataIndex: '城市',
      render: (value, row) => (
        <button 
          className="text-[#a40035] hover:underline font-medium"
          onClick={() => setSelectedCity(row.城市)}
        >
          {value}
        </button>
      )
    },
    { key: 'storeCount', title: '门店数量', dataIndex: '门店数量' },
    { key: 'newOpened', title: '新开门店数量', dataIndex: '新开门店数量' },
    { key: 'closed', title: '闭店门店数量', dataIndex: '闭店门店数量' },
    { key: 'netIncrease', title: '净增门店数量', dataIndex: '净增门店数量' },
    { key: 'targetNew', title: '新开门店目标', dataIndex: '新开门店目标' },
    { 
      key: 'targetCompare', 
      title: '目标对照', 
      dataIndex: '目标对照',
      render: (value) => (
        <span className={`${value > 0 ? 'text-[#a40035]' : value < 0 ? 'text-green-600' : 'text-gray-600'} font-medium`}>
          {value}
        </span>
      )
    },
    { key: 'budgetPlan', title: '新店投资预算金额', dataIndex: '新店投资预算金额' },
    { key: 'budgetUsed', title: '新店投资金额', dataIndex: '新店投资金额' },
    { key: 'budgetUsage', title: '预算使用率', dataIndex: '预算使用率' },
  ]), []);

  useEffect(() => {
    if (selectedCity) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedCity]);

  const monthLabels = useMemo(() => Array.from({ length: 12 }, (_, i) => `${i + 1}月`), []);
  const metricSeries = useMemo(() => {
    const makeSeries = (base) => monthLabels.map((_, i) => Math.max(0, Math.round(base + (Math.sin(i / 1.8) * base * 0.15) + (Math.random() * base * 0.12))));
    return {
      门店数量: makeSeries(50),
      新开门店数量: makeSeries(4),
      闭店门店数量: makeSeries(2),
      净增门店数量: makeSeries(2)
    };
  }, [monthLabels]);
  const seriesYoy = useMemo(() => {
    const curr = metricSeries[activeMetric] || [];
    return curr.map(v => Math.round(v * (0.9 + Math.random() * 0.1)));
  }, [metricSeries, activeMetric]);

  const cityStoreMap = useMemo(() => ({
    成都市: [
      { 门店名称: '财富又一城', 开业时间: '4月25日' },
      { 门店名称: '中粮香颂丽都悦街店', 开业时间: '4月29日' },
      { 门店名称: 'in99', 开业时间: '5月7日' },
      { 门店名称: '金楠天街', 开业时间: '6月17日' },
      { 门店名称: '双流万达', 开业时间: '7月31日' },
      { 门店名称: '蔚蓝卡地亚', 开业时间: '9月9日' },
      { 门店名称: '城南优品道', 开业时间: '9月18日' },
      { 门店名称: '悠方', 开业时间: '11月26日' },
      { 门店名称: 'IFS', 开业时间: '12月10日' },
      { 门店名称: '美学中心', 开业时间: '12月25日' },
      { 门店名称: '光环', 开业时间: '12月29日' },
    ],
    深圳市: [
      { 门店名称: 'K11', 开业时间: '4月28日' },
      { 门店名称: '深业上城', 开业时间: '5月1日' },
      { 门店名称: '平安金融中心', 开业时间: '6月26日' },
      { 门店名称: '京基百纳', 开业时间: '8月3日' },
      { 门店名称: '金地威', 开业时间: '8月23日' },
      { 门店名称: '大悦城', 开业时间: '9月6日' },
      { 门店名称: '来福士', 开业时间: '12月20日' },
    ],
    重庆市: [
      { 门店名称: '高新天街', 开业时间: '4月30日' },
      { 门店名称: '光环花园城', 开业时间: '9月26日' },
      { 门店名称: '长嘉汇购物公园', 开业时间: '10月25日' },
    ],
    北京市: [
      { 门店名称: '通州万象汇', 开业时间: '6月17日' },
      { 门店名称: '悠唐', 开业时间: '6月24日' },
      { 门店名称: '西铁营万达', 开业时间: '7月8日' },
      { 门店名称: '中关村领展', 开业时间: '8月3日' },
      { 门店名称: '五棵松万达', 开业时间: '8月12日' },
      { 门店名称: '银座和谐广场', 开业时间: '11月12日' },
      { 门店名称: '枫蓝国际', 开业时间: '11月16日' },
      { 门店名称: '清河万象汇', 开业时间: '11月17日' },
      { 门店名称: '东方新天地', 开业时间: '12月9日' },
      { 门店名称: '华联万柳购物中心', 开业时间: '12月19日' },
    ],
    广州市: [
      { 门店名称: 'IFC国金中心', 开业时间: '6月15日' },
      { 门店名称: '琶洲天地', 开业时间: '11月29日' },
    ],
    上海市: [
      { 门店名称: '静安CP', 开业时间: '8月17日' },
      { 门店名称: '荟聚', 开业时间: '10月18日' },
    ],
    杭州市: [
      { 门店名称: '亚奥万象天地', 开业时间: '9月22日' },
      { 门店名称: '龙湖滨江天街', 开业时间: '9月30日' },
      { 门店名称: '大悦城', 开业时间: '10月25日' },
    ],
    南京市: [
      { 门店名称: '华采天地', 开业时间: '9月30日' },
    ],
  }), []);

  const storeTableData = useMemo(() => {
    const list = cityStoreMap[selectedCity] || [];
    return list.map(s => {
      const invest = Math.round(80 + Math.random() * 120);
      const revenue = Math.round(150 + Math.random() * 300);
      const target = Math.round(revenue * (0.9 + Math.random() * 0.3));
      const rate = target > 0 ? Math.round((revenue / target) * 100) : 0;
      return {
        门店名称: s.门店名称,
        开业时间: s.开业时间,
        投资金额: invest,
        累计营业额: revenue,
        营业额目标: target,
        营业额达标率: `${rate}%`,
      };
    });
  }, [selectedCity, cityStoreMap]);

  return (
    <>
      <DataTable
        data={rowsWithBudget}
        columns={columns}
        getKey={(item) => item.城市}
        hideNoDataMessage={true}
      />

      {selectedCity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedCity(null)} />
          <div className="relative bg-white w-full max-w-5xl mx-4 rounded-xl shadow-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-800">{selectedCity} · 城市洞察</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setSelectedCity(null)}>关闭</button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  {['门店数量', '新开门店数量', '闭店门店数量', '净增门店数量'].map(metric => (
                    <button
                      key={metric}
                      onClick={() => setActiveMetric(metric)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeMetric === metric ? 'bg-[#a40035] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {metric}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button 
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${showYoY ? 'bg-[#a40035] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    onClick={() => setShowYoY(!showYoY)}
                  >
                    显示同比
                  </button>
                  <button 
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${showAverage ? 'bg-[#a40035] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    onClick={() => setShowAverage(!showAverage)}
                  >
                    显示均值
                  </button>
                  <button 
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${showExtremes ? 'bg-[#a40035] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    onClick={() => setShowExtremes(!showExtremes)}
                  >
                    显示极值
                  </button>
                </div>
              </div>

              <LineTrendChart
                headerTitle="2025 月度趋势"
                headerUnit="家"
                values={metricSeries[activeMetric] || []}
                valuesYoY={seriesYoy}
                xLabels={monthLabels}
                showYoY={showYoY}
                showAverage={showAverage}
                showExtremes={showExtremes}
                width={900}
                height={340}
                colorPrimary="#a40035"
                colorYoY="#2563eb"
                valueFormatter={(v) => v}
                getHoverTitle={(idx) => `${monthLabels[idx]}`}
              />

              <div>
                <h4 className="text-base font-semibold text-gray-800 mb-3">今年新营建门店统计表</h4>
                <DataTable
                  data={storeTableData}
                  columns={[
                    { key: 'store', title: '门店名称', dataIndex: '门店名称' },
                    { key: 'openDate', title: '开业时间', dataIndex: '开业时间' },
                    { key: 'invest', title: '投资金额', dataIndex: '投资金额' },
                    { key: 'revenue', title: '累计营业额', dataIndex: '累计营业额' },
                    { key: 'target', title: '营业额目标', dataIndex: '营业额目标' },
                    { key: 'rate', title: '营业额达标率', dataIndex: '营业额达标率' },
                  ]}
                  getKey={(item, idx) => `${item.门店名称}-${idx}`}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
