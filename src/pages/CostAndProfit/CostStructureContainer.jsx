import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';

const FIELD_LABELS = {
  city_name: '城市名称',
  store_name: '门店名称',
  revenue: '营业额',
  net_profit: '净利润',
  masseur_cost: '推拿师成本',
  manager_cost: '客户经理成本',
  service_fee: '服务费',
  material_cost: '物资成本',
  asset_maintenance_fee: '资产维护费',
  utility_fee: '水电费',
  broadband_fee: '宽带费',
  tax_and_surcharge: '税金及附加费',
  profit_rate: '利润率',
  actual_profit_rate: '实际利润率',
  cash_flow_target: '现金流目标',
  net_cash_flow: '经营净现金流',
  payback_period: '投资回收期',
  labor_cost: '人工成本',
  fixed_cost: '固定成本',
  variable_cost: '变动成本',
  project_commission: '项目提成',
  over_production_bonus: '超产值奖金',
  promotion_subsidy: '促销补贴',
  incentive_fee: '激励费用',
  repeat_customer_incentive: '回头客激励',
  masseur_reception_commission: '推拿师接待提成',
  recruitment_fee: '招聘费',
  pre_job_training: '岗前培训',
  masseur_housing_subsidy: '推拿师住房补贴',
  masseur_social_security: '推拿师社保费用',
  uniform_fee: '工作服',
  manager_shift_commission: '客户经理班次提成',
  manager_new_customer_commission: '客户经理新客提成',
  manager_reception_commission: '客户经理接待提成',
  manager_rating_commission: '客户经理评价提成',
  manager_supplies_commission: '客户经理物资提成',
  manager_housing_subsidy: '客户经理住房补贴',
  manager_social_security: '客户经理社保费用',
  hygiene_maintenance: '卫生维护',
  clean_toilet: '打扫厕所',
  clean_room: '打扫房间',
  overtime_subsidy: '加班补贴',
  fixed_rent: '固定租金',
  percentage_rent: '提成租金',
  promotion_fee: '推广费',
  property_fee: '物管费',
  depreciation_fee: '折旧费',
  linen_purchase_fee: '布草采购费',
  offline_ad_fee: '线下广告费',
  online_ad_fee: '线上广告费',
  other_expenses_remark: '其他费用',
  after_sales_cost: '售后费用',
  profit_before_tax: '税前利润',
  income_tax_amount: '所得税金额',
  washing_fee: '布草洗涤费',
  consumables_purchase_fee: '消耗品采购费',
  utilities_fee: '水电费',
  asset_maintenance_fee: '资产维护费',
  linen_washing_fee: '布草洗涤费',
  store_profit: '门店利润',
  other_subsidy: '其他补贴',
  shift_substitution_subsidy: '顶班补贴',
  refund_subsidy: '退单补贴',
  pre_job_training_reward: '岗前培训奖励',
  cleaning_wage_income: '保洁工资收入',
  manager_other_subsidy: '客户经理其他补贴',
  dormitory_rent_cost: '宿舍租金成本',
  external_support_travel_expense: '外部支援差旅费',
  level3_partner_bean_gain: '三级合伙人获豆',
  monitoring_fee: '监控费',
  team_building_fee: '团建费',
  travel_expense: '差旅费',
  masseur_guaranteed_subsidy_bean: '调理师保底补贴豆',
  original_masseur_variance: '推拿师成本差异'
};

const MonthDropdown = ({ months, selectedMonth, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-sm font-medium text-gray-700 flex items-center gap-2 min-w-[130px] justify-between"
      >
        <span>{selectedMonth || '选择月份'}</span>
        <svg className={`w-4 h-4 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 max-h-60 overflow-y-auto bg-gray-100 border border-gray-200 rounded-lg shadow-lg z-50">
          {[...months].sort((a, b) => b.localeCompare(a)).map(m => (
            <button
              key={m}
              onClick={() => {
                onSelect(m);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 hover:bg-gray-200 ${selectedMonth === m ? 'text-[#a40035] font-semibold' : 'text-gray-700'}`}
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const FilterDropdown = ({ options, selected, onSelect, placeholder = '全部' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-sm font-medium text-gray-700 flex items-center gap-2 min-w-[130px] justify-between"
      >
        <span className="truncate max-w-[100px]">{selected || placeholder}</span>
        <svg className={`w-4 h-4 ${open ? 'rotate-180' : ''} flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 max-h-60 overflow-y-auto bg-gray-100 border border-gray-200 rounded-lg shadow-lg z-50">
          <button
            onClick={() => {
              onSelect('全部');
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-2 hover:bg-gray-200 ${selected === '全部' ? 'text-[#a40035] font-semibold' : 'text-gray-700'}`}
          >
            {placeholder}
          </button>
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => {
                onSelect(opt);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 hover:bg-gray-200 ${selected === opt ? 'text-[#a40035] font-semibold' : 'text-gray-700'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const DimensionToggle = ({ dimension, onChange }) => {
  return (
    <div className="flex bg-gray-100 p-1 rounded-lg">
      <button
        onClick={() => onChange('city')}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
          dimension === 'city'
            ? 'bg-white text-[#a40035] shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        城市维度
      </button>
      <button
        onClick={() => onChange('store')}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
          dimension === 'store'
            ? 'bg-white text-[#a40035] shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        门店维度
      </button>
    </div>
  );
};

const StyledFilterDropdown = ({ options, selected, onSelect, placeholder }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1 text-sm font-medium rounded-md bg-white text-[#a40035] shadow-sm flex items-center gap-2 min-w-[100px] justify-between"
      >
        <span className="truncate">{selected === '全部' ? placeholder : selected}</span>
        <svg className={`w-4 h-4 ${open ? 'rotate-180' : ''} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <button
            onClick={() => {
              onSelect('全部');
              setOpen(false);
            }}
            className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${selected === '全部' ? 'text-[#a40035] font-semibold' : 'text-gray-700'}`}
          >
            {placeholder}
          </button>
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => {
                onSelect(opt);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${selected === opt ? 'text-[#a40035] font-semibold' : 'text-gray-700'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const CostStructureContainer = () => {
  const [loading, setLoading] = useState(true);
  const [allRows, setAllRows] = useState([]);
  const [months, setMonths] = useState([]);
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');
  
  const [viewDimension, setViewDimension] = useState('city');
  
  const [selectedCityFilter, setSelectedCityFilter] = useState('全部');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState('全部');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (viewDimension === 'city') {
      setSelectedStoreFilter('全部');
      setSelectedCityFilter('全部'); 
    } else {
      setSelectedStoreFilter('全部');
    }
  }, [viewDimension]);

  useEffect(() => {
    if (viewDimension === 'store') {
      setSelectedStoreFilter('全部');
    }
  }, [selectedCityFilter, viewDimension]);

  const fetchData = async () => {
    try {
      const res = await axios.post('/api/fetch-data', {
        queryKey: 'getProfitStoreDetailMonthly'
      });
      if (res.data && res.data.status === 'success' && Array.isArray(res.data.data)) {
        const rows = res.data.data;
        setAllRows(rows);
        const ms = Array.from(new Set(rows.map(r => r.report_month))).sort((a, b) => a.localeCompare(b));
        setMonths(ms);
        const latest = ms[ms.length - 1] || '';
        setStartMonth(latest);
        setEndMonth(latest);
      } else {
        setError('数据返回失败');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processedData = useMemo(() => {
    if (!allRows.length || !startMonth || !endMonth) return null;

    const start = startMonth <= endMonth ? startMonth : endMonth;
    const end = startMonth <= endMonth ? endMonth : startMonth;

    let filteredRows = allRows.filter(r => {
      const m = r.report_month;
      return m && m >= start && m <= end;
    });

    if (viewDimension === 'city') {
      if (selectedCityFilter !== '全部') {
        filteredRows = filteredRows.filter(r => r.city_name === selectedCityFilter);
      }
    } else {
      if (selectedCityFilter !== '全部') {
        filteredRows = filteredRows.filter(r => r.city_name === selectedCityFilter);
      }
      if (selectedStoreFilter !== '全部') {
        filteredRows = filteredRows.filter(r => r.store_name === selectedStoreFilter);
      }
    }

    if (filteredRows.length === 0) return null;

    const sampleRow = filteredRows[0];
    const allKeys = Object.keys(sampleRow);
    const dimensionKeys = ['report_month', 'store_code', 'city_name', 'store_name', 'opening_date', 'store_operation_stage'];
    const excludedMetricKeys = ['bean_exchange_diff', 'new_store_dinner_party_fee'];
    const metricKeys = allKeys.filter(
      (k) => !dimensionKeys.includes(k) && !excludedMetricKeys.includes(k)
    );

    const groupByKey = viewDimension === 'city' ? 'city_name' : 'store_name';
    const aggregationMap = {};
    
    filteredRows.forEach(row => {
      const key = row[groupByKey] || (viewDimension === 'city' ? '未知城市' : '未知门店');
      
      if (!aggregationMap[key]) {
        aggregationMap[key] = {
          [groupByKey]: key,
          _count: 0
        };
        if (viewDimension === 'store') {
            aggregationMap[key].city_name = row.city_name;
        }
        metricKeys.forEach(k => aggregationMap[key][k] = 0);
      }
      
      aggregationMap[key]._count += 1;
      metricKeys.forEach(k => {
        const val = parseFloat(row[k]);
        if (!isNaN(val)) {
          aggregationMap[key][k] += val;
        }
      });
    });

    const finalRows = Object.values(aggregationMap).map(row => {
      const revenue = row.revenue_actual || row.revenue || 0;
      const netProfit = row.net_profit_actual || row.net_profit || 0;
      
      if (metricKeys.includes('actual_profit_rate')) {
        row.actual_profit_rate = revenue !== 0 ? (netProfit / revenue * 100) : 0;
      }
      
      if (metricKeys.includes('profit_rate')) {
        row.profit_rate = revenue !== 0 ? (netProfit / revenue * 100) : 0;
      }
      
      return row;
    });

    const summaryRow = {
      [groupByKey]: '合计',
      isSummary: true
    };
    metricKeys.forEach(k => summaryRow[k] = 0);
    
    finalRows.forEach(row => {
      metricKeys.forEach(k => {
        if (k !== 'actual_profit_rate' && k !== 'profit_rate') {
             summaryRow[k] += (row[k] || 0);
        }
      });
    });

    const totalRevenue = summaryRow.revenue_actual || summaryRow.revenue || 0;
    const totalNetProfit = summaryRow.net_profit_actual || summaryRow.net_profit || 0;
    
    if (metricKeys.includes('actual_profit_rate')) {
      summaryRow.actual_profit_rate = totalRevenue !== 0 ? (totalNetProfit / totalRevenue * 100) : 0;
    }
    if (metricKeys.includes('profit_rate')) {
        summaryRow.profit_rate = totalRevenue !== 0 ? (totalNetProfit / totalRevenue * 100) : 0;
    }

    finalRows.sort((a, b) => (a[groupByKey] || '').localeCompare(b[groupByKey] || ''));

    return {
      columns: metricKeys,
      data: [...finalRows, summaryRow],
      firstColumnHeader: groupByKey
    };
  }, [allRows, startMonth, endMonth, selectedCityFilter, selectedStoreFilter, viewDimension]);

  const storeOptions = useMemo(() => {
    if (!allRows.length) return [];
    let stores = allRows;
    if (selectedCityFilter !== '全部') {
      stores = stores.filter(r => r.city_name === selectedCityFilter);
    }
    return [...new Set(stores.map(r => r.store_name))].filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [allRows, selectedCityFilter]);

  const cityOptions = useMemo(() => {
     return [...new Set(allRows.map(r => r.city_name))].filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [allRows]);

  const headerGroups = useMemo(() => {
    const cols = processedData?.columns || [];
    const groups = [];
    const processed = new Set();

    const getLabel = (key) => FIELD_LABELS[key] || key;

    cols.forEach(col => {
      if (processed.has(col)) return;

      let baseName = null;
      if (col.endsWith('_budget')) baseName = col.slice(0, -7);
      else if (col.endsWith('_actual')) baseName = col.slice(0, -7);
      else if (col.endsWith('_variance')) baseName = col.slice(0, -9);

      if (baseName) {
        const budgetKey = `${baseName}_budget`;
        const actualKey = `${baseName}_actual`;
        const diffKey = `${baseName}_variance`;

        if (cols.includes(budgetKey) && cols.includes(actualKey) && cols.includes(diffKey)) {
          groups.push({
            title: getLabel(baseName),
            isGroup: true,
            subHeaders: [
              { label: '预算值', key: budgetKey },
              { label: '实际值', key: actualKey },
              { label: '差异值', key: diffKey }
            ]
          });
          processed.add(budgetKey);
          processed.add(actualKey);
          processed.add(diffKey);
        } else {
          groups.push({ title: getLabel(col), isGroup: false, key: col });
          processed.add(col);
        }
      } else {
        groups.push({ title: getLabel(col), isGroup: false, key: col });
        processed.add(col);
      }
    });
    return groups;
  }, [processedData]);

  if (loading) return <div className="p-6 text-center text-gray-500">加载中...</div>;
  if (error) return <div className="p-6 text-center text-red-500">错误: {error}</div>;
  if (!processedData) return <div className="p-6 text-center text-gray-500">暂无数据</div>;

  const { columns, data, firstColumnHeader } = processedData;

  const firstColumnLabel = viewDimension === 'city' ? '城市名称' : '门店名称';

  const formatNumber = (value) => {
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatCellValue = (key, row) => {
    const raw = row[key];
    const num = Number(raw);
    if (raw === undefined || raw === null || isNaN(num)) {
      return '-';
    }

    if (key === 'profit_rate' || key === 'actual_profit_rate') {
      return `${num.toFixed(2)}%`;
    }

    const revenueBudget = Number(row.revenue_budget) || 0;
    const revenueActual = Number(row.revenue_actual) || 0;

    const getBaseInfo = (k) => {
      if (k.endsWith('_budget')) return { base: k.slice(0, -7), type: 'budget' };
      if (k.endsWith('_actual')) return { base: k.slice(0, -7), type: 'actual' };
      if (k.endsWith('_variance')) return { base: k.slice(0, -9), type: 'variance' };
      return { base: null, type: 'single' };
    };

    const { base, type } = getBaseInfo(key);

    if (base) {
      if (base === 'revenue') {
        return formatNumber(num);
      }

      const budgetKey = `${base}_budget`;
      const actualKey = `${base}_actual`;
      const metricBudget = Number(row[budgetKey]) || 0;
      const metricActual = Number(row[actualKey]) || 0;

      let percentText = '';

      if (type === 'budget' && revenueBudget) {
        const ratio = (metricBudget / revenueBudget) * 100;
        percentText = `${ratio.toFixed(2)}%`;
      } else if (type === 'actual' && revenueActual) {
        const ratio = (metricActual / revenueActual) * 100;
        percentText = `${ratio.toFixed(2)}%`;
      } else if (
        type === 'variance' &&
        revenueBudget &&
        revenueActual &&
        metricBudget &&
        metricActual
      ) {
        const budgetRatio = (metricBudget / revenueBudget) * 100;
        const actualRatio = (metricActual / revenueActual) * 100;
        const diffRatio = actualRatio - budgetRatio;
        percentText = `${diffRatio.toFixed(2)}%`;
      }

      const amountText = formatNumber(num);

      if (!percentText) {
        return amountText;
      }

      return (
        <div className="flex flex-col items-end leading-tight">
          <span>{amountText}</span>
          <span className="text-xs text-gray-500 mt-0.5">{percentText}</span>
        </div>
      );
    }

    if (
      key !== 'revenue_actual' &&
      key !== 'revenue_budget' &&
      key !== 'revenue_variance' &&
      revenueActual
    ) {
      const ratio = (num / revenueActual) * 100;
      const amountText = formatNumber(num);
      const percentText = `${ratio.toFixed(2)}%`;

      return (
        <div className="flex flex-col items-end leading-tight">
          <span>{amountText}</span>
          <span className="text-xs text-gray-500 mt-0.5">{percentText}</span>
        </div>
      );
    }

    return formatNumber(num);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 relative">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="w-1 h-5 bg-[#a40035] rounded-full"></span>
          {viewDimension === 'city' ? '城市维度' : '门店维度'}成本结构分析
        </h3>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">起</span>
              <MonthDropdown
                months={months}
                selectedMonth={startMonth}
                onSelect={(m) => {
                  const nextStart = m;
                  const nextEnd = !endMonth || endMonth.localeCompare(nextStart) < 0 ? nextStart : endMonth;
                  setStartMonth(nextStart);
                  setEndMonth(nextEnd);
                }}
              />
            </div>
            <span className="text-sm text-gray-400">-</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">止</span>
              <MonthDropdown
                months={months}
                selectedMonth={endMonth}
                onSelect={(m) => {
                  const nextEnd = m;
                  const nextStart = !startMonth || startMonth.localeCompare(nextEnd) > 0 ? nextEnd : startMonth;
                  setStartMonth(nextStart);
                  setEndMonth(nextEnd);
                }}
              />
            </div>
          </div>
          
          <div className="w-px h-6 bg-gray-200 mx-2 hidden sm:block"></div>
          
          <div className="flex items-center gap-2">
             <DimensionToggle dimension={viewDimension} onChange={setViewDimension} />
             
             {viewDimension === 'store' && (
               <div className="bg-gray-100 p-1 rounded-lg">
                 <StyledFilterDropdown 
                   options={storeOptions} 
                   selected={selectedStoreFilter}
                   onSelect={setSelectedStoreFilter}
                   placeholder="全部门店"
                 />
               </div>
             )}
          </div>
        </div>
      </div>

      <div className={`overflow-x-auto ${viewDimension === 'store' ? 'max-h-[800px] overflow-y-auto' : ''}`}>
        <table className="w-full text-sm text-left text-gray-600 relative">
          <thead className="bg-gray-50 text-xs text-gray-700 uppercase sticky top-0 z-20 shadow-sm">
            <tr>
              <th rowSpan={2} className="px-6 py-4 font-bold sticky left-0 bg-gray-50 z-30 border-r border-gray-300 min-w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                {firstColumnLabel}
              </th>
              {headerGroups.map((group, idx) => (
                <th 
                  key={idx} 
                  colSpan={group.isGroup ? 3 : 1} 
                  rowSpan={group.isGroup ? 1 : 2}
                  className={`px-6 py-4 font-semibold whitespace-nowrap min-w-[140px] text-center border-b border-r border-gray-300 ${group.isGroup ? 'bg-gray-100' : ''}`}
                >
                  {group.title}
                </th>
              ))}
            </tr>
            <tr>
              {headerGroups.map((group, idx) => (
                group.isGroup && group.subHeaders.map((sub, subIdx) => (
                  <th key={`${idx}-${subIdx}`} className="px-6 py-2 font-medium whitespace-nowrap min-w-[100px] text-right bg-gray-50 border-b border-r border-gray-300 text-gray-500">
                    {sub.label}
                  </th>
                ))
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, idx) => (
              <tr 
                key={idx} 
                className={`
                  ${row.isSummary ? 'bg-red-50 font-bold sticky bottom-0 z-20 shadow-inner' : 'hover:bg-gray-50 transition-colors'}
                `}
              >
                <td className={`px-6 py-4 font-medium sticky left-0 z-10 border-r border-gray-300
                  ${row.isSummary ? 'bg-red-50 text-[#a40035]' : 'bg-white text-gray-900'}
                  shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]
                `}>
                  {row[firstColumnHeader]}
                </td>
                {headerGroups.map((group, gIdx) => {
                  if (group.isGroup) {
                    return group.subHeaders.map((sub, sIdx) => {
                      const val = row[sub.key];
                      const isDiff = sub.key.includes('_variance');
                      return (
                        <td key={`${gIdx}-${sIdx}`} className={`px-6 py-4 text-right whitespace-nowrap border-r border-gray-300
                          ${row.isSummary ? 'text-[#a40035]' : ''}
                          ${isDiff && val < 0 ? 'text-red-600' : ''}
                          ${isDiff && val > 0 ? 'text-green-600' : ''}
                        `}>
                          {formatCellValue(sub.key, row)}
                        </td>
                      );
                    });
                  } else {
                    return (
                      <td key={gIdx} className={`px-6 py-4 text-right whitespace-nowrap border-r border-gray-300
                        ${row.isSummary ? 'text-[#a40035]' : ''}
                        ${group.key.includes('_variance') && row[group.key] < 0 ? 'text-red-600' : ''}
                        ${group.key.includes('_variance') && row[group.key] > 0 ? 'text-green-600' : ''}
                      `}>
                        {formatCellValue(group.key, row)}
                      </td>
                    );
                  }
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CostStructureContainer;
