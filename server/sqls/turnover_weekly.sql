-- 按周计算营业额

WITH weekly_sales AS (
    -- 第一步：按周聚合基础数据
    SELECT YEARWEEK(off_clock_time, 1)                                                                      AS year_week_key, -- 获取年+周 (1表示周一为起始)
           YEAR(off_clock_time)                                                                             AS sales_year,
           WEEK(off_clock_time, 1)                                                                          AS sales_week,
           -- 该周的起始日期（周一）
           STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'),
                       '%x%v %W')                                                                           AS week_start,
           -- 该周的结束日期（周日）
           DATE_ADD(STR_TO_DATE(CONCAT(YEARWEEK(off_clock_time, 1), ' Monday'), '%x%v %W'), INTERVAL 6 DAY) AS week_end,
           -- 此处假定营业额需要根据实际业务求和（如：COUNT(*) * 单价 或 具体的金额字段）
           -- 如果没有金额字段，这里演示用订单数，若有金额字段请替换为 SUM(amount)
           COUNT(order_no)                                                                                  AS weekly_revenue
    FROM data_warehouse.dwd_sales_order_detail
    WHERE off_clock_time IS NOT NULL
      AND off_clock_time >= '2024-01-01' -- Performance Optimization: Only load relevant years (Current 2025 + Previous 2024)
    GROUP BY 1, 2, 3, 4, 5)
SELECT curr.sales_year                                                                                 AS `year`,
       curr.sales_week                                                                                 AS `week`,
       CONCAT(DATE_FORMAT(curr.week_start, '%Y-%m-%d'), ' ~ ', DATE_FORMAT(curr.week_end, '%Y-%m-%d')) AS `date_range`,
       curr.weekly_revenue                                                                             AS `current_value`,
       prev.weekly_revenue                                                                             AS `last_year_value`,
       -- 计算同比: (今年 - 去年) / 去年
       IF(prev.weekly_revenue IS NULL OR prev.weekly_revenue = 0, NULL,
          ROUND((curr.weekly_revenue - prev.weekly_revenue) / prev.weekly_revenue * 100, 2))           AS `yoy_change`
FROM weekly_sales curr
         LEFT JOIN weekly_sales prev
                   ON curr.sales_year = prev.sales_year + 1 -- 年份差1
                       AND curr.sales_week = prev.sales_week -- 周数相同
where curr.sales_year = 2025
ORDER BY curr.sales_year DESC, curr.sales_week DESC;
