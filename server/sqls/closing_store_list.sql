-- 闭店预警门店

select a.statistics_city_name                                                     as city_name -- 原字段：城市
     , a.store_code
     , a.store_name
     -- 新增字段：展示为什么要关闭的原因（年度数值汇总）
     , sum(a.specified_cost)                                                       as annual_specified_cost -- 原字段：年度指定成本(人工+固定)
     , sum(a.main_income)                                                          as annual_main_income -- 原字段：年度主营业务收入
     , group_concat(if(a.is_cost_condition_met = 1, a.quarter, null) ORDER BY a.quarter) as over_cost_quarters -- 原字段：人工成本和房租成本超100%的季度
     , sum(is_cost_condition_met)                                                  as cost_condition_met_count -- 原字段：2025指定成本满足条件次数
     , if(group_concat(if(a.is_cost_condition_met = 1, a.quarter, null) ORDER BY a.quarter) in ('1,2,3', '2,3,4', '1,2,3,4'),
          '是', '否')                                                             as is_closing_triggered -- 原字段：是否触发关闭条件
     , if(max(a.is_cash_loss_satisfied) = 1, '是', '否')                          as is_cash_loss_over_depreciation_threshold -- 原字段：202512现金流亏损是否大于总折旧50%
from (select a.statistics_city_name,
             a.store_code,
             a.store_name,
             a.quarter,
             group_concat(a.month)                        as month_concat, -- 原字段：月份拼接
             sum(nvl(a.labor_cost, 0) + nvl(a.fixed_cost, 0)) as specified_cost, -- 原字段：指定成本
             sum(nvl(a.main_income, 0))                  as main_income, -- 原字段：主营业务收入
             if(sum(nvl(a.labor_cost, 0) + nvl(a.fixed_cost, 0)) > sum(nvl(a.main_income, 0)), 1,
                0)                                        as is_cost_condition_met, -- 原字段：指定成本是否满足条件
             max(a.is_cash_loss_satisfied)                as is_cash_loss_satisfied -- 原字段：现金流亏损是否满足条件
      from (select a.month,
                   a.city_code,
                   d.statistics_city_name,
                   a.city_name,
                   a.store_code,
                   a.store_name,
                   QUARTER(CONCAT(a.month, '-01'))     as quarter, -- 原字段：季度
                   sum(nvl(a.main_business_income, 0)) as main_income, -- 原字段：主营业务收入
                   sum(nvl(a.labor_cost, 0))           as labor_cost, -- 原字段：人工成本
                   sum(nvl(a.fixed_cost, 0))           as fixed_cost, -- 原字段：固定成本
                   sum(nvl(a.depreciation_fee, 0))     as monthly_depreciation, -- 原字段：月折旧
                   sum(nvl(b.depreciation_charge, 0))  as total_depreciation, -- 原字段：总折旧
                   sum(nvl(a.net_cash_flow, 0))        as monthly_cash_flow, -- 原字段：月现金流
                   sum(nvl(c.cash_flow, 0))            as cumulative_cash_flow, -- 原字段：累计现金流
                   if((a.month = '2025-12' and sum(nvl(-c.cash_flow, 0)) > sum(nvl(b.depreciation_charge, 0)) * 0.5), 1,
                      0)                               as is_cash_loss_satisfied, -- 原字段：现金流亏损是否满足条件
                   round(sum(nvl(b.depreciation_charge, 0)) / nvl(NULLIF(sum(nvl(a.net_cash_flow, 0)), 0), 1),
                         2)                            as monthly_payback_period, -- 原字段：月投资回收期
                   round(sum(nvl(b.depreciation_charge, 0)) / nvl(NULLIF(sum(nvl(c.net_cash_flow, 0)), 0), 1),
                         2)                            as cumulative_payback_period -- 原字段：累计投资回收期
            from dws_profit_store_detail_monthly a
                     left join dm_city d on a.city_code = d.city_code
                     left join tmp_store_depreciation_charge b on a.store_code = b.store_code
                     left join (select a.store_code,
                                       a.store_name,
                                       a.month,
                                       nvl(a.net_cash_flow, 0)      as net_cash_flow,
                                       sum(nvl(b.net_cash_flow, 0)) as cash_flow
                                from dws_profit_store_detail_monthly a
                                         left join dws_profit_store_detail_monthly b
                                                   on a.store_code = b.store_code and a.month >= b.month
                                where a.month <= DATE_FORMAT(CURRENT_DATE(), '%Y-%m')
                                  and a.store_code <> '01'
                                group by a.store_code, a.store_name, a.month, a.net_cash_flow
                                order by a.store_code, a.store_name, a.month desc) c
                               on a.store_code = c.store_code and a.month = c.month
            where left(a.month, 4) = '2025'
              and a.store_code <> '01'
              and nvl(a.main_business_income, 0) > 0
            group by a.month, a.city_code, d.statistics_city_name, a.city_name, a.store_code, a.store_name, a.main_business_income,
                     a.labor_cost,
                     a.fixed_cost, a.depreciation_fee, b.depreciation_charge, a.net_cash_flow, c.cash_flow,
                     c.net_cash_flow
            order by a.month desc, a.city_code, a.city_name) a
      group by a.statistics_city_name, a.store_code, a.store_name, a.quarter
      order by a.quarter) a
group by a.statistics_city_name, a.store_code, a.store_name
having if(group_concat(if(a.is_cost_condition_met = 1, a.quarter, null) ORDER BY a.quarter) in ('1,2,3', '2,3,4', '1,2,3,4'),
          '是', '否') = '是'