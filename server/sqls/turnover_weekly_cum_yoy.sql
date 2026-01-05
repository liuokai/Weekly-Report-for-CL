-- 按 ISO 周计算年度累计营业额（同比，不拆周）

WITH weekly_sales AS (
    SELECT
        -- ISO 周起始日期（周一）
        STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W') AS week_start,
        DATE_ADD(
            STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W'),
            INTERVAL 6 DAY
        ) AS week_end,

        -- ISO 周所属年 & 周序号
        YEAR(
            STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W')
        ) AS sales_year,
        WEEK(
            STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W'),
            1
        ) AS sales_week,

        SUM(order_actual_payment) AS weekly_revenue
    FROM data_warehouse.dwd_sales_order_detail
    WHERE off_clock_time IS NOT NULL
      AND off_clock_time >= '2024-01-01'
    GROUP BY 1, 2, 3, 4
),

cumulative_sales AS (
    SELECT
        *,
        SUM(weekly_revenue) OVER (
            PARTITION BY sales_year
            ORDER BY sales_week
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS running_total_revenue
    FROM weekly_sales
)

SELECT
    curr.sales_year AS `year`,
    curr.sales_week AS `week`,
    CONCAT(
        DATE_FORMAT(curr.week_start, '%Y-%m-%d'),
        ' ~ ',
        DATE_FORMAT(curr.week_end, '%Y-%m-%d')
    ) AS `date_range`,
    curr.running_total_revenue AS `current_value`,
    prev.running_total_revenue AS `last_year_value`,
    IF(
        prev.running_total_revenue IS NULL OR prev.running_total_revenue = 0,
        NULL,
        ROUND(
            (curr.running_total_revenue - prev.running_total_revenue)
            / prev.running_total_revenue * 100,
            2
        )
    ) AS `yoy_change`
FROM cumulative_sales curr
LEFT JOIN cumulative_sales prev
    ON curr.sales_year = prev.sales_year + 1
   AND curr.sales_week = prev.sales_week
WHERE curr.sales_year >= 2025
ORDER BY curr.sales_year DESC, curr.sales_week DESC;
