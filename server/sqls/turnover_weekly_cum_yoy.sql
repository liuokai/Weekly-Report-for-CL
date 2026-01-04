-- 按周计算累计营业额（同比）

WITH weekly_sales AS (
    -- 第一步：按周聚合基礎數據
    SELECT YEARWEEK(off_clock_time, 1)                                                                      AS year_week_key,
           YEAR(off_clock_time)                                                                             AS sales_year,
           WEEK(off_clock_time, 1)                                                                          AS sales_week,
           -- 計算該周的起始與結束日期
           STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'),
                       '%x%v %W')                                                                           AS week_start,
           DATE_ADD(STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W'), INTERVAL 6 DAY) AS week_end,
           -- 營業額（此處請根據實際金額欄位修改，如 SUM(actual_amount)）
           sum(order_actual_payment)                                                                        AS weekly_revenue
    FROM data_warehouse.dwd_sales_order_detail
    WHERE off_clock_time IS NOT NULL
      AND off_clock_time >= '2024-01-01'
    GROUP BY 1, 2, 3, 4, 5),
     cumulative_sales AS (
         -- 第二步：使用窗口函數計算年內周累計
         SELECT *,
                SUM(weekly_revenue) OVER (
                    PARTITION BY sales_year
                    ORDER BY sales_week
                    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                    ) AS running_total_revenue -- 年內累計營業額
         FROM weekly_sales)
-- 第三步：自連接計算同比
SELECT curr.sales_year                                AS `year`,
       curr.sales_week                                AS `week`,
       CONCAT(DATE_FORMAT(curr.week_start, '%Y-%m-%d'), ' ~ ',
              DATE_FORMAT(curr.week_end, '%Y-%m-%d')) AS `date_range`,
       curr.running_total_revenue                     AS `current_value`,
       prev.running_total_revenue                     AS `last_year_value`,
       -- 同比計算 (累計營業額同比)
       IF(prev.running_total_revenue IS NULL OR prev.running_total_revenue = 0, NULL,
          ROUND((curr.running_total_revenue - prev.running_total_revenue) / prev.running_total_revenue * 100,
                2))                                   AS `yoy_change`
FROM cumulative_sales curr
         LEFT JOIN cumulative_sales prev
                   ON curr.sales_year = prev.sales_year + 1
                       AND curr.sales_week = prev.sales_week
where curr.sales_year >= 2025
ORDER BY curr.sales_year DESC, curr.sales_week DESC;
