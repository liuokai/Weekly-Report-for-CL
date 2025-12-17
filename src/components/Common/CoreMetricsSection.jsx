import React from "react";
import CoreMetricCard from "./CoreMetricCard";

/**
 * 通用核心指标分区容器，统一控制标题区与指标卡布局。
 * 样式集中在此文件维护，业务侧只需提供数据。
 */
const CoreMetricsSection = ({
  title,
  subtitle,
  hint,
  metrics = [],
  className = "bg-white rounded-lg shadow p-4 md:p-6",
  contentClassName = "flex flex-wrap gap-3 md:gap-4",
}) => {
  return (
    <section className={className}>
      {(title || subtitle || hint) && (
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            {title && (
              <p className="text-sm md:text-base font-semibold text-gray-900">
                {title}
              </p>
            )}
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
          {hint && <p className="text-xs md:text-sm text-gray-500">{hint}</p>}
        </div>
      )}

      <div className={contentClassName}>
        {metrics.map((m) => (
          <CoreMetricCard
            key={m.key}
            label={m.label}
            value={m.value}
            unit={m.unit}
            target={m.target}
            progress={m.progress}
            yoy={m.yoy}
            mom={m.mom}
          />
        ))}
      </div>
    </section>
  );
};

export default CoreMetricsSection;


