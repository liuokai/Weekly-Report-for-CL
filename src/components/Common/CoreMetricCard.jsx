import React, { useRef, useEffect, useState } from "react";

/**
 * 核心指标卡片组件
 * @param {Object} props
 * @param {string} props.label - 指标名称
 * @param {number|string} props.value - 指标值（原始数值）
 * @param {string} props.unit - 单位
 * @param {number|string|null} props.target - 目标值（原始数值，null表示无目标）
 * @param {number|string|null} props.progress - 进度值（原始数值，用于计算百分比）
 * @param {number|string|null} props.yoy - 同比值（原始数值，如 "+8.3" 表示 +8.3%）
 * @param {number|string|null} props.mom - 环比值（原始数值，如 "+2.1" 表示 +2.1%）
 */
const CoreMetricCard = ({
  label,
  value,
  unit,
  target,
  progress,
  yoy,
  mom,
}) => {
  const cardRef = useRef(null);
  const [minWidth, setMinWidth] = useState(null);
  const heightRef = useRef(0);

  // 动态设置最小宽度等于高度
  useEffect(() => {
    const updateMinWidth = () => {
      if (cardRef.current) {
        const height = cardRef.current.offsetHeight;
        // 只在高度真正变化时才更新，避免不必要的重渲染
        if (height !== heightRef.current && height > 0) {
          heightRef.current = height;
          // 使用 requestAnimationFrame 确保在下一帧更新，避免布局抖动
          requestAnimationFrame(() => {
            setMinWidth(height);
          });
        }
      }
    };

    // 延迟初始设置，确保 DOM 已渲染
    const timer = setTimeout(() => {
      updateMinWidth();
    }, 0);

    // 使用 ResizeObserver 监听高度变化
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        if (height !== heightRef.current && height > 0) {
          heightRef.current = height;
          requestAnimationFrame(() => {
            setMinWidth(height);
          });
        }
      }
    });

    if (cardRef.current) {
      resizeObserver.observe(cardRef.current);
    }

    // 清理
    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [label, value, unit, target, progress, yoy, mom]);
  // 格式化数值显示（保留千分位）
  const formatValue = (val) => {
    if (val === null || val === undefined || val === "—") return "—";
    if (typeof val === "string") {
      // 如果已经是格式化字符串，直接返回
      if (val.includes(",") || val === "—") return val;
      // 尝试转换为数字
      const num = parseFloat(val);
      if (isNaN(num)) return val;
      // 判断是否为整数，整数不显示小数位
      if (Number.isInteger(num)) {
        return num.toLocaleString("zh-CN");
      }
      return num.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
    }
    // 判断是否为整数，整数不显示小数位
    if (Number.isInteger(val)) {
      return val.toLocaleString("zh-CN");
    }
    return val.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  };

  // 计算进度百分比（1位小数）
  const calculateProgress = () => {
    if (target === null || target === undefined || target === "—") return null;
    if (progress === null || progress === undefined || progress === "—") return null;
    
    const targetNum = typeof target === "string" ? parseFloat(target.replace(/,/g, "")) : target;
    const progressNum = typeof progress === "string" ? parseFloat(progress.replace(/,/g, "")) : progress;
    
    if (isNaN(targetNum) || isNaN(progressNum) || targetNum === 0) return null;
    
    const percent = (progressNum / targetNum) * 100;
    return percent.toFixed(1) + "%";
  };

  const calculateCompletionRate = () => {
    if (target === null || target === undefined || target === "—") return null;
    if (value === null || value === undefined || value === "—") return null;
    const targetNum = typeof target === "string" ? parseFloat(target.replace(/,/g, "")) : target;
    const valueNum = typeof value === "string" ? parseFloat(String(value).replace(/,/g, "")) : value;
    if (isNaN(targetNum) || isNaN(valueNum) || targetNum === 0) return null;
    const percent = (valueNum / targetNum) * 100;
    return percent.toFixed(1) + "%";
  };
  // 判断数值颜色（超过目标/基准为红色，小于为绿色）
  const getValueColor = (currentVal, compareVal, isPositive = true) => {
    if (compareVal === null || compareVal === undefined || compareVal === "—") return "text-gray-600";
    
    const current = typeof currentVal === "string" 
      ? parseFloat(currentVal.replace(/[+%pct,]/g, "")) 
      : currentVal;
    const compare = typeof compareVal === "string" 
      ? parseFloat(compareVal.replace(/[+%pct,]/g, "")) 
      : compareVal;
    
    if (isNaN(current) || isNaN(compare)) return "text-gray-600";
    
    // 对于进度值：超过100%为红色，小于100%为绿色
    // 对于同比/环比：超过基准（正数）为红色，小于基准（负数）为绿色
    if (isPositive) {
      return current >= compare ? "text-red-600" : "text-green-600";
    } else {
      return current <= compare ? "text-red-600" : "text-green-600";
    }
  };

  // 格式化同比/环比显示
  const formatComparison = (val) => {
    if (val === null || val === undefined || val === "—") return "—";
    if (typeof val === "string") {
      // 如果已经包含符号，直接返回
      if (val.includes("+") || val.includes("-")) return val;
      const num = parseFloat(val);
      if (isNaN(num)) return val;
      return num >= 0 ? `+${num.toFixed(1)}%` : `${num.toFixed(1)}%`;
    }
    return val >= 0 ? `+${val.toFixed(1)}%` : `${val.toFixed(1)}%`;
  };

  const progressPercent = calculateProgress();
  const completionRatePercent = calculateCompletionRate();
  const formattedTarget = formatValue(target);
  const formattedYoy = formatComparison(yoy);
  const formattedMom = formatComparison(mom);

  // 进度值颜色判断（超过100%为红色，小于100%为绿色）
  const progressColor = progressPercent 
    ? (parseFloat(progressPercent) >= 100 ? "text-red-600" : "text-green-600")
    : "text-gray-600";
  const completionRateColor = completionRatePercent
    ? (parseFloat(completionRatePercent) >= 100 ? "text-red-600" : "text-green-600")
    : "text-gray-600";

  // 同比颜色判断（超过0%为红色，小于0%为绿色）
  const yoyColor = yoy !== null && yoy !== undefined && yoy !== "—"
    ? getValueColor(yoy, 0, true)
    : "text-gray-600";

  // 环比颜色判断（超过0%为红色，小于0%为绿色）
  const momColor = mom !== null && mom !== undefined && mom !== "—"
    ? getValueColor(mom, 0, true)
    : "text-gray-600";

  return (
    <div 
      ref={cardRef}
      className="rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-white px-4 py-4 flex flex-col flex-shrink-0" 
      style={{ 
        minWidth: minWidth ? `${minWidth}px` : 'fit-content',
        width: 'fit-content'
      }}
    >
      {/* 指标名称 */}
      <p className="text-xs text-gray-500 mb-2 whitespace-nowrap">
        {label}
      </p>
      
      {/* 指标值 */}
      <div className="flex items-baseline gap-1 mb-3 flex-wrap">
        <span className="text-xl md:text-2xl font-semibold text-gray-900 whitespace-nowrap">
          {formatValue(value)}
        </span>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {unit}
        </span>
      </div>

      {/* 纵向排布：目标值、进度值、同比、环比 */}
      <div className="space-y-1.5 text-xs text-gray-500 mt-auto">
        {/* 目标值 */}
        <div className="flex items-center justify-between gap-2 min-w-full">
          <span className="text-gray-500 whitespace-nowrap flex-shrink-0">目标值：</span>
          <span className="text-gray-700 text-right whitespace-nowrap">{formattedTarget}</span>
        </div>

        {/* 目标完成率 */}
        <div className="flex items-center justify-between gap-2 min-w-full">
          <span className="text-gray-500 whitespace-nowrap flex-shrink-0">目标完成率：</span>
          <span className={`font-medium text-right whitespace-nowrap ${completionRateColor}`}>
            {completionRatePercent || "—"}
          </span>
        </div>

        {/* 目标进度达成率 */}
        <div className="flex items-center justify-between gap-2 min-w-full">
          <span className="text-gray-500 whitespace-nowrap flex-shrink-0">目标进度达成率：</span>
          <span className={`font-medium text-right whitespace-nowrap ${progressColor}`}>
            {progressPercent || "—"}
          </span>
        </div>

        {/* 同比 */}
        <div className="flex items-center justify-between gap-2 min-w-full">
          <span className="text-gray-500 whitespace-nowrap flex-shrink-0">同比：</span>
          <span className={`font-medium text-right whitespace-nowrap ${yoyColor}`}>
            {formattedYoy}
          </span>
        </div>

        {/* 环比 */}
        <div className="flex items-center justify-between gap-2 min-w-full">
          <span className="text-gray-500 whitespace-nowrap flex-shrink-0">环比：</span>
          <span className={`font-medium text-right whitespace-nowrap ${momColor}`}>
            {formattedMom}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CoreMetricCard;
