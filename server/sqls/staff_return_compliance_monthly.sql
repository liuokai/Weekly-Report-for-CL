-- 新员工回头率达标率月度统计（全公司维度，含达标人数及同比校验）

WITH monthly_metrics AS (
    -- 第一步：按月汇总新员工的达标人数和总人数
    SELECT
        month                                                                    AS report_month,
        COUNT(DISTINCT job_number)                                               AS total_new_staff,
        -- 使用 COUNT DISTINCT 确保人数统计的准确性
        COUNT(DISTINCT IF(is_return_rate_standard = '是', job_number, NULL)) AS standard_staff_count
    FROM data_warehouse.dws_indicator_detail_massagist
    WHERE company_tenure IN (1, 2, 3) -- 仅限新员工
    GROUP BY 1
),
rate_calc AS (
    -- 第二步：计算每月达标率
    SELECT
        report_month,
        total_new_staff,
        standard_staff_count,
        ROUND(standard_staff_count / NULLIF(total_new_staff, 0) * 100, 2) AS compliance_rate
    FROM monthly_metrics
)
-- 第三步：自连接并按照月度同比顺序输出字段
SELECT
    curr.report_month                                    AS report_month,            -- 统计月份
    curr.total_new_staff                                 AS monthly_new_staff_count, -- 月维度下新员工人数
    curr.standard_staff_count                            AS monthly_standard_count,  -- 新员工回头率达标人数
    curr.compliance_rate                                 AS compliance_rate,         -- 新员工回头率达标率(%)
    prev.compliance_rate                                 AS compliance_rate_ly,      -- 去年同期达标率(%)
    -- 校验逻辑：利用 NULL 运算特性，若去年同期数据缺失，则结果自动为 NULL
    ROUND(curr.compliance_rate - prev.compliance_rate, 2) AS yoy_change_pct          -- 同比(百分点)
FROM rate_calc curr
LEFT JOIN rate_calc prev
    -- 关联逻辑：月份相同（如均为05月）且年份差1
    ON SUBSTRING(curr.report_month, 6, 2) = SUBSTRING(prev.report_month, 6, 2)
    AND CAST(SUBSTRING(curr.report_month, 1, 4) AS INT) = CAST(SUBSTRING(prev.report_month, 1, 4) AS INT) + 1
WHERE curr.report_month >= '2025-01' -- 通常锁定当前分析年度
ORDER BY report_month DESC;