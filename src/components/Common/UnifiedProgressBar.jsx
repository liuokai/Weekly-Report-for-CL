import React from 'react';
import PropTypes from 'prop-types';

/**
 * Color Configuration - 使用Hex码方便手动调整
 */
const COLORS = {
  theme: '#a40035',      // 主题色 (实际 >= 时间)
  success: '#16a34a',    // 绿色 (实际 < 时间)
  lineAhead: '#FFFFFF',  // 白色 (实际 >= 时间, 竖线颜色)
  lineBehind: '#4B5563', // 深灰色 (实际 < 时间, 竖线颜色)
};

/**
 * UnifiedProgressBar
 * 
 * 统一的进度条组件，用于展示实际进度与时间进度的对比。
 * 
 * 规则：
 * 1. 当实际进度值 >= 时间进度值时，进度条以主题色标识，时间进度竖线为白色。
 * 2. 当实际进度值 < 时间进度值时，进度条以绿色标识，时间进度竖线为深灰色。
 * 3. 统一进度条的高度 (默认为 h-2)。
 */
const UnifiedProgressBar = ({ 
  label, 
  value, 
  timeProgress, 
  height = 'h-2',
  className = ''
}) => {
  // 确保数值为数字
  const numericValue = Number(value) || 0;
  const numericTimeProgress = Number(timeProgress) || 0;

  // 判定逻辑
  const isAhead = numericValue >= numericTimeProgress;
  
  // 颜色选择
  const barColor = isAhead ? COLORS.theme : COLORS.success;
  const lineColor = isAhead ? COLORS.lineAhead : COLORS.lineBehind;
  
  // 限制显示宽度在 0-100% 之间
  const displayWidth = Math.min(100, Math.max(0, numericValue));
  const displayTimeLeft = Math.min(100, Math.max(0, numericTimeProgress));

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>{label} {numericValue.toFixed(1)}%</span>
        <span>时间进度 {numericTimeProgress}%</span>
      </div>
      <div className={`relative ${height} bg-gray-100 rounded-full overflow-hidden`}>
        {/* 实际进度条 */}
        <div 
          className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-500"
          style={{ 
            width: `${displayWidth}%`,
            backgroundColor: barColor 
          }}
        />
        
        {/* 时间进度标记线 */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 z-10"
          style={{ 
            left: `${displayTimeLeft}%`,
            backgroundColor: lineColor
          }}
        />
      </div>
    </div>
  );
};

UnifiedProgressBar.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  timeProgress: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  height: PropTypes.string,
  className: PropTypes.string,
};

export default UnifiedProgressBar;
