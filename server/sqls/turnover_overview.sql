-- 按年计算营业额、同比增长率

WITH year_list AS (
    -- 近三年年份（可按需调整）
    SELECT YEAR(CURRENT_DATE) AS year UNION ALL
    SELECT YEAR(CURRENT_DATE) - 1 UNION ALL
    SELECT YEAR(CURRENT_DATE) - 2
),

base_date AS (
    -- 以最新一年“截至昨日”的月-日作为统一区间
    SELECT
        DATE_FORMAT(CURRENT_DATE, '%m-%d') AS cur_mmdd
),

annual_turnover AS (
    -- 年度累计营业额（完整自然年，不改变原始口径）
    SELECT
        YEAR(off_clock_time) AS year,
        SUM(order_actual_payment) AS total_turnover
    FROM data_warehouse.dwd_sales_order_detail
    GROUP BY YEAR(off_clock_time)
),

same_period_turnover AS (
    -- 各年份同时间区间内的营业额
    SELECT
        y.year,
        SUM(t.order_actual_payment) AS same_period_turnover
    FROM year_list y
    CROSS JOIN base_date b
    LEFT JOIN data_warehouse.dwd_sales_order_detail t
        ON t.off_clock_time >= CONCAT(y.year, '-01-01')
       AND t.off_clock_time <  CONCAT(y.year, '-', b.cur_mmdd)
    GROUP BY y.year
),

last_year_same_period AS (
    -- 去年同期营业额
    SELECT
        y.year,
        SUM(t.order_actual_payment) AS last_year_same_period_turnover
    FROM year_list y
    CROSS JOIN base_date b
    LEFT JOIN data_warehouse.dwd_sales_order_detail t
        ON t.off_clock_time >= CONCAT(y.year - 1, '-01-01')
       AND t.off_clock_time <  CONCAT(y.year - 1, '-', b.cur_mmdd)
    GROUP BY y.year
)
SELECT
    y.year,

    a.total_turnover,

    s.same_period_turnover,

    l.last_year_same_period_turnover,

    CASE
        WHEN l.last_year_same_period_turnover = 0
             OR l.last_year_same_period_turnover IS NULL
        THEN NULL
        ELSE ROUND(
            (s.same_period_turnover - l.last_year_same_period_turnover)
            / l.last_year_same_period_turnover
            * 100,
            2
        )
    END AS yoy_rate

FROM year_list y
LEFT JOIN annual_turnover a
    ON y.year = a.year
LEFT JOIN same_period_turnover s
    ON y.year = s.year
LEFT JOIN last_year_same_period l
    ON y.year = l.year
ORDER BY y.year DESC;