-- 城市维度统计现金流与投资回收期

select a.month,
       c.statistics_city_name,
       count(distinct a.store_code)                                                           as 门店数,
       sum(a.depreciation_fee)                                                                as 月折旧,
       sum(b.depreciation_charge)                                                             as 总折旧,
       sum(a.net_cash_flow)                                                                   as 月现金流,
       sum(a.cumulative_net_cash_flow)                                                        as 累计现金流,
       -- 平均现金流用来计算投资回收期
       sum(a.cumulative_monthly_average_net_cash_flow)                                        as 月平均现金流,
       round(sum(b.depreciation_charge) / sum(a.net_cash_flow), 2)                            as 月投资回收期,
       round(sum(b.depreciation_charge) / sum(a.cumulative_monthly_average_net_cash_flow), 2) as 累计投资回收期
from dws_profit_store_detail_monthly a
left join tmp_store_depreciation_charge b on a.store_code = b.store_code
left join dm_city c on a.city_code = c.city_code
where a.month <= DATE_FORMAT(CURRENT_DATE(), '%Y-%m') and a.main_business_income > 0 and length(a.store_code) = 6
group by a.month,c.statistics_city_name
order by a.month desc,c.statistics_city_name;