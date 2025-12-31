-- 新员工回头率达标率年度统计（全公司维度，含去年值）

WITH yearly_metrics AS (
    SELECT
        YEAR(STR_TO_DATE(CONCAT(month, '-01'), '%Y-%m-%d'))                      AS report_year,
        COUNT(DISTINCT job_number)                                               AS total_new_staff,
        COUNT(DISTINCT IF(is_return_rate_standard = '是', job_number, NULL))     AS standard_staff_count
    FROM data_warehouse.dws_indicator_detail_massagist
    WHERE company_tenure IN (1, 2, 3)
    GROUP BY 1
),
rate_calc AS (
    SELECT
        report_year,
        total_new_staff,
        standard_staff_count,
        ROUND(standard_staff_count / NULLIF(total_new_staff, 0) * 100, 2) AS compliance_rate
    FROM yearly_metrics
)
SELECT
    curr.report_year                                   AS report_year,
    curr.total_new_staff                                AS yearly_new_staff_count,
    curr.standard_staff_count                           AS yearly_standard_count,
    curr.compliance_rate                                AS compliance_rate,
    prev.compliance_rate                                AS compliance_rate_ly
FROM rate_calc curr
LEFT JOIN rate_calc prev
    ON CAST(curr.report_year AS INT) = CAST(prev.report_year AS INT) + 1
WHERE curr.report_year >= 2025
ORDER BY curr.report_year DESC;

