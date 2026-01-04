-- 按月累计统计年度客次量

WITH daily_user_visits AS (
    -- 第一步：按用户和日期去重，确定每天的基础客次（一人一天算一次）
    SELECT YEAR(off_clock_time)                 AS s_year,
           MONTH(off_clock_time)                AS s_month,
           DATE_FORMAT(off_clock_time, '%Y-%m') AS month_str,
           DATE(off_clock_time)                 AS order_date,
           user_id
    FROM dwd_sales_order_detail
    WHERE off_clock_time IS NOT NULL
      AND user_id IS NOT NULL
    GROUP BY 1, 2, 3, 4, 5
),
monthly_visit_stats AS (
    -- 第二步：汇总每个月的总客次
    SELECT s_year,
           s_month,
           month_str,
           COUNT(*) AS monthly_visits
    FROM daily_user_visits
    GROUP BY 1, 2, 3
),
cumulative_visit_stats AS (
    -- 第三步：使用窗口函数计算年内逐月累计客次
    SELECT *,
           SUM(monthly_visits) OVER (
               PARTITION BY s_year
               ORDER BY s_month
               ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
           ) AS running_total_visits -- 月累计客次
    FROM monthly_visit_stats
)
-- 第四步：自连接计算累计客次的同比
SELECT
    curr.month_str            AS month,
    curr.monthly_visits       AS monthly_visits,
    curr.running_total_visits AS ytd_cumulative_visits,
    prev.running_total_visits AS last_year_ytd_cumulative_visits,
    -- 计算累计同比增幅
    IF(
        prev.running_total_visits IS NULL OR prev.running_total_visits = 0,
        NULL,
        ROUND(
            (curr.running_total_visits - prev.running_total_visits)
            / prev.running_total_visits * 100,
            2
        )
    )                          AS ytd_visits_yoy_pct
FROM cumulative_visit_stats curr
LEFT JOIN cumulative_visit_stats prev
    ON curr.s_year = prev.s_year + 1
   AND curr.s_month = prev.s_month
WHERE curr.s_year >= 2025
ORDER BY curr.month_str DESC;
