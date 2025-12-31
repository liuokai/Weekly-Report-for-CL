-- 新员工回头率达标率城市月度统计（返回所有城市，前端自行按城市筛选并展示近12个月）

WITH monthly_city_metrics AS (
    SELECT
        b.statistics_city_name                                                   AS city_name,
        a.month                                                                  AS report_month,
        YEAR(STR_TO_DATE(CONCAT(a.month, '-01'), '%Y-%m-%d'))                   AS report_year,
        MONTH(STR_TO_DATE(CONCAT(a.month, '-01'), '%Y-%m-%d'))                  AS report_month_num,
        COUNT(DISTINCT a.job_number)                                             AS total_new_staff,
        COUNT(DISTINCT CASE WHEN a.is_return_rate_standard = '是' THEN a.job_number END) AS standard_staff_count
    FROM data_warehouse.dws_indicator_detail_massagist AS a
    LEFT JOIN data_warehouse.dm_city AS b
        ON a.city_code = b.city_code
    WHERE a.company_tenure IN (1, 2, 3)
    GROUP BY b.statistics_city_name, a.month
)
SELECT
    curr.city_name                                        AS city_name,
    curr.report_month                                     AS report_month,
    curr.total_new_staff                                  AS monthly_new_staff_count,
    curr.standard_staff_count                             AS monthly_standard_count,
    ROUND(curr.standard_staff_count / NULLIF(curr.total_new_staff, 0) * 100, 2) AS compliance_rate,
    ROUND(prev.standard_staff_count / NULLIF(prev.total_new_staff, 0) * 100, 2) AS compliance_rate_ly,
    ROUND(
        ROUND(curr.standard_staff_count / NULLIF(curr.total_new_staff, 0) * 100, 2)
        - ROUND(prev.standard_staff_count / NULLIF(prev.total_new_staff, 0) * 100, 2),
        2
    ) AS yoy_change_pct
FROM monthly_city_metrics AS curr
LEFT JOIN monthly_city_metrics AS prev
    ON curr.city_name = prev.city_name
   AND curr.report_month_num = prev.report_month_num
   AND curr.report_year = prev.report_year + 1
ORDER BY curr.report_month DESC;
