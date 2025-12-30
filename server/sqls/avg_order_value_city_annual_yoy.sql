-- 按城市、年度维度统计平均客单价

WITH city_annual_stats AS (
    -- 第一步：按城市和年份汇总数据
    SELECT
        b.statistics_city_name,
        YEAR(off_clock_time)      AS s_year,
        -- 核心指标：营业额
        SUM(order_actual_payment) AS total_revenue,
        COUNT(DISTINCT order_uid) AS total_orders
    FROM dwd_sales_order_detail AS a
    LEFT JOIN dm_city AS b
           ON a.city_code = b.city_code
    WHERE off_clock_time IS NOT NULL
      and off_clock_time >= '2023-01-01'
      AND service_duration >= 40
    GROUP BY b.statistics_city_name, s_year
),
city_annual_aov AS (
    -- 第二步：计算年度客单价（AOV）
    SELECT
        *,
        IF(total_orders = 0, 0,
           ROUND(total_revenue / total_orders, 2)
        ) AS aov
    FROM city_annual_stats
)
-- 第三步：自连接匹配去年数据，计算年度同比
SELECT
    curr.statistics_city_name                            AS city_name,
    curr.s_year                                          AS sales_year,
    curr.aov                                             AS current_year_aov,
    prev.aov                                             AS last_year_aov,
    -- 计算同比增幅
    IF(
        prev.aov IS NULL OR prev.aov = 0,
        NULL,
        ROUND((curr.aov - prev.aov) / prev.aov * 100, 2)
    )                                                     AS aov_yoy_pct
FROM city_annual_aov curr
LEFT JOIN city_annual_aov prev
       ON curr.statistics_city_name = prev.statistics_city_name
      AND curr.s_year = prev.s_year + 1
ORDER BY curr.s_year DESC, curr.aov DESC;