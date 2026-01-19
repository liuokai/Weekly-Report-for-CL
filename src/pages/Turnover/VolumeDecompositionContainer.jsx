import React, { useState, useMemo } from 'react';
import DataContainer from '../../components/Common/DataContainer';
import DataTable from '../../components/Common/DataTable';
import LineTrendChart from '../../components/Common/LineTrendChart';
import LineTrendStyle from '../../components/Common/LineTrendStyleConfig';
import useFetchData from '../../hooks/useFetchData';
import BusinessTargets from '../../config/businessTargets';
import useTableSorting from '../../components/Common/useTableSorting';

const VolumeDecompositionContainer = () => {
  // 保持空数据状态，去掉填充的数据
  const [data] = useState([]);
  const [trendMetric, setTrendMetric] = useState('daily'); // 'daily' | 'cumulative'
  const [showYoY, setShowYoY] = useState(true);
  const [showAvg, setShowAvg] = useState(true);
  const [showExtremes, setShowExtremes] = useState(true);

  // Influence Analysis Chart State
  const [influenceMetric, setInfluenceMetric] = useState('duration'); // 'duration' | 'compliance'
  const [showInfYoY, setShowInfYoY] = useState(true);
  const [showInfAvg, setShowInfAvg] = useState(true);
  const [showInfExtremes, setShowInfExtremes] = useState(true);
  
  // City Modal State
  const [selectedCity, setSelectedCity] = useState(null);

  // Fetch Data
  const { data: annualVisitData } = useFetchData('getUserVisitCountAnnual', []);
  const { data: dailyAvgVisitMonthlyData } = useFetchData('getUserVisitCountDailyAvgMonthly', [], null, { manual: trendMetric !== 'daily' });
  const { data: cumVisitMonthlyData } = useFetchData('getUserVisitCountCumMonthly', [], null, { manual: trendMetric !== 'cumulative' });
  // 旧的城市下钻数据源移除，统一使用新的真实数据源（各指标按月/城市/门店）
  // 推拿师天均服务时长（新的真实数据源）
  const { data: staffDurationMonthly } = useFetchData('getStaffServiceDurationMonthly', [], null, { manual: influenceMetric !== 'duration' });
  const { data: staffDurationCityMonthly } = useFetchData('getStaffServiceDurationCityMonthly', [], null, { manual: influenceMetric !== 'duration' });
  const { data: staffDurationStoreMonthly } = useFetchData('getStaffServiceDurationStoreMonthly', { city: selectedCity }, null, { manual: !(selectedCity && influenceMetric === 'duration') });
  // 推拿师天均服务时长不达标占比（真实数据源）
  const { data: staffDurationBelowStandardMonthly } = useFetchData('getStaffServiceDurationBelowStandardMonthly', [], null, { manual: influenceMetric !== 'compliance' });
  const { data: staffDurationBelowStandardCityMonthly } = useFetchData('getStaffServiceDurationBelowStandardCityMonthly', [], null, { manual: influenceMetric !== 'compliance' });
  // 活跃会员数（真实数据源）
  const { data: activeUserMonthlyYoy } = useFetchData('getActiveUserMonthlyYoy', [], null, { manual: influenceMetric !== 'active_members' });
  const { data: activeUserCityMonthlyYoy } = useFetchData('getActiveUserCityMonthlyYoy', [], null, { manual: influenceMetric !== 'active_members' });
  const { data: activeUserStoreMonthlyYoy } = useFetchData('getActiveUserStoreMonthlyYoy', { city: selectedCity }, null, { manual: !(selectedCity && influenceMetric === 'active_members') });
  // 会员流失率（真实数据源）
  const { data: memberChurnMonthlyYoy } = useFetchData('getMemberChurnRateMonthlyYoy', [], null, { manual: influenceMetric !== 'churn_rate' });
  const { data: memberChurnCityMonthlyYoy } = useFetchData('getMemberChurnRateCityMonthlyYoy', [], null, { manual: influenceMetric !== 'churn_rate' });
  const { data: memberChurnStoreMonthlyYoy } = useFetchData('getMemberChurnRateStoreMonthlyYoy', { city: selectedCity }, null, { manual: !(selectedCity && influenceMetric === 'churn_rate') });
  // 主动评价率（真实数据源）
  const { data: activeReviewRateMonthlyYoy } = useFetchData('getActiveReviewRateMonthlyYoy', [], null, { manual: influenceMetric !== 'review_rate' });
  const { data: activeReviewRateCityMonthlyYoy } = useFetchData('getActiveReviewRateCityMonthlyYoy', [], null, { manual: influenceMetric !== 'review_rate' });
  const { data: activeReviewRateStoreMonthlyYoy } = useFetchData('getActiveReviewRateStoreMonthlyYoy', { city: selectedCity }, null, { manual: !(selectedCity && influenceMetric === 'review_rate') });

  const { data: cityBreakdownData } = useFetchData('getVolumeCityBreakdown');

  const tableData = useMemo(() => {
    const source = cityBreakdownData && cityBreakdownData.length > 0 ? cityBreakdownData : [];
    return source.map((row, index) => {
      const currentVol = parseInt(row.current_volume || 0, 10);
      const lastYearVol = parseInt(row.last_year_volume || 0, 10);
      let yoy = 0;
      if (lastYearVol > 0) {
        yoy = (currentVol - lastYearVol) / lastYearVol * 100;
      }
      
      return {
        key: index,
        city: row.city,
        currentVolume: currentVol,
        lastYearVolume: lastYearVol,
        yoyRate: `${yoy.toFixed(2)}%`
      };
    });
  }, [cityBreakdownData]);

  const columns = [
    { key: 'city', title: '城市名称', dataIndex: 'city' },
    { 
      key: 'currentVolume', 
      title: '今年客次量', 
      dataIndex: 'currentVolume',
      render: (val) => val.toLocaleString()
    },
    { 
      key: 'lastYearVolume', 
      title: '上年客次量', 
      dataIndex: 'lastYearVolume',
      render: (val) => val.toLocaleString()
    },
    { 
      key: 'yoyRate', 
      title: '同比变动', 
      dataIndex: 'yoyRate',
      render: (val) => {
        const num = parseFloat(val);
        const isNegative = num < 0;
        return (
          <span className={isNegative ? 'text-green-600' : 'text-red-600'}>
            {val}
          </span>
        );
      }
    }
  ];

  const { sortedData, sortConfig, handleSort } = useTableSorting(columns, tableData);

  const renderHQOverview = () => {
    let currentVolume = null, lastYearVolume = null, yoyRate = null;
    if (annualVisitData && annualVisitData.length > 0) {
      const latest = annualVisitData[0];
      currentVolume = latest.annual_total_visits != null ? Number(latest.annual_total_visits) : null;
      lastYearVolume = latest.last_year_same_period_visits != null ? Number(latest.last_year_same_period_visits) : null;
      yoyRate = latest.visits_yoy_pct != null ? Number(latest.visits_yoy_pct) : null;
    }

    const growthRate = yoyRate != null 
      ? yoyRate 
      : (lastYearVolume && currentVolume ? ((currentVolume - lastYearVolume) / lastYearVolume) * 100 : null);

    const targetVolume = BusinessTargets.turnover.volumeDecomposition.annualCumulativeTarget || 0;
    const completionRate = targetVolume && currentVolume ? (currentVolume / targetVolume) * 100 : 0;

    const size = 80;
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progressPercent = Math.max(0, Math.min(100, completionRate)); 
    const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-100 mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-[#a40035]/5 rounded-bl-full pointer-events-none"></div>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="w-1 h-5 bg-[#a40035] rounded-full"></span>
            客次量达成情况概览
          </h3>
        </div>
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <div className="flex-1 z-10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="text-sm text-gray-500 truncate">截止本周年度累计客次量</div>
                <div className="flex items-baseline gap-2 whitespace-nowrap">
                  <span className="text-3xl xl:text-4xl font-bold text-[#a40035]">
                    {currentVolume != null ? Number(currentVolume).toLocaleString() : '—'}
                  </span>
                  <span className="text-sm font-normal text-gray-400">人次</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">去年</span>
                    <span className="font-semibold text-gray-700">
                      {lastYearVolume != null ? Number(lastYearVolume).toLocaleString() : '—'}
                    </span>
                  </div>
                  <div className="w-px h-3 bg-gray-300 hidden sm:block"></div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">同比</span>
                    <span className={`font-bold ${
                      growthRate != null ? (growthRate >= 0 ? 'text-red-600' : 'text-green-600') : 'text-gray-400'
                    }`}>
                      {growthRate != null ? `${growthRate > 0 ? '+' : ''}${Number(growthRate).toFixed(2)}%` : '—'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-gray-400 mb-1">
                    目标 <span className="font-medium text-gray-600">
                      {targetVolume ? (targetVolume / 10000).toFixed(0) + '万' : '暂无'}
                    </span>
                  </div>
                </div>
                <div className="relative flex items-center justify-center">
                  <svg width={size} height={size} className="transform -rotate-90">
                    <circle cx={size / 2} cy={size / 2} r={radius} stroke="#f3f4f6" strokeWidth={strokeWidth} fill="none" />
                    <circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      stroke="#a40035"
                      strokeWidth={strokeWidth}
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-[10px] text-gray-400">达成率</span>
                    <span className="text-sm font-bold text-[#a40035]">
                      {completionRate ? completionRate.toFixed(0) + '%' : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="hidden lg:block w-px bg-gray-200 self-stretch"></div>
          <div className="flex-1 z-10 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">预算金额</div>
              {(() => {
                const amount = BusinessTargets.turnover.volumeDecomposition.budget?.amount || 0;
                const priceBudget = BusinessTargets.turnover.priceDecomposition.budget?.amount || 0;
                const total = amount + priceBudget;
                const ratio = total > 0 ? (amount / total) * 100 : 0;
                return <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#a40035]/10 text-[#a40035] font-medium">费用占比 {ratio.toFixed(1)}%</span>;
              })()}
            </div>
            <div className="flex items-center justify-between gap-6">
              <div className="flex flex-col min-w-0">
                <div className="text-3xl xl:text-4xl font-bold text-[#a40035] whitespace-nowrap">
                  {(() => {
                    const amount = BusinessTargets.turnover.volumeDecomposition.budget?.amount || 0;
                    return `¥${Number(amount).toFixed(1)}万`;
                  })()}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <span>人工成本:</span>
                    <span className="font-semibold text-gray-700">
                      {(() => {
                        const labor = BusinessTargets.turnover.volumeDecomposition.budget?.labor || 0;
                        return `¥${Number(labor).toFixed(1)}万`;
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <span>预算费用:</span>
                    <span className="font-semibold text-gray-700">
                      {(() => {
                        const cost = BusinessTargets.turnover.volumeDecomposition.budget?.cost || 0;
                        return `¥${Number(cost).toFixed(1)}万`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTrendChart = () => {
    let values = [], valuesYoY = [], months = [], title, unit, yAxisFormatter;

    if (trendMetric === 'daily') {
      title = "天均客次量趋势";
      unit = "人次";
      yAxisFormatter = (v) => Math.round(v).toLocaleString();
      if (dailyAvgVisitMonthlyData && dailyAvgVisitMonthlyData.length > 0) {
        const sorted = [...dailyAvgVisitMonthlyData].slice(0, 12).sort((a, b) => a.month.localeCompare(b.month));
        months = sorted.map(d => {
          const [y, m] = String(d.month).split('-');
          return `${String(y).slice(-2)}年${Number(m)}月`;
        });
        values = sorted.map(d => Number(d.daily_avg_visits));
        valuesYoY = sorted.map(d => Number(d.last_year_daily_avg_visits));
      }
    } else {
      title = "年度累计客次量趋势";
      unit = "人次";
      yAxisFormatter = (v) => Math.round(v).toLocaleString();
      if (cumVisitMonthlyData && cumVisitMonthlyData.length > 0) {
        const sorted = [...cumVisitMonthlyData].slice(0, 12).sort((a, b) => a.month.localeCompare(b.month));
        months = sorted.map(d => {
          const [y, m] = String(d.month).split('-');
          return `${String(y).slice(-2)}年${Number(m)}月`;
        });
        values = sorted.map(d => Number(d.ytd_cumulative_visits));
        valuesYoY = sorted.map(d => Number(d.last_year_ytd_cumulative_visits));
      }
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mt-6">
        {LineTrendStyle.renderHeader(title, unit)}
        {LineTrendStyle.renderMetricSwitch(
          [
            { key: 'daily', label: '天均客次量' },
            { key: 'cumulative', label: '年度累计客次量' }
          ],
          trendMetric,
          setTrendMetric
        )}
        {LineTrendStyle.renderAuxControls({
          showYoY,
          setShowYoY: () => setShowYoY(!showYoY),
          showTrend: showAvg,
          setShowTrend: () => setShowAvg(!showAvg),
          showExtremes,
          setShowExtremes: () => setShowExtremes(!showExtremes)
        })}

        <LineTrendChart
          values={values}
          valuesYoY={valuesYoY}
          xLabels={months}
          showYoY={showYoY}
          showTrend={showAvg}
          showExtremes={showExtremes}
          currentLabel="2025年"
          lastLabel="2024年"
          height={LineTrendStyle.DIMENSIONS.height}
          width={LineTrendStyle.DIMENSIONS.width}
          colorPrimary={LineTrendStyle.COLORS.primary}
          colorYoY={LineTrendStyle.COLORS.yoy}
          yAxisFormatter={yAxisFormatter}
          valueFormatter={(v) => Math.round(v).toLocaleString()}
        />
      </div>
    );
  };

  const renderCityModal = () => {
    if (!selectedCity) return null;

    const metricNameMap = {
      duration: "推拿师天均服务时长",
      compliance: "推拿师天均服务时长不达标占比",
      active_members: "活跃会员数",
      churn_rate: "会员流失率",
      review_rate: "主动评价率"
    };

    // 计算近12个月（表头按当前月份滚动）
    const buildLast12Months = () => {
      const now = new Date();
      const arr = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
        const y = d.getUTCFullYear();
        const m = d.getUTCMonth() + 1;
        const ym = `${y}-${String(m).padStart(2, '0')}`;
        arr.push(ym);
      }
      return arr;
    };
    const formatMonthLabel = (ym) => {
      const [y, m] = ym.split('-');
      return `${String(y).slice(-2)}年${Number(m)}月`;
    };
    const monthKeysAsc = buildLast12Months();
    const monthsAsc = monthKeysAsc.map(formatMonthLabel);
    const monthKeysDesc = [...monthKeysAsc].reverse();
    const monthsDesc = monthKeysDesc.map(formatMonthLabel);

    // 上半部分趋势：选定城市近12月的指标趋势
    let trendValues = [];
    let trendValuesYoY = [];
    let trendValuesPct = [];
    if (influenceMetric === 'duration') {
      if (staffDurationCityMonthly && staffDurationCityMonthly.length > 0) {
        const filtered = staffDurationCityMonthly.filter(d => d.statistics_city_name === selectedCity);
        const byMonth = {};
        filtered.forEach(d => { 
          byMonth[d.month] = {
            curr: Number(d.avg_staff_daily_duration),
            prev: Number(d.avg_staff_daily_duration_yoy)
          };
        });
        trendValues = monthKeysAsc.map(k => {
          const v = byMonth[k]?.curr;
          return Number.isFinite(v) ? Number(v.toFixed(2)) : null;
        });
        trendValuesYoY = monthKeysAsc.map(k => {
          const v = byMonth[k]?.prev;
          return Number.isFinite(v) ? Number(v.toFixed(2)) : null;
        });
      }
    } else if (influenceMetric === 'compliance') {
      if (staffDurationBelowStandardCityMonthly && staffDurationBelowStandardCityMonthly.length > 0) {
        const filtered = staffDurationBelowStandardCityMonthly.filter(d => (d.city_name === selectedCity || d.statistics_city_name === selectedCity));
        const byMonth = {};
        filtered.forEach(d => { 
          const ym = `${d.stat_year}-${String(d.stat_month).padStart(2, '0')}`;
          byMonth[ym] = {
            curr: Number(d.below_standard_ratio),
            prev: Number(d.below_standard_ratio_yoy)
          };
        });
        trendValues = monthKeysAsc.map(k => {
          const v = byMonth[k]?.curr;
          return Number.isFinite(v) ? Number(v.toFixed(2)) : null;
        });
        trendValuesYoY = monthKeysAsc.map(k => {
          const v = byMonth[k]?.prev;
          return Number.isFinite(v) ? Number(v.toFixed(2)) : null;
        });
      }
    } else if (influenceMetric === 'active_members') {
      if (activeUserCityMonthlyYoy && activeUserCityMonthlyYoy.length > 0) {
        const filtered = activeUserCityMonthlyYoy.filter(d => d.statistics_city_name === selectedCity);
        const byMonth = {};
        filtered.forEach(d => {
          const m = String(d.month).substring(0, 7);
          byMonth[m] = {
            curr: Number(d.active_member_count),
            prev: Number(d.last_year_active_member_count),
            pct: Number(d.yoy_rate)
          };
        });
        trendValues = monthKeysAsc.map(k => {
          const v = byMonth[k]?.curr;
          return Number.isFinite(v) ? v : null;
        });
        trendValuesYoY = monthKeysAsc.map(k => {
          const v = byMonth[k]?.prev;
          return Number.isFinite(v) ? v : null;
        });
        trendValuesPct = monthKeysAsc.map(k => {
          const v = byMonth[k]?.pct;
          return Number.isFinite(v) ? v : null;
        });
      }
    } else if (influenceMetric === 'churn_rate') {
      if (memberChurnCityMonthlyYoy && memberChurnCityMonthlyYoy.length > 0) {
        const filtered = memberChurnCityMonthlyYoy.filter(d => d.city === selectedCity);
        const byMonth = {};
        filtered.forEach(d => { 
          const m = String(d.month).substring(0, 7);
          byMonth[m] = {
            curr: Number(d.churn_rate),
            prev: Number(d.churn_rate_last_year),
            pct: Number(d.churn_rate_yoy)
          };
        });
        trendValues = monthKeysAsc.map(k => {
          const v = byMonth[k]?.curr;
          return Number.isFinite(v) ? v : null;
        });
        trendValuesYoY = monthKeysAsc.map(k => {
          const v = byMonth[k]?.prev;
          return Number.isFinite(v) ? v : null;
        });
        trendValuesPct = monthKeysAsc.map(k => {
          const v = byMonth[k]?.pct;
          return Number.isFinite(v) ? v : null;
        });
      }
    } else if (influenceMetric === 'review_rate') {
      if (activeReviewRateCityMonthlyYoy && activeReviewRateCityMonthlyYoy.length > 0) {
        const filtered = activeReviewRateCityMonthlyYoy.filter(d => (d.city === selectedCity || d.city_name === selectedCity));
        const byMonth = {};
        filtered.forEach(d => {
          const m = String(d.month).substring(0, 7);
          const curr = d.review_rate_pct != null ? Number(d.review_rate_pct) : Number(d.review_rate);
          const prev = d.last_year_review_rate_pct != null ? Number(d.last_year_review_rate_pct) : Number(d.last_year_review_rate);
          const yoy = d.yoy_change_pct_points != null ? Number(d.yoy_change_pct_points) : (curr != null && prev != null ? Number((curr - prev).toFixed(2)) : null);
          byMonth[m] = {
            curr: Number.isFinite(curr) ? curr : null,
            prev: Number.isFinite(prev) ? prev : null,
            pct: Number.isFinite(yoy) ? yoy : null
          };
        });
        trendValues = monthKeysAsc.map(k => {
          const v = byMonth[k]?.curr;
          return Number.isFinite(v) ? Number(v) : null;
        });
        trendValuesYoY = monthKeysAsc.map(k => {
          const v = byMonth[k]?.prev;
          return Number.isFinite(v) ? Number(v) : null;
        });
        trendValuesPct = monthKeysAsc.map(k => {
          const v = byMonth[k]?.pct;
          return Number.isFinite(v) ? Number(v) : null;
        });
      }
    }

    // 下半部分表格：该城市下各门店近12月推拿师天均服务时长
    let storeData = [];
    if (influenceMetric === 'active_members') {
      if (activeUserStoreMonthlyYoy && activeUserStoreMonthlyYoy.length > 0) {
        const filtered = activeUserStoreMonthlyYoy.filter(d => d.statistics_city_name === selectedCity);
        const storeMap = {};
        filtered.forEach(d => {
          const key = d.store_name;
          if (!storeMap[key]) {
            storeMap[key] = { key, store: d.store_name };
          }
          const m = String(d.month).substring(0, 7);
          const idx = monthKeysDesc.indexOf(m);
          if (idx !== -1) {
            const num = Number(d.active_member_count);
            storeMap[key][`m${idx + 1}`] = Number.isFinite(num) ? num : null;
          }
        });
        storeData = Object.values(storeMap);
      }
    } else if (influenceMetric === 'churn_rate') {
      if (memberChurnStoreMonthlyYoy && memberChurnStoreMonthlyYoy.length > 0) {
        const filtered = memberChurnStoreMonthlyYoy.filter(d => d.city === selectedCity);
        const storeMap = {};
        filtered.forEach(d => {
          const key = d.store_name;
          if (!storeMap[key]) {
            storeMap[key] = { key, store: d.store_name };
          }
          const m = String(d.month).substring(0, 7);
          const idx = monthKeysDesc.indexOf(m);
          if (idx !== -1) {
            const num = Number(d.churn_rate);
            storeMap[key][`m${idx + 1}`] = Number.isFinite(num) ? Number(num.toFixed(2)) : null;
          }
        });
        storeData = Object.values(storeMap);
      }
    } else if (influenceMetric === 'review_rate') {
      if (activeReviewRateStoreMonthlyYoy && activeReviewRateStoreMonthlyYoy.length > 0) {
        const filtered = activeReviewRateStoreMonthlyYoy.filter(d => (d.city === selectedCity || d.city_name === selectedCity));
        const storeMap = {};
        filtered.forEach(d => {
          const key = d.store_name;
          if (!storeMap[key]) {
            storeMap[key] = { key, store: d.store_name };
          }
          const m = String(d.month).substring(0, 7);
          const idx = monthKeysDesc.indexOf(m);
          if (idx !== -1) {
            const curr = d.review_rate_pct != null ? Number(d.review_rate_pct) : Number(d.review_rate);
            storeMap[key][`m${idx + 1}`] = Number.isFinite(curr) ? Number(curr.toFixed(2)) : null;
          }
        });
        storeData = Object.values(storeMap);
      }
    } else if (staffDurationStoreMonthly && staffDurationStoreMonthly.length > 0) {
      const filtered = staffDurationStoreMonthly.filter(d => d.statistics_city_name === selectedCity);
      const storeMap = {};
      filtered.forEach(d => {
        const key = d.store_name;
        if (!storeMap[key]) {
          storeMap[key] = { key, store: d.store_name };
        }
        const idx = monthKeysDesc.indexOf(d.month);
        if (idx !== -1) {
          const num = Number(d.avg_staff_daily_duration);
          storeMap[key][`m${idx + 1}`] = Number.isFinite(num) ? Number(num.toFixed(2)) : null;
        }
      });
      storeData = Object.values(storeMap);
    }

    const getMetricConfig = () => {
       switch(influenceMetric) {
         case 'duration': return { title: '推拿师天均服务时长', unit: '分钟', isGood: v => v >= 300 };
         case 'compliance': return { title: '推拿师天均服务时长不达标占比', unit: '%', isGood: v => v <= 25 };
         case 'active_members': return { title: '活跃会员数', unit: '人', isGood: () => false };
         case 'churn_rate': return { title: '会员流失率', unit: '%', isGood: v => v <= 5 };
         case 'review_rate': return { title: '主动评价率', unit: '%', isGood: v => v >= 70 };
         default: return { title: '', unit: '', isGood: () => false };
       }
    };
    const config = getMetricConfig();

    const storeColumns = [
      { key: 'store', title: '门店名称', dataIndex: 'store', fixed: 'left', width: 120 },
      ...monthsDesc.map((month, idx) => ({
        key: `m${idx+1}`,
        title: month,
        dataIndex: `m${idx+1}`,
        render: (val) => {
           const num = Number(val);
           let displayVal = '—';
           if (Number.isFinite(num)) {
             if (influenceMetric === 'duration' || influenceMetric === 'compliance') {
               displayVal = Number(num).toFixed(2);
             } else if (influenceMetric === 'active_members') {
               displayVal = Math.round(num).toLocaleString();
             } else {
               displayVal = `${num.toFixed(2)}%`;
             }
           }

           let colorClass = 'text-gray-700';
           if (influenceMetric !== 'active_members') {
               colorClass = Number.isFinite(num) && config.isGood(num) ? 'text-red-600 font-bold' : 'text-gray-700';
           }
 
           return <span className={colorClass}>{displayVal}</span>;
        }
      }))
    ];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedCity(null)}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
             <h3 className="text-xl font-bold text-gray-800">{selectedCity} - {metricNameMap[influenceMetric]}分析</h3>
             <button onClick={() => setSelectedCity(null)} className="text-gray-400 hover:text-gray-600">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>
          </div>
          
          <div className="p-6 space-y-8">
            {/* Top: Trend Chart */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <button 
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${showInfYoY ? 'bg-[#a40035] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  onClick={() => setShowInfYoY(!showInfYoY)}
                >
                  <span className="inline-flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 17l6-6 4 4 7-7" stroke="currentColor" strokeWidth="2" /></svg>
                    显示同比
                  </span>
                </button>
                <button 
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${showInfAvg ? 'bg-[#a40035] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  onClick={() => setShowInfAvg(!showInfAvg)}
                >
                  <span className="inline-flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 12h16" stroke="currentColor" strokeWidth="2" /></svg>
                    显示均值
                  </span>
                </button>
                <button 
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${showInfExtremes ? 'bg-[#a40035] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  onClick={() => setShowInfExtremes(!showInfExtremes)}
                >
                  <span className="inline-flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2l3 6 6 .5-4.5 4 1.5 6-6-3.5-6 3.5 1.5-6L3 8.5l6-.5 3-6z" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
                    显示极值
                  </span>
                </button>
              </div>
              <LineTrendChart
                values={trendValues}
                valuesYoY={trendValuesYoY}
                valuesPct={trendValuesPct}
                xLabels={monthsAsc}
                height={LineTrendStyle.DIMENSIONS.height}
                width={LineTrendStyle.DIMENSIONS.width}
                colorPrimary={LineTrendStyle.COLORS.primary}
                colorYoY={LineTrendStyle.COLORS.yoy}
                valueFormatter={(v) => {
                   const num = Number(v);
                   if (!Number.isFinite(num)) return '—';
                   if (influenceMetric === 'duration') return Number(num).toFixed(2);
                   if (influenceMetric === 'active_members') return Math.round(num).toLocaleString();
                   return `${num.toFixed(2)}%`;
                }}
                showYoY={showInfYoY}
                showTrend={showInfAvg}
                showExtremes={showInfExtremes}
              />
            </div>

            {/* Bottom: Store Table */}
            <div>
              <h4 className="text-sm font-bold text-gray-600 mb-4 border-l-4 border-[#a40035] pl-2">门店数据明细</h4>
              <DataTable data={storeData} columns={storeColumns} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInfluenceTable = () => {
    // 近12个月的表头（随时间滚动）
    const buildLast12Months = () => {
      const now = new Date();
      const arr = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
        const y = d.getUTCFullYear();
        const m = d.getUTCMonth() + 1;
        const ym = `${y}-${String(m).padStart(2, '0')}`;
        arr.push(ym);
      }
      return arr;
    };
    const monthKeysAsc = buildLast12Months();
    const monthKeysDesc = [...monthKeysAsc].reverse();
    const months = monthKeysDesc.map(ym => {
      const [y, m] = ym.split('-');
      return `${String(y).slice(-2)}年${Number(m)}月`;
    });
    
    // Generate City Data with 12 months
    let cityData = [];
    
    if (influenceMetric === 'duration') {
      if (staffDurationCityMonthly && staffDurationCityMonthly.length > 0) {
        const map = {};
        staffDurationCityMonthly.forEach(item => {
          const city = item.statistics_city_name;
          const month = item.month;
          if (!map[city]) {
            map[city] = { key: city, city };
          }
          const idx = monthKeysDesc.indexOf(month);
          if (idx !== -1) {
            const num = Number(item.avg_staff_daily_duration);
            map[city][`m${idx + 1}`] = Number.isFinite(num) ? Number(num.toFixed(2)) : null;
          }
        });
        cityData = Object.values(map);
      }
    } else if (influenceMetric === 'compliance') {
      if (staffDurationBelowStandardCityMonthly && staffDurationBelowStandardCityMonthly.length > 0) {
        const map = {};
        staffDurationBelowStandardCityMonthly.forEach(item => {
          const city = item.city_name;
          const ym = `${item.stat_year}-${String(item.stat_month).padStart(2, '0')}`;
          if (!map[city]) {
            map[city] = { key: city, city };
          }
          const idx = monthKeysDesc.indexOf(ym);
          if (idx !== -1) {
            const num = Number(item.below_standard_ratio);
            map[city][`m${idx + 1}`] = Number.isFinite(num) ? Number(num.toFixed(2)) : null;
          }
        });
        cityData = Object.values(map);
      }
    } else if (influenceMetric === 'active_members') {
      if (activeUserCityMonthlyYoy && activeUserCityMonthlyYoy.length > 0) {
        const map = {};
         activeUserCityMonthlyYoy.forEach(item => {
           const city = item.statistics_city_name;
           const m = String(item.month).substring(0, 7);
           if (!map[city]) {
             map[city] = { key: city, city };
           }
           const idx = monthKeysDesc.indexOf(m);
           if (idx !== -1) {
             const num = Number(item.active_member_count);
             map[city][`m${idx + 1}`] = Number.isFinite(num) ? num : null;
           }
         });
        cityData = Object.values(map);
      }
    } else if (influenceMetric === 'churn_rate') {
      if (memberChurnCityMonthlyYoy && memberChurnCityMonthlyYoy.length > 0) {
        const map = {};
        memberChurnCityMonthlyYoy.forEach(item => {
          const city = item.city;
          const m = String(item.month).substring(0, 7);
          if (!map[city]) {
            map[city] = { key: city, city };
          }
          const idx = monthKeysDesc.indexOf(m);
          if (idx !== -1) {
            const num = Number(item.churn_rate);
            map[city][`m${idx + 1}`] = Number.isFinite(num) ? Number(num.toFixed(2)) : null;
          }
        });
        cityData = Object.values(map);
      }
    } else if (influenceMetric === 'review_rate') {
      if (activeReviewRateCityMonthlyYoy && activeReviewRateCityMonthlyYoy.length > 0) {
        const map = {};
        activeReviewRateCityMonthlyYoy.forEach(item => {
          const city = item.city || item.city_name;
          const m = String(item.month).substring(0, 7);
          if (!map[city]) {
            map[city] = { key: city, city };
          }
          const idx = monthKeysDesc.indexOf(m);
          if (idx !== -1) {
            const curr = item.review_rate_pct != null ? Number(item.review_rate_pct) : Number(item.review_rate);
            map[city][`m${idx + 1}`] = Number.isFinite(curr) ? Number(curr.toFixed(2)) : null;
          }
        });
        cityData = Object.values(map);
      }
    }

    const getMetricConfig = () => {
       switch(influenceMetric) {
         case 'duration': return { title: '推拿师天均服务时长', unit: '分钟', isGood: v => v >= 300 };
         case 'compliance': return { title: '推拿师天均服务时长不达标占比', unit: '%', isGood: v => v <= 25 };
         case 'active_members': return { title: '活跃会员数', unit: '人', isGood: () => false };
         case 'churn_rate': return { title: '会员流失率', unit: '%', isGood: v => v <= 5 };
         case 'review_rate': return { title: '主动评价率', unit: '%', isGood: v => v >= 70 };
         default: return { title: '', unit: '', isGood: () => false };
       }
    };

    const config = getMetricConfig();

    const columns = [
      { 
        key: 'city', 
        title: '城市', 
        dataIndex: 'city',
        fixed: 'left',
        width: 100,
        render: (text) => (
          <span 
            className="text-[#a40035] cursor-pointer hover:underline font-medium"
            onClick={() => setSelectedCity(text)}
          >
            {text}
          </span>
        )
      },
      ...months.map((month, idx) => ({
        key: `m${idx+1}`,
        title: month,
        dataIndex: `m${idx+1}`,
        render: (val) => {
           const num = Number(val);
           let displayVal = '—';
           if (Number.isFinite(num)) {
             if (influenceMetric === 'duration') {
               displayVal = Number(num).toFixed(2);
             } else if (influenceMetric === 'active_members') {
               displayVal = Math.round(num).toLocaleString();
             } else {
               displayVal = `${num.toFixed(2)}%`;
             }
           }

           let colorClass = 'text-gray-700';
            if (influenceMetric !== 'active_members') {
               colorClass = Number.isFinite(num) && config.isGood(num) ? 'text-red-600 font-bold' : 'text-gray-700';
            }
 
           return <span className={colorClass}>{displayVal}</span>;
        }
      }))
    ];

    return (
      <div className="mt-8 border-t border-gray-100 pt-6">
         <h4 className="text-sm font-bold text-gray-800 mb-4">城市维度数据统计</h4>
         <DataTable data={cityData} columns={columns} stickyHeader={true} />
      </div>
    );
  };

  const renderInfluenceAnalysisChart = () => {
    const buildLast12Months = () => {
      const now = new Date();
      const arr = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
        const y = d.getUTCFullYear();
        const m = d.getUTCMonth() + 1;
        const ym = `${y}-${String(m).padStart(2, '0')}`;
        arr.push(ym);
      }
      return arr;
    };
    const monthKeys = buildLast12Months();
    const months = monthKeys.map(ym => {
      const [y, m] = ym.split('-');
      return `${String(y).slice(-2)}年${Number(m)}月`;
    });
    let values = [], valuesYoY = [], valuesPct = [], title, unit, yAxisFormatter, valueFormatter;

    // Set titles and formatters based on metric
    if (influenceMetric === 'duration') {
      title = "推拿师天均服务时长";
      unit = "分钟";
      yAxisFormatter = (v) => {
        const num = Number(v);
        return Number.isFinite(num) ? Number(num.toFixed(2)) : '—';
      };
      valueFormatter = (v) => {
        const num = Number(v);
        return Number.isFinite(num) ? Number(num).toFixed(2) : '—';
      };
    } else if (influenceMetric === 'compliance') {
      title = "推拿师天均服务时长不达标占比";
      unit = "%";
      yAxisFormatter = (v) => {
        const num = Number(v);
        return Number.isFinite(num) ? `${num.toFixed(2)}%` : '—';
      };
      valueFormatter = (v) => {
        const num = Number(v);
        return Number.isFinite(num) ? `${num.toFixed(2)}%` : '—';
      };
    } else if (influenceMetric === 'active_members') {
      title = "活跃会员数";
      unit = "人";
      yAxisFormatter = (v) => {
        const num = Number(v);
        return Number.isFinite(num) ? (num / 10000).toFixed(1) + '万' : '—';
      };
      valueFormatter = (v) => {
        const num = Number(v);
        return Number.isFinite(num) ? num.toLocaleString() : '—';
      };
    } else if (influenceMetric === 'churn_rate') {
      title = "会员流失率";
      unit = "%";
      yAxisFormatter = (v) => {
        const num = Number(v);
        return Number.isFinite(num) ? `${num.toFixed(2)}%` : '—';
      };
      valueFormatter = (v) => {
        const num = Number(v);
        return Number.isFinite(num) ? `${num.toFixed(2)}%` : '—';
      };
    } else { // review_rate
      title = "主动评价率";
      unit = "%";
      yAxisFormatter = (v) => {
        const num = Number(v);
        return Number.isFinite(num) ? `${num.toFixed(2)}%` : '—';
      };
      valueFormatter = (v) => {
        const num = Number(v);
        return Number.isFinite(num) ? `${num.toFixed(2)}%` : '—';
      };
    }

    if (influenceMetric === 'duration') {
      if (staffDurationMonthly && staffDurationMonthly.length > 0) {
        const byMonth = {};
        staffDurationMonthly.forEach(d => {
          byMonth[d.month] = {
            curr: Number(d.avg_staff_daily_duration),
            prev: Number(d.avg_staff_daily_duration_yoy)
          };
        });
        values = monthKeys.map(k => {
          const v = byMonth[k]?.curr;
          return Number.isFinite(v) ? Number(v.toFixed(2)) : null;
        });
        valuesYoY = monthKeys.map(k => {
          const v = byMonth[k]?.prev;
          return Number.isFinite(v) ? Number(v.toFixed(2)) : null;
        });
      }
    } else if (influenceMetric === 'compliance') {
      if (staffDurationBelowStandardMonthly && staffDurationBelowStandardMonthly.length > 0) {
        const byMonth = {};
        staffDurationBelowStandardMonthly.forEach(d => {
          const ym = `${d.stat_year}-${String(d.stat_month).padStart(2, '0')}`;
          byMonth[ym] = {
            curr: Number(d.below_standard_ratio),
            prev: Number(d.below_standard_ratio_yoy)
          };
        });
        values = monthKeys.map(k => {
          const v = byMonth[k]?.curr;
          return Number.isFinite(v) ? Number(v.toFixed(2)) : null;
        });
        valuesYoY = monthKeys.map(k => {
          const v = byMonth[k]?.prev;
          return Number.isFinite(v) ? Number(v.toFixed(2)) : null;
        });
      }
    } else if (influenceMetric === 'active_members') {
      if (activeUserMonthlyYoy && activeUserMonthlyYoy.length > 0) {
        const byMonth = {};
          activeUserMonthlyYoy.forEach(d => {
            const m = String(d.month).substring(0, 7);
            byMonth[m] = {
              curr: Number(d.active_member_count),
              prev: Number(d.last_year_active_member_count),
              pct: Number(d.yoy_rate)
            };
          });
          values = monthKeys.map(k => {
           const v = byMonth[k]?.curr;
           return Number.isFinite(v) ? v : null;
         });
         valuesYoY = monthKeys.map(k => {
           const v = byMonth[k]?.prev;
           return Number.isFinite(v) ? v : null;
         });
         valuesPct = monthKeys.map(k => {
           const v = byMonth[k]?.pct;
           return Number.isFinite(v) ? v : null;
         });
       }
     } else if (influenceMetric === 'churn_rate') {
       if (memberChurnMonthlyYoy && memberChurnMonthlyYoy.length > 0) {
         const byMonth = {};
         memberChurnMonthlyYoy.forEach(d => {
           const m = String(d.month).substring(0, 7);
           byMonth[m] = {
             curr: Number(d.churn_rate),
             prev: Number(d.churn_rate_last_year),
             pct: Number(d.churn_rate_yoy)
           };
         });
         values = monthKeys.map(k => {
           const v = byMonth[k]?.curr;
           return Number.isFinite(v) ? v : null;
         });
         valuesYoY = monthKeys.map(k => {
           const v = byMonth[k]?.prev;
           return Number.isFinite(v) ? v : null;
         });
         valuesPct = monthKeys.map(k => {
           const v = byMonth[k]?.pct;
           return Number.isFinite(v) ? v : null;
         });
       }
     } else if (influenceMetric === 'review_rate') {
       if (activeReviewRateMonthlyYoy && activeReviewRateMonthlyYoy.length > 0) {
         const byMonth = {};
         activeReviewRateMonthlyYoy.forEach(d => {
           const m = String(d.month).substring(0, 7);
           const curr = d.review_rate_pct != null ? Number(d.review_rate_pct) : Number(d.review_rate);
           const prev = d.last_year_review_rate_pct != null ? Number(d.last_year_review_rate_pct) : Number(d.last_year_review_rate);
           const yoy = d.yoy_change_pct_points != null ? Number(d.yoy_change_pct_points) : (curr != null && prev != null ? Number((curr - prev).toFixed(2)) : null);
           byMonth[m] = {
             curr: Number.isFinite(curr) ? curr : null,
             prev: Number.isFinite(prev) ? prev : null,
             pct: Number.isFinite(yoy) ? yoy : null
           };
         });
         values = monthKeys.map(k => {
           const v = byMonth[k]?.curr;
           return Number.isFinite(v) ? Number(v) : null;
         });
         valuesYoY = monthKeys.map(k => {
           const v = byMonth[k]?.prev;
           return Number.isFinite(v) ? Number(v) : null;
         });
         valuesPct = monthKeys.map(k => {
           const v = byMonth[k]?.pct;
           return Number.isFinite(v) ? Number(v) : null;
         });
       }
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mt-6">
        {LineTrendStyle.renderHeader('客次量·影响指标分析', unit)}

        <div className="mb-6 space-y-4">
          {/* Row 1: Metrics */}
          {LineTrendStyle.renderMetricSwitch(
            [
              { key: 'duration', label: '推拿师天均服务时长' },
              { key: 'compliance', label: '推拿师天均服务时长不达标占比' },
              { key: 'active_members', label: '活跃会员数' },
              { key: 'churn_rate', label: '会员流失率' },
              { key: 'review_rate', label: '主动评价率' }
            ],
            influenceMetric,
            setInfluenceMetric
          )}
          
          {/* Row 2: Options */}
          {LineTrendStyle.renderAuxControls({
            showYoY: showInfYoY,
            setShowYoY: () => setShowInfYoY(!showInfYoY),
            showTrend: showInfAvg,
            setShowTrend: () => setShowInfAvg(!showInfAvg),
            showExtremes: showInfExtremes,
            setShowExtremes: () => setShowInfExtremes(!showInfExtremes)
          })}
        </div>

        <LineTrendChart
          values={values}
          valuesYoY={valuesYoY}
          valuesPct={valuesPct}
          xLabels={months}
          showYoY={showInfYoY}
          showTrend={showInfAvg}
          showExtremes={showInfExtremes}
          currentLabel="2025年"
          lastLabel="2024年"
          height={LineTrendStyle.DIMENSIONS.height}
          width={LineTrendStyle.DIMENSIONS.width}
          colorPrimary={LineTrendStyle.COLORS.primary}
          colorYoY={LineTrendStyle.COLORS.yoy}
          yAxisFormatter={yAxisFormatter}
          valueFormatter={valueFormatter}
        />
        
        {renderInfluenceTable()}
      </div>
    );
  };

  const renderContent = () => (
    <div className="space-y-6">
      {renderCityModal()}
      {renderHQOverview()}
      {renderTrendChart()}
      {renderInfluenceAnalysisChart()}
      <DataTable data={sortedData} columns={columns} hideNoDataMessage={true} onSort={handleSort} sortConfig={sortConfig} />
    </div>
  );

  return (
    <DataContainer
      title="客次量拆解"
      data={{ rows: tableData }}
      renderContent={renderContent}
      maxHeight="none"
    />
  );
};

export default VolumeDecompositionContainer;
