-- 按月份、城市维度统计会员主动评价率

WITH monthly_review_stats AS (
    -- 第一步：按月、城市聚合订单总数和主动评价总数
    SELECT DATE_FORMAT(ord.off_clock_time, '%Y-%m')            AS s_month,
           city.statistics_city_name                           AS city_name,
           COUNT(ord.order_no)                                 AS total_orders,
           SUM(IF(ord.is_customer_active_review = '是', 1, 0)) AS active_review_orders
    FROM data_warehouse.dwd_sales_order_detail AS ord
             LEFT JOIN data_warehouse.dm_city AS city ON ord.city_code = city.city_code
    WHERE ord.off_clock_time IS NOT NULL and ord.off_clock_time >= '2024-01-01'
      AND ord.order_no IS NOT NULL
    GROUP BY 1, 2),
rate_calc AS (
    -- 第二步：计算各城市每月评价率
    SELECT s_month,
           city_name,
           total_orders,
           active_review_orders,
           ROUND(active_review_orders / NULLIF(total_orders, 0) * 100, 2) AS review_rate
    FROM monthly_review_stats)
-- 第三步：自连接计算 2025 年各城市同比数据
SELECT curr.s_month                                  AS month,
       curr.city_name                                AS city,
       curr.total_orders                             AS total_orders,
       curr.active_review_orders                     AS active_review_orders,
       curr.review_rate                              AS review_rate_pct,
       prev.review_rate                              AS last_year_review_rate_pct,
       -- 计算同比增减（百分点）
       ROUND(curr.review_rate - prev.review_rate, 2) AS yoy_change_pct_points
FROM rate_calc curr
         LEFT JOIN rate_calc prev
                   ON curr.city_name = prev.city_name 
                       AND SUBSTRING(curr.s_month, 6, 2) = SUBSTRING(prev.s_month, 6, 2)
                       AND CAST(SUBSTRING(curr.s_month, 1, 4) AS INT) = CAST(SUBSTRING(prev.s_month, 1, 4) AS INT) + 1
WHERE curr.s_month >= '2025-01'
ORDER BY curr.s_month ASC, curr.review_rate DESC;