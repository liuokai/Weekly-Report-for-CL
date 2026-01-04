-- 按年度统计客次量（YTD & 同期 YTD）

WITH daily_user_visits AS (
    -- 第一步：按用户和日期去重，确定每天的客次基础
    SELECT
        YEAR(off_clock_time) AS s_year,
        DATE(off_clock_time) AS order_date,
        user_id
    FROM dwd_sales_order_detail
    WHERE off_clock_time IS NOT NULL
      AND user_id IS NOT NULL
    GROUP BY 1, 2, 3
),
year_latest_date AS (
    -- 第二步：获取每个年度当前已产生数据的最大日期
    SELECT
        s_year,
        MAX(order_date) AS latest_order_date
    FROM daily_user_visits
    GROUP BY s_year
),
annual_ytd_visits AS (
    -- 第三步：统计当年 YTD 客次量
    SELECT
        v.s_year,
        COUNT(*) AS annual_total_visits
    FROM daily_user_visits v
    GROUP BY v.s_year
),
last_year_ytd_visits AS (
    -- 第四步：统计去年同期（YTD 对齐）的客次量
    SELECT
        v.s_year + 1 AS s_year,
        COUNT(*)     AS last_year_ytd_total_visits
    FROM daily_user_visits v
    JOIN year_latest_date d
        ON v.s_year = d.s_year - 1
       AND v.order_date <= DATE_SUB(d.latest_order_date, INTERVAL 1 YEAR)
    GROUP BY v.s_year + 1
)
SELECT
    curr.s_year                             AS sales_year,
    curr.annual_total_visits               AS annual_total_visits,
    ly.last_year_ytd_total_visits           AS last_year_same_period_visits,
    -- 计算同比增幅（YTD）
    IF(
        ly.last_year_ytd_total_visits IS NULL
        OR ly.last_year_ytd_total_visits = 0,
        NULL,
        ROUND(
            (curr.annual_total_visits - ly.last_year_ytd_total_visits)
            / ly.last_year_ytd_total_visits * 100,
            2
        )
    )                                       AS visits_yoy_pct
FROM annual_ytd_visits curr
LEFT JOIN last_year_ytd_visits ly
    ON curr.s_year = ly.s_year
WHERE curr.s_year >= 2025
ORDER BY sales_year DESC;
