-- 现金流计算（门店维度）

WITH summary_data AS (
    -- 先计算所有月份的累计值
    SELECT
        a.month,
        c.statistics_city_name,
        a.store_code,
        a.store_name,
        a.net_cash_flow,
        SUM(a.net_cash_flow) OVER(PARTITION BY a.store_code ORDER BY a.month ASC) AS cumulative_cash_flow
    FROM dws_profit_store_detail_monthly a
    LEFT JOIN dm_city c ON a.city_code = c.city_code
    WHERE length(a.store_code) = 6
)
-- 最后只筛选昨日所在月份的数据
SELECT * FROM summary_data
WHERE month = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m')
ORDER BY statistics_city_name, store_code;