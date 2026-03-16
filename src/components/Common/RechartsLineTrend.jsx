import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Dot
} from 'recharts';

const RechartsLineTrend = ({
  data = [],
  showYoY = false,
  showTrend = false,
  showExtremes = false,
  yAxisFormatter,
  valueFormatter,
  yAxisMin,
  yAxisMax,
  colorPrimary = "#a40035",
  colorYoY = "#2563eb",
  height = 320,
  targetValue = null,   // 目标虚线值
  targetLabel = "目标", // 目标虚线标签
  targetColor = "#9ca3af" // 目标虚线颜色（默认灰色）
}) => {
  // 计算合适的 Y 轴刻度范围
  const calculateYAxisDomain = React.useMemo(() => {
    if (data.length === 0) return ['auto', 'auto'];

    // 收集所有数值
    const allValues = [];
    data.forEach(item => {
      if (item.value != null) allValues.push(item.value);
      if (showYoY && item.valueLastYear != null) allValues.push(item.valueLastYear);
    });
    // 将目标值纳入范围计算
    if (targetValue != null) allValues.push(Number(targetValue));

    if (allValues.length === 0) return ['auto', 'auto'];

    // 使用传入的 min/max 或数据的 min/max
    let dataMin = yAxisMin !== undefined && yAxisMin !== null ? yAxisMin : Math.min(...allValues);
    let dataMax = yAxisMax !== undefined && yAxisMax !== null ? yAxisMax : Math.max(...allValues);

    // 计算数量级（例如：120万 -> 100万，1120万 -> 100万）
    const range = dataMax - dataMin;
    let step;
    
    if (range === 0) {
      // 如果所有值相同，使用该值的 20% 作为范围
      const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(dataMax) || 1)));
      step = magnitude;
    } else {
      // 根据范围计算合适的步长
      const magnitude = Math.pow(10, Math.floor(Math.log10(range)));
      const normalized = range / magnitude;
      
      // 选择合适的步长倍数
      if (normalized <= 1) step = magnitude * 0.2;
      else if (normalized <= 2) step = magnitude * 0.5;
      else if (normalized <= 5) step = magnitude;
      else step = magnitude * 2;
    }

    // 向下取整到步长的整数倍
    const min = Math.floor(dataMin / step) * step;
    // 向上取整到步长的整数倍
    const max = Math.ceil(dataMax / step) * step;

    return [min, max];
  }, [data, showYoY, yAxisMin, yAxisMax]);

  // 计算 Y 轴刻度
  const yAxisTicks = React.useMemo(() => {
    const [min, max] = calculateYAxisDomain;
    if (min === 'auto' || max === 'auto') return undefined;

    const range = max - min;
    if (range === 0) return [min];

    // 计算合适的刻度数量（5-8个刻度比较合适）
    const magnitude = Math.pow(10, Math.floor(Math.log10(range)));
    const normalized = range / magnitude;
    
    let tickStep;
    if (normalized <= 1) tickStep = magnitude * 0.2;
    else if (normalized <= 2) tickStep = magnitude * 0.5;
    else if (normalized <= 5) tickStep = magnitude;
    else tickStep = magnitude * 2;

    const ticks = [];
    for (let i = min; i <= max; i += tickStep) {
      ticks.push(Math.round(i * 100) / 100); // 避免浮点数精度问题
    }
    
    return ticks;
  }, [calculateYAxisDomain]);

  // 1. 计算趋势线并整合到主数据中
  const chartData = React.useMemo(() => {
    if (!showTrend || data.length < 2) return data;
    
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    data.forEach((d, i) => {
      sumX += i;
      sumY += d.value;
      sumXY += i * d.value;
      sumXX += i * i;
    });
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return data.map((item, i) => ({
      ...item,
      trend: slope * i + intercept
    }));
  }, [data, showTrend]);

  // 2. 查找极值点
  const extremes = React.useMemo(() => {
    if (!showExtremes || data.length === 0) return { max: null, min: null };
    let maxIdx = 0, minIdx = 0;
    data.forEach((d, i) => {
      if (d.value > data[maxIdx].value) maxIdx = i;
      if (d.value < data[minIdx].value) minIdx = i;
    });
    return { max: maxIdx, min: minIdx };
  }, [data, showExtremes]);

  // 自定义点渲染逻辑，用于显示极值
  const renderDot = (props) => {
    const { cx, cy, payload, index, dataMax } = props;
    if (!showExtremes) return <Dot {...props} />;

    const isMax = index === extremes.max;
    const isMin = index === extremes.min;

    if (isMax || isMin) {
      const value = payload.value;
      const formattedValue = valueFormatter ? valueFormatter(value) : value;
      
      // 策略：根据点在 X 轴的位置动态调整文字锚点，防止超出左右边界
      let textAnchor = "middle";
      let xOffset = 0;
      if (index <= 2) {
        textAnchor = "start";
        xOffset = -10; // 向左微调一点点，使 Icon 也不要太贴边
      } else if (index >= data.length - 3) {
        textAnchor = "end";
        xOffset = 10;
      }

      // 策略：Icon 圆心与数据节点重合
      const iconX = cx;
      const iconY = cy;
      
      // 数值显示位置：峰值显示在 Icon 上方，谷值显示在 Icon 下方
      const textY = isMax ? cy - 20 : cy + 30;

      return (
        <g key={`dot-${index}`}>
          {/* 1. 极值 Icon: 主题色填充的圆形，圆心即为数据节点 */}
          <circle cx={iconX} cy={iconY} r={10} fill={colorPrimary} stroke="white" strokeWidth={2} />
          <text 
            x={iconX} 
            y={iconY + 4} 
            textAnchor="middle" 
            fill="white" 
            fontSize="11" 
            fontWeight="bold"
          >
            {isMax ? '峰' : '谷'}
          </text>

          {/* 2. 数值显示（带背景描边） */}
          <text 
            x={cx + xOffset} 
            y={textY} 
            textAnchor={textAnchor} 
            fill="white" 
            fontSize="12" 
            fontWeight="bold"
            stroke="white"
            strokeWidth={4}
            strokeLinejoin="round"
          >
            {formattedValue}
          </text>
          <text 
            x={cx + xOffset} 
            y={textY} 
            textAnchor={textAnchor} 
            fill={colorPrimary} 
            fontSize="12" 
            fontWeight="bold"
          >
            {formattedValue}
          </text>
        </g>
      );
    }
    return <Dot {...props} />;
  };

  // Custom tooltip to match the previous style
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-md text-sm">
          <p className="font-bold mb-1">{item.fullWeekLabel}</p>
          <p className="text-gray-600 mb-1">日期范围：{item.dateRange || '--'}</p>
          {item.activeDays && (
            <p className="text-gray-600 mb-1 text-xs">营业天数：{item.activeDays}天</p>
          )}
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p style={{ color: colorPrimary }}>
              当前：{valueFormatter ? valueFormatter(item.value) : item.value}
            </p>
            {showYoY && (
              <p style={{ color: colorYoY }} className="mt-1">
                去年同期：{valueFormatter ? valueFormatter(item.valueLastYear) : item.valueLastYear}
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 60, right: 60, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis 
            dataKey="weekLabel" 
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            dy={10}
          />
          <YAxis 
            domain={calculateYAxisDomain}
            ticks={yAxisTicks}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            tickFormatter={yAxisFormatter}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* 目标虚线 */}
          {targetValue != null && (
            <ReferenceLine
              y={Number(targetValue)}
              stroke={targetColor}
              strokeWidth={1.5}
              strokeDasharray="8 4"
              label={{ value: targetLabel, position: 'insideTopRight', fontSize: 11, fill: targetColor, fontWeight: 'bold' }}
            />
          )}

          {showTrend && (
            <Line
              type="monotone"
              dataKey="trend"
              stroke="#9ca3af"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              activeDot={false}
              legendType="none"
              isAnimationActive={false}
              connectNulls
            />
          )}

          {showYoY && (
            <Line
              type="monotone"
              dataKey="valueLastYear"
              stroke={colorYoY}
              strokeWidth={2}
              dot={{ r: 4, fill: 'white', stroke: colorYoY, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
              name="去年同期"
            />
          )}
          
          <Line
            type="monotone"
            dataKey="value"
            stroke={colorPrimary}
            strokeWidth={2}
            dot={renderDot}
            activeDot={{ r: 6 }}
            name="当前"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RechartsLineTrend;
