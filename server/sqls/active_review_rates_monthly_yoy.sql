-- 按月统计会员主动评价率

WITH monthly_review_stats AS (
    -- Step 1: Aggregate total orders and active reviews by month
    SELECT DATE_FORMAT(ord.off_clock_time, '%Y-%m')            AS s_month,
           COUNT(ord.order_no)                                 AS total_orders,
           SUM(IF(ord.is_customer_active_review = '是', 1, 0)) AS active_review_orders
    FROM data_warehouse.dwd_sales_order_detail AS ord
    WHERE ord.off_clock_time IS NOT NULL 
      AND ord.off_clock_time >= '2024-01-01'
      AND ord.order_no IS NOT NULL
    GROUP BY 1
),
rate_calc AS (
    -- Step 2: Calculate monthly active review rate
    SELECT s_month,
           total_orders,
           active_review_orders,
           ROUND(active_review_orders / NULLIF(total_orders, 0) * 100, 2) AS review_rate
    FROM monthly_review_stats
)
-- Step 3: Self-join to calculate YoY comparison
SELECT curr.s_month                                  AS month,
       curr.total_orders                             AS total_orders,
       curr.active_review_orders                     AS active_review_orders,
       curr.review_rate                              AS review_rate_pct,
       prev.review_rate                              AS last_year_review_rate_pct,
       ROUND(curr.review_rate - prev.review_rate, 2) AS yoy_change_pct_points
FROM rate_calc curr
         LEFT JOIN rate_calc prev
                   ON SUBSTRING(curr.s_month, 6, 2) = SUBSTRING(prev.s_month, 6, 2)
                      AND CAST(SUBSTRING(curr.s_month, 1, 4) AS INT) = CAST(SUBSTRING(prev.s_month, 1, 4) AS INT) + 1
WHERE curr.s_month >= '2025-01'
ORDER BY curr.s_month ASC, curr.review_rate DESC;