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
        store_code, city_code,
        row_number() OVER(PARTITION BY city_code ORDER BY opening_time) as store_seq
    FROM data_warehouse.dwd_store_info
    WHERE date(opening_time) >= '2026-01-01'
      AND date(store_info_record_time) = days_sub(curdate(), 1)
),
new_store_base AS (
    SELECT
        b.month,
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
    LEFT JOIN new_store_mapping m ON b.city_code = m.city_code AND b.store_seq = m.store_seq
    LEFT JOIN data_warehouse.dws_profit_store_detail_monthly act
        ON b.month = act.month AND m.store_code = act.store_code
),
-- 3. 合并新老门店数据
combined_base AS (
    SELECT * FROM existing_store_base
    UNION ALL
    SELECT * FROM new_store_base
)
-- 4. 公司层级汇总输出 (包含：预算值、实际值、剩余预算值、滚动预测值)
SELECT
    month,
    max(progress_ratio) as progress_ratio,

    -- --- 营收类 (Revenue) ---
    round(sum(revenue_budget), 2) as total_revenue_budget,
    round(sum(revenue_actual), 2) as total_revenue_actual,
    -- 营收剩余预算：(1 - 进度) * 预算
    round(sum((1 - progress_ratio) * revenue_budget), 2) as remaining_revenue_budget,
    round(sum(CASE
        WHEN progress_ratio = 1 THEN revenue_actual
        WHEN progress_ratio = 0 THEN revenue_budget
        ELSE revenue_actual + (1 - progress_ratio) * revenue_budget
    END), 2) AS total_revenue_rolling,

    -- --- 利润类 (Profit) ---
    round(sum(profit_budget), 2) as total_profit_budget,
    round(sum(profit_actual), 2) as total_profit_actual,
    -- 利润剩余预算：(1 - 进度) * 预算
    round(sum((1 - progress_ratio) * profit_budget), 2) as remaining_profit_budget,
    round(sum(CASE
        WHEN progress_ratio = 1 THEN profit_actual
        WHEN progress_ratio = 0 THEN profit_budget
        ELSE profit_actual + (1 - progress_ratio) * profit_budget
    END), 2) AS total_profit_rolling,

    -- --- 现金流类 (Cash Flow) ---
    round(sum(cash_flow_budget), 2) as total_cash_flow_budget,
    round(sum(cash_flow_actual), 2) as total_cash_flow_actual,
    -- 现金流剩余预算：(1 - 进度) * 预算
    round(sum((1 - progress_ratio) * cash_flow_budget), 2) as remaining_cash_flow_budget,
    round(sum(CASE
        WHEN progress_ratio = 1 THEN cash_flow_actual
        WHEN progress_ratio = 0 THEN cash_flow_budget
        ELSE cash_flow_actual + (1 - progress_ratio) * cash_flow_budget
    END), 2) AS total_cash_flow_rolling

FROM combined_base
GROUP BY month
ORDER BY month;