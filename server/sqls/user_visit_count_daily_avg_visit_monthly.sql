-- 按月统计天均客次量

WITH daily_user_visits AS (
    -- 第一步：按用户和日期去重，确定每天的基础客次（一人一天算一次）
    SELECT city_name, -- 保留城市维度，方便后续扩展
           YEAR(off_clock_time)                  AS s_year,
           MONTH(off_clock_time)                 AS s_month,
           DATE_FORMAT(off_clock_time, '%Y-%m')  AS month_str,
           DATE(off_clock_time)                  AS order_date,
           user_id
    FROM dwd_sales_order_detail
    WHERE off_clock_time IS NOT NULL
      AND user_id IS NOT NULL
    GROUP BY 1, 2, 3, 4, 5, 6
),
monthly_visit_stats AS (
    -- 第二步：按月汇总总客次，并计算该月的实际天数
    SELECT s_year,
           s_month,
           month_str,
           COUNT(*)                    AS monthly_total_visits, -- 该月总客次
           COUNT(DISTINCT order_date)  AS active_days            -- 该月实际营业天数
    FROM daily_user_visits
    GROUP BY 1, 2, 3
),
monthly_avg_stats AS (
    -- 第三步：计算天均客次量
    SELECT *,
           ROUND(monthly_total_visits / active_days, 2) AS daily_avg_visits
    FROM monthly_visit_stats
)
-- 第四步：自连接计算同比
SELECT
    curr.month_str                                                                               AS month,
    curr.monthly_total_visits                                                                    AS monthly_total_visits,
    curr.active_days                                                                             AS active_days,
    curr.daily_avg_visits                                                                        AS daily_avg_visits,
    prev.daily_avg_visits                                                                        AS last_year_daily_avg_visits,
    -- 计算同比增幅
    IF(
        prev.daily_avg_visits IS NULL OR prev.daily_avg_visits = 0,
        NULL,
        ROUND(
            (curr.daily_avg_visits - prev.daily_avg_visits) / prev.daily_avg_visits * 100,
            2
        )
    )                                                                                            AS yoy_growth_pct
FROM monthly_avg_stats curr
LEFT JOIN monthly_avg_stats prev
    ON curr.s_year = prev.s_year + 1
   AND curr.s_month = prev.s_month
WHERE curr.s_year >= 2025
ORDER BY curr.month_str DESC;