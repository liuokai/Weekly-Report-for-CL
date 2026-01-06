-- 月度利润情况统计（按单月统计）

WITH monthly_aggregate AS (
    -- 第一步：按月汇总全公司基础财务指标
    SELECT
        month AS stat_month,                         -- 月份 (YYYY-MM)
        SUM(main_business_income) AS total_revenue,  -- 营业额汇总
        SUM(net_profit) AS total_profit              -- 利润额汇总
    FROM dws_profit_store_detail_monthly
    WHERE
        month >= '2025-01'
        -- 核心逻辑：动态统计到当前月份（T+1），排除未来月份干扰
        AND month <= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m')
        AND LENGTH(store_code) = 6
    GROUP BY
        1
)
SELECT
    stat_month,
    total_revenue,
    total_profit,

    -- 1. 利润率：(利润 / 营收) * 100，保留 2 位小数
    ROUND(IF(total_revenue = 0, 0, total_profit / total_revenue) * 100, 2) AS profit_rate,

    -- 2. 上月利润率：利用 LAG 获取上一行的利润率数值
    LAG(
        ROUND(IF(total_revenue = 0, 0, total_profit / total_revenue) * 100, 2)
    ) OVER (ORDER BY stat_month) AS last_month_profit_rate,

    -- 3. 利润环比：( (本月利润 - 上月利润) / |上月利润| ) * 100
    ROUND(
        IF(
            LAG(total_profit) OVER (ORDER BY stat_month) = 0,
            NULL,
            (total_profit - LAG(total_profit) OVER (ORDER BY stat_month))
            / ABS(LAG(total_profit) OVER (ORDER BY stat_month))
        ) * 100,
    2) AS mom_growth -- Month-on-Month 环比增长
FROM monthly_aggregate
ORDER BY
    stat_month DESC;