-- 按周计算每周平均每天营业额（同比）
WITH weekly_base AS (
    -- 第一步：按周聚合，同时计算总额和该周实际营业天数
    SELECT YEARWEEK(off_clock_time, 1)                                                                      AS year_week_key,
           YEAR(off_clock_time)                                                                             AS sales_year,
           WEEK(off_clock_time, 1)                                                                          AS sales_week,
           -- 计算该周的日期范围
           STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'),
                       '%x%v %W')                                                                           AS week_start,
           DATE_ADD(STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W'), INTERVAL 6 DAY) AS week_end,
           -- 周总营业额（请根据实际金额字段修改，如 SUM(price)）
           sum(order_actual_payment)                                                                        AS weekly_total_revenue,
           -- 该周实际产生订单的天数（通常为 7，但新开业或特殊节假日可能不足 7）
           COUNT(DISTINCT DATE(off_clock_time))                                                             AS active_days
    FROM data_warehouse.dwd_sales_order_detail
    WHERE off_clock_time IS NOT NULL
      AND off_clock_time >= '2024-01-01'
    GROUP BY 1, 2, 3, 4, 5),
     weekly_avg AS (
         -- 第二步：计算天均营业额
         SELECT *,
                -- 天均 = 周总额 / 实际营业天数
                IF(active_days = 0, 0, ROUND(weekly_total_revenue / active_days, 2)) AS daily_avg_revenue
         FROM weekly_base)
-- 第三步：自连接计算同比
SELECT curr.sales_year                                                                                 AS `year`,
       curr.sales_week                                                                                 AS `week`,
       CONCAT(DATE_FORMAT(curr.week_start, '%Y-%m-%d'), ' ~ ', DATE_FORMAT(curr.week_end, '%Y-%m-%d')) AS `date_range`,
       curr.weekly_total_revenue                                                                       AS `weekly_total`,
       curr.active_days                                                                                AS `active_days`,
       curr.daily_avg_revenue                                                                          AS `current_value`,
       prev.daily_avg_revenue                                                                          AS `last_year_value`,
       -- 计算天均营业额同比
       IF(prev.daily_avg_revenue IS NULL OR prev.daily_avg_revenue = 0, NULL,
          ROUND((curr.daily_avg_revenue - prev.daily_avg_revenue) / prev.daily_avg_revenue * 100, 2))  AS `yoy_change`
FROM weekly_avg curr
         LEFT JOIN weekly_avg prev
                   ON curr.sales_year = prev.sales_year + 1
                       AND curr.sales_week = prev.sales_week
where curr.sales_year >= 2025
ORDER BY curr.sales_year DESC, curr.sales_week DESC;
