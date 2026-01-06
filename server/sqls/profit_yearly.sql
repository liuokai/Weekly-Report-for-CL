-- 年度利润统计

WITH annual_aggregate AS (
    SELECT
        SUBSTR(month, 1, 4) AS stat_year,
        SUM(main_business_income) AS total_revenue,
        SUM(net_profit) AS total_profit
    FROM dws_profit_store_detail_monthly
    WHERE
        month >= '2025-01'
        AND month <= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m')
        AND LENGTH(store_code) = 6
    GROUP BY 1
)
SELECT
    stat_year,
    total_revenue,
    total_profit,

    -- 1. 利润率：计算值 * 100，保留 2 位小数
    ROUND(IF(total_revenue = 0, 0, total_profit / total_revenue) * 100, 2) AS profit_rate,

    -- 2. 去年利润率：取上一年的计算结果并转换
    LAG(
        ROUND(IF(total_revenue = 0, 0, total_profit / total_revenue) * 100, 2)
    ) OVER (ORDER BY stat_year) AS last_year_profit_rate,

    -- 3. 利润同比：计算增长率 * 100，保留 2 位小数
    ROUND(
        IF(
            LAG(total_profit) OVER (ORDER BY stat_year) = 0,
            NULL,
            (total_profit - LAG(total_profit) OVER (ORDER BY stat_year)) / ABS(LAG(total_profit) OVER (ORDER BY stat_year))
        ) * 100,
    2) AS yoy_growth
FROM annual_aggregate
ORDER BY stat_year DESC;