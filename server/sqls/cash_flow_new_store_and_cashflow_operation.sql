-- 新店投资与现金流运营情况 

-- ==========================================================
-- 整合版：含百分比格式达成率及累计资金结余报表
-- ==========================================================

WITH current_info AS (
    -- 定义当前月份，用于严格锁定报表的时间范围
    SELECT
        date_format(days_sub(curdate(), 1), '%Y-%m') as cur_month
),

-- 1. 26年新店基础信息（用于锁定投资支出范围）
new_store_info as (
    select
        store_code,
        city_name,
        date_format(opening_time, '%Y-%m') as opening_month
    from dwd_store_info
    where date(store_info_record_time) = days_sub(curdate(), 1)
      and date(opening_time) >= '2026-01-01'
      and is_invalid_store = '否'
),

-- 2. 城市上一年度结余初始值
city_initial_balance as (
    select '北京市' as city_name, -3800000 as init_bal union all
    select '上海市', 840000 union all
    select '广州市', 1190000 union all
    select '深圳市', 3970000 union all
    select '成都市', 31660000 union all
    select '重庆市', 7770000 union all
    select '杭州市', 270000 union all
    select '南京市', 50000 union all
    select '宁波市', -170000
),

-- 3. 主表：实际经营现金流汇总（全城市现存门店）
actual_cash_flow_monthly as (
    select
        b.statistics_city_name as city_name,
        a.month,
        sum(a.net_cash_flow) as monthly_cash_flow_actual
    from dws_profit_store_detail_monthly a
    left join dm_city b on a.city_code = b.city_code
    cross join current_info ci
    where a.month >= '2026-01'
      and a.month <= ci.cur_month
    group by 1, 2
),

-- 4. 辅助表：新店月度投资额
investment_monthly as (
    select
        b.city_name,
        b.opening_month as month,
        sum(a.initial_investment_amount) as monthly_investment
    from data_warehouse.dws_store_initial_investment a
    join new_store_info b on a.store_code = b.store_code
    where a.invest_type = '新店'
    group by 1, 2
),

-- 5. 辅助表：现金流预算汇总
budget_monthly as (
    SELECT
        month,
        city_name,
        sum(cash_flow_budget) as monthly_cash_flow_budget
    FROM (
        SELECT month, city_name, cash_flow_budget FROM data_warehouse.dws_store_revenue_estimate
        UNION ALL
        SELECT month, city_name, cash_flow_budget FROM data_warehouse.dws_new_store_revenue_estimate
    ) t
    GROUP BY month, city_name
),

-- 6. 以实际现金流主表为核心进行关联
city_monthly_base as (
    select
        main.city_name,
        main.month,
        coalesce(main.monthly_cash_flow_actual, 0) as monthly_cash_flow_actual,
        coalesce(i.monthly_investment, 0) as monthly_investment,
        coalesce(bg.monthly_cash_flow_budget, 0) as monthly_cash_flow_budget,
        coalesce(b.init_bal, 0) as init_bal
    from actual_cash_flow_monthly main
    left join investment_monthly i on main.city_name = i.city_name and main.month = i.month
    left join budget_monthly bg on main.city_name = bg.city_name and main.month = bg.month
    left join city_initial_balance b on main.city_name = b.city_name
),

-- 7. 构造“合计”行
combined_with_total as (
    select * from city_monthly_base
    union all
    select
        '合计' as city_name,
        month,
        sum(monthly_cash_flow_actual),
        sum(monthly_investment),
        sum(monthly_cash_flow_budget),
        sum(init_bal)
    from city_monthly_base
    group by month
),

-- 8. 计算累计值
final_accumulated as (
    select
        month,
        city_name,
        init_bal,
        sum(monthly_investment) over(partition by city_name order by month) as cum_investment,
        sum(monthly_cash_flow_actual) over(partition by city_name order by month) as cum_cash_flow_actual,
        sum(monthly_cash_flow_budget) over(partition by city_name order by month) as cum_cash_flow_budget
    from combined_with_total
)

-- 9. 最终输出
select
    month as '月份',
    city_name as '城市',
    round(cum_investment, 2) as '截止当月累计新店投资',
    round(cum_cash_flow_actual, 2) as '截止当月累计经营现金流',
    round(cum_cash_flow_budget, 2) as '截止当月累计现金流预算值',
    -- 达成率：转换为百分比字符串
    concat(round(cum_cash_flow_actual / nullif(cum_cash_flow_budget, 0) * 100, 2), '%') as '现金流达成率',
    round((init_bal - cum_investment + cum_cash_flow_actual), 2) as '截止当月累计资金结余'
from final_accumulated
order by
    month,
    (case when city_name = '合计' then 1 else 0 end),
    city_name;