-- 现金流计算（城市维度）

WITH city_monthly_sum AS (
    -- 第一步：先将门店数据按 城市+月份 汇总成城市级的月度数据
    SELECT
        c.statistics_city_name,
        a.month,
        SUM(a.net_cash_flow) AS monthly_net_cash_flow
    FROM dws_profit_store_detail_monthly a
    LEFT JOIN dm_city c ON a.city_code = c.city_code
    WHERE length(a.store_code) = 6
    GROUP BY c.statistics_city_name, a.month
),
city_cumulative_data AS (
    -- 第二步：基于城市月度汇总数据，计算每个城市的历史累计值
    SELECT
        statistics_city_name,
        month,
        monthly_net_cash_flow,
        -- 按城市分组，按月份升序，计算累计现金流
        SUM(monthly_net_cash_flow) OVER(PARTITION BY statistics_city_name ORDER BY month ASC) AS cumulative_city_cash_flow
    FROM city_monthly_sum
)
-- 第三步：筛选出昨日所在的月份
SELECT
    statistics_city_name,
    month,
    monthly_net_cash_flow AS current_month_city_flow,
    cumulative_city_cash_flow AS total_city_cumulative_flow
FROM city_cumulative_data
WHERE month = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m')
ORDER BY cumulative_city_cash_flow DESC;