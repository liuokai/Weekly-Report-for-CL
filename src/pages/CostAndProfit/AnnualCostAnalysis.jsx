import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import costMapping from '../../config/costMapping';

// Theme Colors Palette (Based on #a40035)
// Generating a monochromatic scale + some variations for distinctness
const THEME_COLORS = [
  '#a40035', // Primary Brand Color
  '#be3b5d', // Lighter
  '#d66584', // Even Lighter
  '#ea8eab', // Pale
  '#f8b8d0', // Very Pale
  '#8a0026', // Darker
  '#630018', // Very Dark
  '#c94c6e', // Variation
  '#e07a96', // Variation
  '#520012', // Deepest
];

const AnnualCostAnalysis = ({ data }) => {
  const [activeCategory, setActiveCategory] = useState(null);

  const costData = useMemo(() => {
    if (!data) return [];

    const totalRevenue = Number(data.total_revenue) || 1; // Avoid division by zero

    const result = costMapping.categories.map(category => {
      let value = 0;
      let details = [];

      if (category.columns) {
        // Direct columns
        category.columns.forEach(col => {
          const val = Number(data[col]) || 0;
          value += val;
          details.push({ name: costMapping.fieldLabels[col] || col, value: val, key: col });
        });
      } else if (category.subCategories) {
        // Subcategories
        category.subCategories.forEach(sub => {
          let subValue = 0;
          let subDetails = [];
          sub.columns.forEach(col => {
            const val = Number(data[col]) || 0;
            subValue += val;
            subDetails.push({ name: costMapping.fieldLabels[col] || col, value: val, key: col });
          });
          value += subValue;
          details.push({ name: sub.name, value: subValue, subDetails, isSubCategory: true });
        });
      }

      return {
        name: category.name,
        value,
        details,
        percentage: (value / totalRevenue * 100).toFixed(2)
      };
    }).filter(item => item.value > 0);

    return result;
  }, [data]);

  // Data for the Pie Chart
  const pieData = costData.map(item => ({
    name: item.name,
    value: item.value,
    percentage: item.percentage
  }));

  // Data preparation for Stacked Bar Chart
  const barChartData = useMemo(() => {
    let chartData;
    
    if (activeCategory) {
      // If a category is selected, show its details as X-axis items
      // If details have sub-details, stack them. Otherwise, just one bar.
      chartData = activeCategory.details.map(detail => {
        const item = { name: detail.name };
        if (detail.subDetails) {
           detail.subDetails.forEach(sub => {
             item[sub.name] = sub.value;
           });
        } else {
           item[detail.name] = detail.value; // Stack key is itself
        }
        return item;
      });
    } else {
      // If no category selected, X-axis are the Categories (e.g., Labor, Rent)
      // Stack key are the details (e.g., Masseur Commission, Rent Fee)
      chartData = costData.map(cat => {
        const item = { name: cat.name };
        cat.details.forEach(detail => {
          item[detail.name] = detail.value;
        });
        return item;
      });
    }
    
    // 按每个柱子的总金额从大到小排序
    return chartData.sort((a, b) => {
      const sumA = Object.keys(a).reduce((sum, key) => key !== 'name' ? sum + (a[key] || 0) : sum, 0);
      const sumB = Object.keys(b).reduce((sum, key) => key !== 'name' ? sum + (b[key] || 0) : sum, 0);
      return sumB - sumA;
    });
  }, [costData, activeCategory]);

  // Extract all possible keys for stacking to generate <Bar> components
  const stackKeys = useMemo(() => {
    const keys = new Set();
    barChartData.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'name') keys.add(key);
      });
    });
    return Array.from(keys);
  }, [barChartData]);

  const activeCategoryName = activeCategory ? activeCategory.name : '全部成本构成';

  const formatCurrency = (val) => val.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 });

  // --- Header Metrics Calculation ---
  const headerMetrics = useMemo(() => {
    if (!data) return [];
    
    const totalRevenue = Number(data.total_revenue) || 1; // Avoid division by zero

    // 直接从 SQL 字段获取数据
    const serviceFee = Number(data.service_fee) || 0;
    const laborCost = Number(data.labor_cost) || 0;
    const fixedCost = Number(data.fixed_cost) || 0;
    const variableCost = Number(data.variable_cost) || 0;
    const incomeTax = Number(data.income_tax) || 0;
    
    const annualCost = serviceFee + laborCost + fixedCost + variableCost + incomeTax;

    const calcPercent = (val, base) => ((val / base) * 100).toFixed(2) + '%';

    return [
      { 
        label: '当年成本', 
        value: annualCost, 
        percentage: calcPercent(annualCost, totalRevenue),
        isTotal: true 
      },
      { 
        label: '服务费', 
        value: serviceFee,
        percentage: annualCost ? calcPercent(serviceFee, annualCost) : '0.0%'
      },
      { 
        label: '人工成本', 
        value: laborCost,
        percentage: annualCost ? calcPercent(laborCost, annualCost) : '0.0%'
      },
      { 
        label: '固定成本', 
        value: fixedCost,
        percentage: annualCost ? calcPercent(fixedCost, annualCost) : '0.0%'
      },
      { 
        label: '变动成本', 
        value: variableCost,
        percentage: annualCost ? calcPercent(variableCost, annualCost) : '0.0%'
      },
      { 
        label: '所得税金额', 
        value: incomeTax,
        percentage: annualCost ? calcPercent(incomeTax, annualCost) : '0.0%'
      },
    ];
  }, [data]);

  // Custom Tooltip for Pie Chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { name, value, percentage } = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-lg">
          <p className="font-bold text-gray-800 mb-1">{name}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">金额：<span className="font-medium text-gray-900">{formatCurrency(value)}</span></p>
            <p className="text-gray-600">营收占比：<span className="font-medium text-[#a40035]">{percentage}%</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Bar Chart (Responsive & Optimized)
  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);
      const totalRevenue = Number(data.total_revenue) || 1;
      
      return (
        <div className="bg-white p-2 sm:p-3 border border-gray-100 shadow-xl rounded-lg w-[240px] sm:min-w-[280px] sm:max-w-[320px] text-xs z-50 relative">
          <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-1">
            <span className="font-bold text-gray-800 truncate max-w-[120px] sm:max-w-[180px]" title={label}>{label}</span>
            <span className="text-gray-400 scale-90 origin-right hidden sm:inline">按金额排序</span>
          </div>
          
          {/* Header Row - Compact */}
          <div className="flex justify-between text-gray-500 mb-1 px-1">
            <span className="text-xs">成本项</span>
            <div className="flex gap-2 sm:gap-3">
               <span className="w-12 sm:w-16 text-right text-xs">金额</span>
               <span className="w-8 sm:w-12 text-right text-xs">占比</span>
            </div>
          </div>

          <div className="space-y-1 px-1">
            {payload.sort((a,b) => b.value - a.value).map((entry, index) => (
              <div key={index} className="flex justify-between items-center hover:bg-gray-50 p-0.5 rounded transition-colors">
                <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
                  <div className="w-2 h-2 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: entry.color }} />
                  <span className="text-gray-700 truncate text-xs" title={entry.name}>{entry.name}</span>
                </div>
                <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                   <div className="w-12 sm:w-16 text-right font-medium text-gray-900 text-xs">
                      {entry.value >= 10000 ? `${(entry.value / 10000).toFixed(1)}万` : formatCurrency(entry.value)}
                   </div>
                   <div className="w-8 sm:w-12 text-right text-gray-500 text-xs">
                      {(entry.value / totalRevenue * 100).toFixed(1)}%
                   </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between items-center font-bold text-gray-800 px-1">
            <span className="text-xs">合计</span>
            <div className="flex gap-2 sm:gap-3">
                <span className="w-12 sm:w-16 text-right text-[#a40035] text-xs">
                  {total >= 10000 ? `${(total / 10000).toFixed(1)}万` : formatCurrency(total)}
                </span>
                <span className="w-8 sm:w-12 text-right text-[#a40035] text-xs">{(total / totalRevenue * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-[#a40035] pl-3">门店年度成本结构分析</h3>
      
      {/* Header Metrics Section */}
      <div className="grid grid-cols-6 gap-4 mb-8 bg-gray-50 rounded-lg p-4 border border-gray-100">
        {headerMetrics.map((metric, index) => (
          <div key={index} className={`flex flex-col items-center justify-center ${index !== headerMetrics.length - 1 ? 'border-r border-gray-200' : ''}`}>
             <span className="text-sm text-gray-500 mb-1">{metric.label}</span>
             <span className={`text-xl font-bold ${metric.isTotal ? 'text-[#a40035]' : 'text-gray-800'}`}>
               {formatCurrency(metric.value)}
             </span>
             <span className="text-xs text-gray-400 mt-1">
               {metric.isTotal ? '营收占比: ' : '成本占比: '}{metric.percentage}
             </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Pie Chart */}
        <div className="flex flex-col border-r border-gray-100 pr-4 relative">
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="70%"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  onClick={(data) => {
                    const category = costData.find(c => c.name === data.name);
                    setActiveCategory(category === activeCategory ? null : category);
                  }}
                  cursor="pointer"
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={THEME_COLORS[index % THEME_COLORS.length]} 
                      stroke={activeCategory?.name === entry.name ? '#000' : 'none'}
                      strokeWidth={activeCategory?.name === entry.name ? 2 : 0}
                      opacity={activeCategory && activeCategory.name !== entry.name ? 0.6 : 1}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ width: '100%' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Stacked Bar Chart */}
        <div className="flex flex-col pl-4 h-[360px]">
           <div className="flex justify-end mb-2 h-6">
               {activeCategory && (
                 <button 
                   onClick={() => setActiveCategory(null)}
                   className="text-xs text-[#a40035] hover:text-[#8a1c46] underline"
                 >
                   返回总览
                 </button>
               )}
           </div>
           
           <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartData}
                  margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 12}} />
                  <YAxis 
                    tickFormatter={(value) => `${(value / 10000).toFixed(0)}万`}
                    width={60}
                    tick={{fontSize: 12}}
                  />
                  <Tooltip 
                    content={<CustomBarTooltip />}
                    cursor={{fill: 'rgba(0,0,0,0.05)'}}
                  />
                  {/* Stacked Bars with Theme Colors */}
                  {stackKeys.map((key, index) => (
                    <Bar 
                      key={key} 
                      dataKey={key} 
                      stackId="a" 
                      fill={THEME_COLORS[(index + 1) % THEME_COLORS.length]} 
                      maxBarSize={60}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AnnualCostAnalysis;