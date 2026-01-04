-- 按月、城市维度统计活跃会员数

WITH monthly_active_stats AS (
    -- 第一步：按 月 + 城市 汇总活跃会员数
    SELECT
        month,
        statistics_city_name,
        SUM(active_member_count) AS total_active_members
    FROM dws_store_member_statistics_monthly
    GROUP BY
        month,
        statistics_city_name
)

-- 第二步：按 月 + 城市 计算同比
SELECT
    curr.month                  AS month,
    curr.statistics_city_name   AS statistics_city_name,
    curr.total_active_members   AS active_member_count,
    prev.total_active_members   AS last_year_active_member_count,
    ROUND(
        CAST(
            (curr.total_active_members - prev.total_active_members)
            / NULLIF(prev.total_active_members, 0) * 100
            AS DECIMAL(10,4)
        ),
        2
    )                            AS yoy_rate
FROM monthly_active_stats curr
LEFT JOIN monthly_active_stats prev
       ON curr.statistics_city_name = prev.statistics_city_name       -- 城市一致
      AND SUBSTRING(curr.month, 6, 2) = SUBSTRING(prev.month, 6, 2)   -- 月份一致
      AND CAST(SUBSTRING(curr.month, 1, 4) AS INT)
          = CAST(SUBSTRING(prev.month, 1, 4) AS INT) + 1              -- 年份差 1
WHERE curr.month >= '2025-01'
ORDER BY
    curr.month,
    curr.statistics_city_name;
