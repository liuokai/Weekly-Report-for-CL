-- 新店投资与现金流运营情况 

-- 1. 26年新店基础信息（用于锁定投资范围）
with
    new_store_2026 as (
        select
            store_code,
            city_name,
            date_format(opening_time, '%Y-%m') as opening_month
        from dwd_store_info
        where date(store_info_record_time) = curdate()
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

-- 3. 按城市、月份汇总“新店”投资金额
investment_monthly as (
    select
        b.city_name,
        b.opening_month as month,
        sum(a.initial_investment_amount) as monthly_investment
    from data_warehouse.dws_store_initial_investment a
    join new_store_2026 b on a.store_code = b.store_code
    where a.invest_type = '新店'
    group by 1, 2
),

-- 4. 按城市、月份汇总“全城市门店”经营现金流
total_cash_flow_monthly as (
    select
        b.statistics_city_name as city_name,
        a.month,
        sum(a.net_cash_flow) as monthly_cash_flow
    from dws_profit_store_detail_monthly a
    left join dm_city b on a.city_code = b.city_code
    where a.month >= '2026-01'
      and a.month <= date_format(date_sub(curdate(), interval 1 day), '%Y-%m')
    group by 1, 2
),

-- 5. 合并维度并关联基础数据
combined_base as (
    select
        d.city_name,
        d.month,
        coalesce(i.monthly_investment, 0) as monthly_investment,
        coalesce(c.monthly_cash_flow, 0) as monthly_cash_flow,
        b.init_bal
    from (
        select city_name, month from investment_monthly
        union
        select city_name, month from total_cash_flow_monthly
    ) d
    left join investment_monthly i on d.city_name = i.city_name and d.month = i.month
    left join total_cash_flow_monthly c on d.city_name = c.city_name and d.month = c.month
    left join city_initial_balance b on d.city_name = b.city_name
),

-- 6. 计算累计值并按要求输出
final_accumulated as (
    select
        month as '月份',
        city_name as '城市',
        -- 累计新店投资
        sum(monthly_investment) over(partition by city_name order by month) as '截止当月累计新店投资',
        -- 累计全城经营现金流
        sum(monthly_cash_flow) over(partition by city_name order by month) as '截止当月累计经营现金流',
        init_bal
    from combined_base
)

-- 最终结果：计算结余
select
    月份,
    城市,
    截止当月累计新店投资,
    截止当月累计经营现金流,
    (init_bal - 截止当月累计新店投资 + 截止当月累计经营现金流) as '截止当月累计资金结余'
from final_accumulated
order by 城市, 月份;