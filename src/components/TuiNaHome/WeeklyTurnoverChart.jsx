import React, { useState } from "react";

const WeeklyTurnoverChart = () => {
  // 定义指标配置
  const METRICS = [
    { key: 'revenue', label: '周度营业额', unit: '元', format: (val) => `¥ ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, axisFormat: (val) => (val / 10000).toFixed(0) + '万' },
    { key: 'ytdRevenue', label: '年度累计营业额', unit: '元', format: (val) => `¥ ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, axisFormat: (val) => (val / 100000000).toFixed(2) + '亿' },
    { key: 'dailyAvgRevenue', label: '天均营业额', unit: '元', format: (val) => `¥ ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, axisFormat: (val) => (val / 10000).toFixed(1) + '万' },
    { key: 'dailyAvgPrice', label: '天均客单价', unit: '元', format: (val) => `¥ ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, axisFormat: (val) => Math.round(val) },
    { key: 'avgServiceDuration', label: '推拿师日均服务时长', unit: '分钟', format: (val) => `${Math.round(val)} 分钟`, axisFormat: (val) => Math.round(val) },
    { key: 'dailyAvgCustomer', label: '天均客次量', unit: '人次', format: (val) => `${val.toLocaleString('en-US', { maximumFractionDigits: 0 })} 人次`, axisFormat: (val) => Math.round(val) },
  ];

  const [selectedMetricKey, setSelectedMetricKey] = useState('revenue');
  const [showTrend, setShowTrend] = useState(true);
  const [showExtremes, setShowExtremes] = useState(true);
  const [showYoY, setShowYoY] = useState(false);

  const currentMetric = METRICS.find(m => m.key === selectedMetricKey);

  // 模拟近12周数据
  // 2025年截至12月15日总营业额 391,063,245.03
  // 12月15日约为第50周结束（实际是第51周开始），粗略按50周计算周均值
  // 周均值 ≈ 391,063,245.03 / 50 ≈ 7,821,265
  const generateData = () => {
    const data = [];
    const baseRevenue = 7821265; // 基准营业额 782万
    
    // 假设最后一周是第51周（12/15 ~ 12/21）
    // 倒推12周，起始周为第40周
    const endWeek = 51;
    const startWeek = endWeek - 11;
    
    // 辅助函数：根据周数计算日期范围（2025年）
    const getWeekDateRange = (weekNum) => {
      const refDate = new Date(2025, 11, 15); // 12月15日
      const diffWeeks = 51 - weekNum;
      
      const monday = new Date(refDate);
      monday.setDate(refDate.getDate() - diffWeeks * 7);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
      return `${fmt(monday)} ～ ${fmt(sunday)}`;
    };

    let cumulativeRevenue = 391063245.03 - (12 * baseRevenue); // 倒推初始累计值
    let cumulativeRevenueLY = (391063245.03 * 0.85) - (12 * baseRevenue * 0.85); // 去年累计初始值 (假设去年同期是85%)

    for (let i = 0; i < 12; i++) {
      const weekNum = startWeek + i;
      // 模拟更明显的波动 +/- 10% 以体现累计营业额的斜率变化
      const fluctuation = (Math.sin(i * 0.8) * 0.08) + (Math.random() - 0.5) * 0.05; 
      const revenue = baseRevenue * (1 + fluctuation);
      
      // 去年同期模拟：趋势保持一致（同向波动），数值整体偏小（约85%），叠加微小随机差异
      // 这里的差异 (Math.random() - 0.5) * 0.02 使得两条线不会完全平行，但趋势高度一致
      const revenueLY = revenue * (0.85 + (Math.random() - 0.5) * 0.02);

      cumulativeRevenue += revenue;
      cumulativeRevenueLY += revenueLY;

      const dailyAvgRevenue = revenue / 7;
      const dailyAvgRevenueLY = revenueLY / 7;

      // 客单价在 170 上下小幅波动
      const dailyAvgPrice = 170 * (1 + (Math.random() - 0.5) * 0.05); 
      // 去年客单价略低，且趋势大致跟随
      const dailyAvgPriceLY = dailyAvgPrice * (0.95 + (Math.random() - 0.5) * 0.02); 

      const dailyAvgCustomer = dailyAvgRevenue / dailyAvgPrice;
      const dailyAvgCustomerLY = dailyAvgRevenueLY / dailyAvgPriceLY;

      // 推拿师日均服务时长 300分钟
      const avgServiceDuration = 300 * (1 + (Math.random() - 0.5) * 0.1);
      // 去年服务时长略低或接近，趋势跟随
      const avgServiceDurationLY = avgServiceDuration * (0.98 + (Math.random() - 0.5) * 0.02);

      data.push({
        weekNum: weekNum,
        weekLabel: `2025 年第 ${weekNum} 周`,
        dateRange: getWeekDateRange(weekNum),
        
        // 本期数据
        revenue: revenue,
        ytdRevenue: cumulativeRevenue,
        dailyAvgRevenue: dailyAvgRevenue,
        dailyAvgCustomer: Math.round(dailyAvgCustomer),
        dailyAvgPrice: dailyAvgPrice,
        avgServiceDuration: Math.round(avgServiceDuration),

        // 去年同期数据 (字段名对应 METRICS 中的 key + 'LastYear')
        revenueLastYear: revenueLY,
        ytdRevenueLastYear: cumulativeRevenueLY,
        dailyAvgRevenueLastYear: dailyAvgRevenueLY,
        dailyAvgCustomerLastYear: Math.round(dailyAvgCustomerLY),
        dailyAvgPriceLastYear: dailyAvgPriceLY,
        avgServiceDurationLastYear: Math.round(avgServiceDurationLY),
      });
    }
    return data;
  };

  const [data] = useState(generateData());
  const [hoverIndex, setHoverIndex] = useState(null);

  // 获取当前选中指标的数据数组
  const currentKey = selectedMetricKey;
  const lastYearKey = `${selectedMetricKey}LastYear`;
  
  const currentDataValues = data.map(d => d[currentKey]);
  const lastYearDataValues = data.map(d => d[lastYearKey]);

  // 图表尺寸配置
  const width = 800;
  const height = 320;
  const padding = { top: 40, right: 40, bottom: 60, left: 45 }; // 优化左边距以平衡视觉协调性与数值显示
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // 计算数据范围 (如果开启同比，需要包含去年的数据)
  let allValues = [...currentDataValues];
  if (showYoY) {
    allValues = [...allValues, ...lastYearDataValues];
  }
  
  const maxVal = Math.max(...allValues) * 1.05; // 增加顶部空间以容纳标记
  const minVal = Math.min(...allValues) * 0.95; // 增加底部空间以容纳标记
  
  // 坐标转换函数
  const getX = (index) => padding.left + (index / (data.length - 1)) * graphWidth;
  const getY = (value) => padding.top + graphHeight - ((value - minVal) / (maxVal - minVal)) * graphHeight;

  // 计算趋势线 (线性回归)
  const calculateTrendLine = () => {
    const n = data.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    data.forEach((d, i) => {
      const val = d[selectedMetricKey];
      sumX += i;
      sumY += val;
      sumXY += i * val;
      sumXX += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return data.map((_, i) => slope * i + intercept);
  };

  const trendValues = calculateTrendLine();
  const trendPathD = trendValues.map((val, i) => 
    `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(val)}`
  ).join(' ');

  // 识别峰值和谷值 (仅针对本期数据)
  let maxIndex = 0;
  let minIndex = 0;
  currentDataValues.forEach((val, i) => {
    if (val > currentDataValues[maxIndex]) maxIndex = i;
    if (val < currentDataValues[minIndex]) minIndex = i;
  });

  // 生成平滑曲线路径 (Catmull-Rom Spline to Cubic Bezier)
  const getSmoothPath = (points) => {
    if (points.length < 2) return "";
    
    // 如果只有两个点，画直线
    if (points.length === 2) {
      return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    }

    const d = [`M ${points[0].x} ${points[0].y}`];

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? i : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2; // 处理最后一个点

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`);
    }

    return d.join(" ");
  };

  // 准备坐标点数据 (本期)
  const points = data.map((d, i) => ({
    x: getX(i),
    y: getY(d[currentKey])
  }));
  const pathD = getSmoothPath(points);

  // 准备坐标点数据 (去年同期)
  const pointsLY = data.map((d, i) => ({
    x: getX(i),
    y: getY(d[lastYearKey])
  }));
  const pathDLY = getSmoothPath(pointsLY);


  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{currentMetric.label}趋势</h3>
        <p className="text-sm text-gray-500">单位：{currentMetric.unit}</p>
      </div>

      {/* 指标选择区域 */}
      <div className="flex flex-wrap gap-2 mb-3">
        {METRICS.map((metric) => (
          <button
            key={metric.key}
            onClick={() => setSelectedMetricKey(metric.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedMetricKey === metric.key
                ? "bg-[#a40035]/10 text-[#a40035]"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {metric.label}
          </button>
        ))}
      </div>

      {/* 图表辅助展示控制区域 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setShowYoY(!showYoY)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
            showYoY
              ? "bg-[#2563eb]/10 text-[#2563eb] border-[#2563eb]"
              : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100"
          }`}
        >
          显示同比
        </button>
        <button
          onClick={() => setShowTrend(!showTrend)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
            showTrend
              ? "bg-[#a40035]/10 text-[#a40035] border-[#a40035]"
              : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100"
          }`}
        >
          显示均线
        </button>
        <button
          onClick={() => setShowExtremes(!showExtremes)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
            showExtremes
              ? "bg-[#a40035]/10 text-[#a40035] border-[#a40035]"
              : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100"
          }`}
        >
          显示极值
        </button>
      </div>
      
      <div className="w-full overflow-x-auto">
        <div style={{ minWidth: '800px' }}>
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* 坐标轴 */}
            <line 
              x1={padding.left} y1={padding.top} 
              x2={padding.left} y2={height - padding.bottom} 
              stroke="#e5e7eb" strokeWidth="1"
            />
            <line 
              x1={padding.left} y1={height - padding.bottom} 
              x2={width - padding.right} y2={height - padding.bottom} 
              stroke="#e5e7eb" strokeWidth="1"
            />

            {/* Y轴刻度 */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const val = minVal + (maxVal - minVal) * ratio;
              const y = getY(val);
              return (
                <g key={ratio}>
                  <line 
                    x1={padding.left} y1={y} 
                    x2={width - padding.right} y2={y} 
                    stroke="#f3f4f6" strokeDasharray="4 4"
                  />
                  <text 
                    x={padding.left - 10} y={y} 
                    dy="4" textAnchor="end" 
                    fontSize="12" fill="#9ca3af"
                  >
                    {currentMetric.axisFormat(val)}
                  </text>
                </g>
              );
            })}

            {/* X轴刻度 (只显示部分，避免拥挤) */}
            {data.map((d, i) => (
              <text 
                key={i}
                x={getX(i)} y={height - padding.bottom + 25} 
                textAnchor="middle" fontSize="11" fill="#6b7280"
                transform={`rotate(0, ${getX(i)}, ${height - padding.bottom + 25})`}
              >
                {d.weekNum}周
              </text>
            ))}

            {/* 趋势线 (虚线) */}
            {showTrend && (
              <path 
                d={trendPathD} 
                fill="none" 
                stroke="#9ca3af" 
                strokeWidth="2"
                strokeDasharray="6 4"
                opacity="0.6"
                pointerEvents="none" 
              />
            )}

            {/* 去年同期折线 (蓝色) */}
            {showYoY && (
              <path 
                d={pathDLY} 
                fill="none" 
                stroke="#2563eb" 
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="4 2" // 使用虚线或实线均可，这里用短划线区分
                pointerEvents="none" 
                opacity="0.7"
              />
            )}

            {/* 实际数据折线 (本期 - 主题色) */}
            <path 
              d={pathD} 
              fill="none" 
              stroke="#a40035" 
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none" 
            />

            {/* 所有数据点 (常驻显示 - 本期) */}
            {data.map((d, i) => (
              <circle 
                key={`curr-${i}`}
                cx={getX(i)} cy={getY(d[currentKey])} 
                r={4} 
                fill="white" stroke="#a40035" strokeWidth="2"
              />
            ))}

            {/* 峰值标记 (仅本期) */}
            {showExtremes && (
              <g pointerEvents="none">
                {/* 圆形背景 */}
                <circle 
                  cx={getX(maxIndex)} cy={getY(currentDataValues[maxIndex])} 
                  r={10} 
                  fill="#a40035" 
                  stroke="white" strokeWidth="2"
                />
                {/* 文字 "峰" */}
                <text 
                  x={getX(maxIndex)} y={getY(currentDataValues[maxIndex])} 
                  dy="3" textAnchor="middle" 
                  fill="white" fontSize="10" fontWeight="bold"
                >
                  峰
                </text>
                {/* 营业额数值 (上方) */}
                <text 
                  x={getX(maxIndex)} y={getY(currentDataValues[maxIndex]) - 15} 
                  textAnchor="middle" 
                  fill="#a40035" fontSize="11" fontWeight="bold"
                >
                  {currentMetric.format(currentDataValues[maxIndex])}
                </text>
              </g>
            )}

            {/* 谷值标记 (仅本期) */}
            {showExtremes && (
              <g pointerEvents="none">
                {/* 圆形背景 */}
                <circle 
                  cx={getX(minIndex)} cy={getY(currentDataValues[minIndex])} 
                  r={10} 
                  fill="#a40035" 
                  stroke="white" strokeWidth="2"
                />
                {/* 文字 "谷" */}
                <text 
                  x={getX(minIndex)} y={getY(currentDataValues[minIndex])} 
                  dy="3" textAnchor="middle" 
                  fill="white" fontSize="10" fontWeight="bold"
                >
                  谷
                </text>
                {/* 营业额数值 (下方) */}
                <text 
                  x={getX(minIndex)} y={getY(currentDataValues[minIndex]) + 22} 
                  textAnchor="middle" 
                  fill="#a40035" fontSize="11" fontWeight="bold"
                >
                  {currentMetric.format(currentDataValues[minIndex])}
                </text>
              </g>
            )}

            {/* 全图表交互区域 (鼠标移动监听) */}
            <rect
              x={padding.left}
              y={padding.top}
              width={graphWidth}
              height={graphHeight}
              fill="transparent"
              onMouseMove={(e) => {
                const rect = e.target.getBoundingClientRect();
                const x = e.clientX - rect.left; // 鼠标在绘图区内的相对x坐标
                const step = graphWidth / (data.length - 1);
                // 计算最近的数据点索引
                let index = Math.round(x / step);
                if (index < 0) index = 0;
                if (index >= data.length) index = data.length - 1;
                setHoverIndex(index);
              }}
              onMouseLeave={() => setHoverIndex(null)}
            />

            {/* 垂直参考线 */}
            {hoverIndex !== null && (
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={height - padding.bottom}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="4 4"
                pointerEvents="none"
              />
            )}

            {/* Hover 状态的高亮数据点 (本期) */}
            {hoverIndex !== null && (
              <circle 
                cx={getX(hoverIndex)} cy={getY(currentDataValues[hoverIndex])} 
                r={6} 
                fill="white" stroke="#a40035" strokeWidth="2"
                pointerEvents="none"
              />
            )}
            
            {/* Hover 状态的高亮数据点 (去年同期) */}
            {hoverIndex !== null && showYoY && (
              <circle 
                cx={getX(hoverIndex)} cy={getY(lastYearDataValues[hoverIndex])} 
                r={4} 
                fill="white" stroke="#2563eb" strokeWidth="2"
                pointerEvents="none"
              />
            )}

            {/* Tooltip - 放在最后以确保在最上层 */}
            {hoverIndex !== null && (
              <g pointerEvents="none">
                {/* 计算 tooltip 位置，防止溢出 */}
                {(() => {
                  const d = data[hoverIndex];
                  const val = d[currentKey];
                  const valLY = d[lastYearKey];
                  
                  // 计算同比
                  let yoyStr = "";
                  let yoyColor = "#374151";
                  if (showYoY && valLY !== 0) {
                    const yoy = (val - valLY) / valLY;
                    const sign = yoy > 0 ? "+" : "";
                    yoyStr = `${sign}${(yoy * 100).toFixed(2)}%`;
                    yoyColor = yoy > 0 ? "#ef4444" : "#10b981"; // 红涨绿跌
                  }

                  // 估算宽度
                  const measureText = (str) => {
                    let w = 0;
                    for (let char of str) {
                      w += char.charCodeAt(0) > 255 ? 14 : 8.5;
                    }
                    return w;
                  };

                  const titleW = measureText(`周数：${d.weekLabel}`);
                  const dateW = measureText(`日期范围：${d.dateRange}`);
                  const curW = measureText(`${currentMetric.label}：${currentMetric.format(val)}`);
                  const lastW = showYoY ? measureText(`去年同期：${currentMetric.format(valLY)}`) : 0;
                  const yoyW = showYoY ? measureText(`同比：${yoyStr}`) : 0;

                  const maxContentW = Math.max(titleW, dateW, curW, lastW, yoyW);
                  const boxWidth = Math.max(220, maxContentW + 40); 
                  const boxHeight = showYoY ? 145 : 100;

                  const x = getX(hoverIndex);
                  const y = getY(val); // 以本期数据点为基准定位
                  
                  // 边界检测
                  let tx = x - boxWidth / 2;
                  if (tx < 10) tx = 10;
                  if (tx + boxWidth > width - 10) tx = width - boxWidth - 10;
                  
                  // 尽量显示在上方，如果上方空间不足则显示在下方
                  let ty = y - boxHeight - 15;
                  let isTop = true;
                  if (ty < 10) {
                    ty = y + 25;
                    isTop = false;
                  }

                  return (
                    <g transform={`translate(${tx}, ${ty})`}>
                      <rect 
                        width={boxWidth} height={boxHeight} rx="6" 
                        fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1"
                        filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
                      />
                      <g transform="translate(15, 25)">
                        <text fill="#374151" fontSize="13" fontWeight="bold">
                          周数：{d.weekLabel}
                        </text>
                        <text y="24" fill="#6b7280" fontSize="12">
                          日期范围：{d.dateRange}
                        </text>
                        <text y="48" fill="#6b7280" fontSize="12">
                          {currentMetric.label}：<tspan fill="#a40035" fontWeight="bold">{currentMetric.format(val)}</tspan>
                        </text>
                        {showYoY && (
                          <>
                            <text y="72" fill="#6b7280" fontSize="12">
                              去年同期：<tspan fill="#2563eb" fontWeight="bold">{currentMetric.format(valLY)}</tspan>
                            </text>
                            <text y="96" fill="#6b7280" fontSize="12">
                              同比：<tspan fill={yoyColor} fontWeight="bold">{yoyStr}</tspan>
                            </text>
                          </>
                        )}
                      </g>
                      {/* 小三角 */}
                      {isTop ? (
                        <path 
                          d={`M ${boxWidth/2 - 6} ${boxHeight} l 6 6 l 6 -6 z`} 
                          fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1"
                          transform={`translate(${x - tx - boxWidth/2}, 0)`}
                        />
                      ) : (
                        <path 
                          d={`M ${boxWidth/2 - 6} 0 l 6 -6 l 6 6 z`} 
                          fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1"
                          transform={`translate(${x - tx - boxWidth/2}, 0)`}
                        />
                      )}
                      {/* 遮盖小三角的描边，使其与矩形融合 */}
                      {isTop ? (
                        <path 
                          d={`M ${boxWidth/2 - 5} ${boxHeight-1} l 10 0`} 
                          stroke="#f3f4f6" strokeWidth="2"
                          transform={`translate(${x - tx - boxWidth/2}, 0)`}
                        />
                      ) : (
                        <path 
                          d={`M ${boxWidth/2 - 5} 1 l 10 0`} 
                          stroke="#f3f4f6" strokeWidth="2"
                          transform={`translate(${x - tx - boxWidth/2}, 0)`}
                        />
                      )}
                    </g>
                  );
                })()}
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default WeeklyTurnoverChart;
