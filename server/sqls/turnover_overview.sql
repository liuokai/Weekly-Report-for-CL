-- 年度营业额统计

WITH base_info AS (
    -- 统一取数基准，避免多次调用 CURRENT_DATE 导致极微小的差异
    SELECT
        CURRENT_DATE AS today,
        DATE_FORMAT(CURRENT_DATE, '%m-%d') AS cur_mmdd
),

year_list AS (
    -- 近三年年份
    SELECT YEAR(today) AS year FROM base_info UNION ALL
    SELECT YEAR(today) - 1 FROM base_info UNION ALL
    SELECT YEAR(today) - 2 FROM base_info
),

annual_turnover AS (
    -- 年度累计营业额：增加 < TODAY 过滤，确保 2026 年只统计到 2026-01-11 23:59:59
    SELECT
        YEAR(off_clock_time) AS year,
        SUM(order_actual_payment) AS total_turnover
    FROM data_warehouse.dwd_sales_order_detail
    WHERE off_clock_time < (SELECT today FROM base_info)
    GROUP BY YEAR(off_clock_time)
),

same_period_turnover AS (
    -- 各年份同时间区间内的营业额
    SELECT
        y.year,
        SUM(t.order_actual_payment) AS same_period_turnover
    FROM year_list y
    CROSS JOIN base_info b
    LEFT JOIN data_warehouse.dwd_sales_order_detail t
        ON t.off_clock_time >= CONCAT(y.year, '-01-01')
       AND t.off_clock_time <  CONCAT(y.year, '-', b.cur_mmdd)
    GROUP BY y.year
),

last_year_same_period AS (
    -- 去年同期营业额：逻辑同上，但偏移一年
    SELECT
        y.year,
        SUM(t.order_actual_payment) AS last_year_same_period_turnover
    FROM year_list y
    CROSS JOIN base_info b
    LEFT JOIN data_warehouse.dwd_sales_order_detail t
        ON t.off_clock_time >= CONCAT(y.year - 1, '-01-01')
       AND t.off_clock_time <  CONCAT(y.year - 1, '-', b.cur_mmdd)
    GROUP BY y.year
)

SELECT
    y.year,
    -- 年度总额（2026年现在将与 same_period 保持一致）
    IFNULL(a.total_turnover, 0) AS total_turnover,
    -- 今年截至昨日
    IFNULL(s.same_period_turnover, 0) AS same_period_turnover,
    -- 去年截至昨日同期
    IFNULL(l.last_year_same_period_turnover, 0) AS last_year_same_period_turnover,
    -- 同比增长率计算
    CASE
        WHEN l.last_year_same_period_turnover = 0 OR l.last_year_same_period_turnover IS NULL
        THEN NULL
        ELSE ROUND(
            (s.same_period_turnover - l.last_year_same_period_turnover)
            / l.last_year_same_period_turnover
            * 100,
            2
        )
    END AS yoy_rate
FROM year_list y
LEFT JOIN annual_turnover a ON y.year = a.year
LEFT JOIN same_period_turnover s ON y.year = s.year
LEFT JOIN last_year_same_period l ON y.year = l.year
ORDER BY y.year DESC;