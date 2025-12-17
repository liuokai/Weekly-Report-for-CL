import React, { useState } from "react";

const LineTrendChart = ({
  headerTitle,
  headerUnit,
  values = [],
  valuesYoY = [],
  xLabels = [],
  showYoY = false,
  showTrend = true,
  showExtremes = true,
  yAxisFormatter = (v) => v,
  valueFormatter = (v) => v,
  width = 800,
  height = 320,
  padding = { top: 40, right: 40, bottom: 60, left: 45 },
  colorPrimary = "#a40035",
  colorYoY = "#2563eb",
  getHoverTitle,
  getHoverSubtitle
}) => {
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  const allValues = showYoY && valuesYoY && valuesYoY.length ? [...values, ...valuesYoY] : [...values];
  const maxVal = Math.max(...allValues) * 1.05;
  const minVal = Math.min(...allValues) * 0.95;

  const getX = (index) => padding.left + (index / (values.length - 1)) * graphWidth;
  const getY = (value) => padding.top + graphHeight - ((value - minVal) / (maxVal - minVal)) * graphHeight;

  const calculateTrendLine = () => {
    const n = values.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    for (let i = 0; i < n; i++) {
      const val = values[i];
      sumX += i;
      sumY += val;
      sumXY += i * val;
      sumXX += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return values.map((_, i) => slope * i + intercept);
  };

  const trendValues = calculateTrendLine();
  const trendPathD = trendValues.map((val, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(val)}`).join(" ");

  let maxIndex = 0;
  let minIndex = 0;
  for (let i = 0; i < values.length; i++) {
    if (values[i] > values[maxIndex]) maxIndex = i;
    if (values[i] < values[minIndex]) minIndex = i;
  }

  const getSmoothPath = (points) => {
    if (points.length < 2) return "";
    if (points.length === 2) {
      return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
    }
    const d = [`M ${points[0].x} ${points[0].y}`];
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? i : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`);
    }
    return d.join(" ");
  };

  const points = values.map((v, i) => ({ x: getX(i), y: getY(v) }));
  const pathD = getSmoothPath(points);

  const pointsLY = (valuesYoY || []).map((v, i) => ({ x: getX(i), y: getY(v) }));
  const pathDLY = getSmoothPath(pointsLY);

  const [hoverIndex, setHoverIndex] = useState(null);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      {headerTitle || headerUnit ? (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{headerTitle}</h3>
          <p className="text-sm text-gray-500">单位：{headerUnit}</p>
        </div>
      ) : null}

      <div className="w-full overflow-x-auto">
        <div style={{ minWidth: `${width}px` }}>
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
            <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#e5e7eb" strokeWidth="1" />
            <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#e5e7eb" strokeWidth="1" />

            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const val = minVal + (maxVal - minVal) * ratio;
              const y = getY(val);
              return (
                <g key={ratio}>
                  <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f3f4f6" strokeDasharray="4 4" />
                  <text x={padding.left - 10} y={y} dy="4" textAnchor="end" fontSize="12" fill="#9ca3af">
                    {yAxisFormatter(val)}
                  </text>
                </g>
              );
            })}

            {values.map((_, i) => (
              <text
                key={i}
                x={getX(i)}
                y={height - padding.bottom + 25}
                textAnchor="middle"
                fontSize="11"
                fill="#6b7280"
                transform={`rotate(0, ${getX(i)}, ${height - padding.bottom + 25})`}
              >
                {xLabels && xLabels[i] !== undefined ? xLabels[i] : i + 1}
              </text>
            ))}

            {showTrend && (
              <path d={trendPathD} fill="none" stroke="#9ca3af" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" pointerEvents="none" />
            )}

            {showYoY && valuesYoY && valuesYoY.length === values.length && (
              <path
                d={pathDLY}
                fill="none"
                stroke={colorYoY}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="4 2"
                pointerEvents="none"
                opacity="0.7"
              />
            )}

            <path d={pathD} fill="none" stroke={colorPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />

            {values.map((v, i) => (
              <circle key={`curr-${i}`} cx={getX(i)} cy={getY(v)} r={4} fill="white" stroke={colorPrimary} strokeWidth="2" />
            ))}

            {showExtremes && (
              <g pointerEvents="none">
                <circle cx={getX(maxIndex)} cy={getY(values[maxIndex])} r={10} fill={colorPrimary} stroke="white" strokeWidth="2" />
                <text x={getX(maxIndex)} y={getY(values[maxIndex])} dy="3" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                  峰
                </text>
                <text x={getX(maxIndex)} y={getY(values[maxIndex]) - 15} textAnchor="middle" fill={colorPrimary} fontSize="11" fontWeight="bold">
                  {valueFormatter(values[maxIndex])}
                </text>
              </g>
            )}

            {showExtremes && (
              <g pointerEvents="none">
                <circle cx={getX(minIndex)} cy={getY(values[minIndex])} r={10} fill={colorPrimary} stroke="white" strokeWidth="2" />
                <text x={getX(minIndex)} y={getY(values[minIndex])} dy="3" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                  谷
                </text>
                <text x={getX(minIndex)} y={getY(values[minIndex]) + 22} textAnchor="middle" fill={colorPrimary} fontSize="11" fontWeight="bold">
                  {valueFormatter(values[minIndex])}
                </text>
              </g>
            )}

            <rect
              x={padding.left}
              y={padding.top}
              width={graphWidth}
              height={graphHeight}
              fill="transparent"
              onMouseMove={(e) => {
                const rect = e.target.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const step = graphWidth / (values.length - 1);
                let index = Math.round(x / step);
                if (index < 0) index = 0;
                if (index >= values.length) index = values.length - 1;
                setHoverIndex(index);
              }}
              onMouseLeave={() => setHoverIndex(null)}
            />

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

            {hoverIndex !== null && (
              <circle cx={getX(hoverIndex)} cy={getY(values[hoverIndex])} r={6} fill="white" stroke={colorPrimary} strokeWidth="2" pointerEvents="none" />
            )}

            {hoverIndex !== null && showYoY && valuesYoY && valuesYoY.length === values.length && (
              <circle cx={getX(hoverIndex)} cy={getY(valuesYoY[hoverIndex])} r={4} fill="white" stroke={colorYoY} strokeWidth="2" pointerEvents="none" />
            )}

            {hoverIndex !== null && (
              <g pointerEvents="none">
                {(() => {
                  const idx = hoverIndex;
                  const val = values[idx];
                  const valLY = showYoY && valuesYoY && valuesYoY.length ? valuesYoY[idx] : undefined;

                  let yoyStr = "";
                  let yoyColor = "#374151";
                  if (showYoY && valLY && valLY !== 0) {
                    const yoy = (val - valLY) / valLY;
                    const sign = yoy > 0 ? "+" : "";
                    yoyStr = `${sign}${(yoy * 100).toFixed(2)}%`;
                    yoyColor = yoy > 0 ? "#ef4444" : "#10b981";
                  }

                  const measureText = (str) => {
                    let w = 0;
                    for (let char of str) {
                      w += char.charCodeAt(0) > 255 ? 14 : 8.5;
                    }
                    return w;
                  };

                  const titleText = getHoverTitle ? getHoverTitle(idx) : (xLabels && xLabels[idx] ? `${xLabels[idx]}` : `第 ${idx + 1}`);
                  const subText = getHoverSubtitle ? getHoverSubtitle(idx) : "";
                  const curText = `${valueFormatter(val)}`;
                  const lastText = showYoY && valLY !== undefined ? `${valueFormatter(valLY)}` : "";

                  const titleW = measureText(titleText);
                  const dateW = measureText(subText);
                  const curW = measureText(curText);
                  const lastW = showYoY ? measureText(lastText) : 0;
                  const yoyW = showYoY ? measureText(yoyStr) : 0;

                  const maxContentW = Math.max(titleW, dateW, curW, lastW, yoyW);
                  const boxWidth = Math.max(220, maxContentW + 100);
                  const boxHeight = showYoY ? 145 : (subText ? 100 : 80);

                  const x = getX(idx);
                  const y = getY(val);

                  let tx = x - boxWidth / 2;
                  if (tx < 10) tx = 10;
                  if (tx + boxWidth > width - 10) tx = width - boxWidth - 10;

                  let ty = y - boxHeight - 15;
                  let isTop = true;
                  if (ty < 10) {
                    ty = y + 25;
                    isTop = false;
                  }

                  return (
                    <g transform={`translate(${tx}, ${ty})`}>
                      <rect width={boxWidth} height={boxHeight} rx="6" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
                      <g transform="translate(15, 25)">
                        <text fill="#374151" fontSize="13" fontWeight="bold">
                          {titleText}
                        </text>
                        {subText ? (
                          <text y="24" fill="#6b7280" fontSize="12">
                            {subText}
                          </text>
                        ) : null}
                        <text y={subText ? "48" : "24"} fill="#6b7280" fontSize="12">
                          当前：<tspan fill={colorPrimary} fontWeight="bold">{curText}</tspan>
                        </text>
                        {showYoY && valLY !== undefined ? (
                          <>
                            <text y={subText ? "72" : "48"} fill="#6b7280" fontSize="12">
                              去年同期：<tspan fill={colorYoY} fontWeight="bold">{lastText}</tspan>
                            </text>
                            <text y={subText ? "96" : "72"} fill="#6b7280" fontSize="12">
                              同比：<tspan fill={yoyColor} fontWeight="bold">{yoyStr}</tspan>
                            </text>
                          </>
                        ) : null}
                      </g>
                      {isTop ? (
                        <path d={`M ${boxWidth / 2 - 6} ${boxHeight} l 6 6 l 6 -6 z`} fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" transform={`translate(${x - tx - boxWidth / 2}, 0)`} />
                      ) : (
                        <path d={`M ${boxWidth / 2 - 6} 0 l 6 -6 l 6 6 z`} fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" transform={`translate(${x - tx - boxWidth / 2}, 0)`} />
                      )}
                      {isTop ? (
                        <path d={`M ${boxWidth / 2 - 5} ${boxHeight - 1} l 10 0`} stroke="#f3f4f6" strokeWidth="2" transform={`translate(${x - tx - boxWidth / 2}, 0)`} />
                      ) : (
                        <path d={`M ${boxWidth / 2 - 5} 1 l 10 0`} stroke="#f3f4f6" strokeWidth="2" transform={`translate(${x - tx - boxWidth / 2}, 0)`} />
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

export default LineTrendChart;
