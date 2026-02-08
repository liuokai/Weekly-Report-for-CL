-- 2026预算计算

WITH current_info AS (
    -- 定义基准时间：取昨日，并计算其在当月的时间进度
    SELECT
        date_format(days_sub(curdate(), 1), '%Y-%m') as cur_month,
        day(days_sub(curdate(), 1)) as passed_days,
        day(last_day(days_sub(curdate(), 1))) as total_days
),
-- 1. 现存门店基础数据
existing_store_base AS (
    SELECT
        a.month,
        a.city_name,  -- 增加城市字段
        a.revenue_budget,
        a.profit_budget,
        a.cash_flow_budget,
        nvl(b.main_business_income, 0) as revenue_actual,
        nvl(b.net_profit, 0) as profit_actual,
        nvl(b.net_cash_flow, 0) as cash_flow_actual,
        CASE
            WHEN a.month < c.cur_month THEN 1.00000
            WHEN a.month > c.cur_month THEN 0.00000
            ELSE round(cast(c.passed_days as double) / c.total_days, 5)
        END as progress_ratio
    FROM data_warehouse.dws_store_revenue_estimate a
    CROSS JOIN current_info c
    LEFT JOIN data_warehouse.dws_profit_store_detail_monthly b
        ON a.month = b.month AND a.store_code = b.store_code
),
-- 2. 新开门店基础数据
new_store_mapping AS (
    SELECT
        store_code, city_code, city_name,
        row_number() OVER(PARTITION BY city_code ORDER BY opening_time) as store_seq
    FROM data_warehouse.dwd_store_info
    WHERE date(opening_time) >= '2026-01-01'
      AND date(store_info_record_time) = days_sub(curdate(), 1)
),
new_store_base AS (
    SELECT
        b.month,
        b.city_name, -- 从 dws_new_store_revenue_estimate 中获取城市
        b.revenue_budget,
        b.profit_budget,
        b.cash_flow_budget,
        nvl(act.main_business_income, 0) as revenue_actual,
        nvl(act.net_profit, 0) as profit_actual,
        nvl(act.net_cash_flow, 0) as cash_flow_actual,
        CASE
            WHEN b.month < c.cur_month THEN 1.00000
            WHEN b.month > c.cur_month THEN 0.00000
            ELSE round(cast(c.passed_days as double) / c.total_days, 5)
        END as progress_ratio
    FROM (
        SELECT *, dense_rank() OVER(PARTITION BY city_code ORDER BY substring(store_code, 1, 7), store_code) as store_seq
        FROM data_warehouse.dws_new_store_revenue_estimate
    ) b
    CROSS JOIN current_info c
    -- 这里通过 city_code 和 seq 关联 mapping，主要是为了拿到实际值的 store_code
    LEFT JOIN new_store_mapping m ON b.city_code = m.city_code AND b.store_seq = m.store_seq
    LEFT JOIN data_warehouse.dws_profit_store_detail_monthly act
        ON b.month = act.month AND m.store_code = act.store_code
),
-- 3. 合并新老门店数据
combined_base AS (
    SELECT month, city_name, revenue_budget, profit_budget, cash_flow_budget, revenue_actual, profit_actual, cash_flow_actual, progress_ratio FROM existing_store_base
    UNION ALL
    SELECT month, city_name, revenue_budget, profit_budget, cash_flow_budget, revenue_actual, profit_actual, cash_flow_actual, progress_ratio FROM new_store_base
)
-- 4. 城市维度汇总输出
SELECT
    month,
    city_name,
    max(progress_ratio) as progress_ratio,

    -- --- 营收类 (Revenue) ---
    round(sum(revenue_budget), 2) as total_revenue_budget,
    round(sum(revenue_actual), 2) as total_revenue_actual,
    round(sum((1 - progress_ratio) * revenue_budget), 2) as remaining_revenue_budget,
    round(sum(CASE
        WHEN progress_ratio = 1 THEN revenue_actual
        WHEN progress_ratio = 0 THEN revenue_budget
        ELSE revenue_actual + (1 - progress_ratio) * revenue_budget
    END), 2) AS total_revenue_rolling,

    -- --- 利润类 (Profit) ---
    round(sum(profit_budget), 2) as total_profit_budget,
    round(sum(profit_actual), 2) as total_profit_actual,
    round(sum((1 - progress_ratio) * profit_budget), 2) as remaining_profit_budget,
    round(sum(CASE
        WHEN progress_ratio = 1 THEN profit_actual
        WHEN progress_ratio = 0 THEN profit_budget
        ELSE profit_actual + (1 - progress_ratio) * profit_budget
    END), 2) AS total_profit_rolling,

    -- --- 现金流类 (Cash Flow) ---
    round(sum(cash_flow_budget), 2) as total_cash_flow_budget,
    round(sum(cash_flow_actual), 2) as total_cash_flow_actual,
    round(sum((1 - progress_ratio) * cash_flow_budget), 2) as remaining_cash_flow_budget,
    round(sum(CASE
        WHEN progress_ratio = 1 THEN cash_flow_actual
        WHEN progress_ratio = 0 THEN cash_flow_budget
        ELSE cash_flow_actual + (1 - progress_ratio) * cash_flow_budget
    END), 2) AS total_cash_flow_rolling

FROM combined_base
GROUP BY month, city_name
ORDER BY month, city_name;