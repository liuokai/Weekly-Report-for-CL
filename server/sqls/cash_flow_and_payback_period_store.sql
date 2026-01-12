-- 门店维度统计现金流与投资回收期

select a.month,
       c.statistics_city_name,
       a.store_code,
       a.store_name,
       -- 基础财务指标
       sum(a.depreciation_fee)                                                                as 月折旧,
       sum(b.depreciation_charge)                                                             as 总折旧,
       sum(a.net_cash_flow)                                                                   as 月现金流,
       sum(a.cumulative_net_cash_flow)                                                        as 累计现金流,
       sum(a.cumulative_monthly_average_net_cash_flow)                                        as 月平均现金流,
       -- 回收期计算（增加 NULLIF 处理分母为 0 的情况，防止报错）
       round(sum(b.depreciation_charge) / nullif(sum(a.net_cash_flow), 0), 2)                 as 月投资回收期,
       round(sum(b.depreciation_charge) / nullif(sum(a.cumulative_monthly_average_net_cash_flow), 0), 2) as 累计投资回收期
from dws_profit_store_detail_monthly a
left join tmp_store_depreciation_charge b on a.store_code = b.store_code
left join dm_city c on a.city_code = c.city_code
where a.month <= DATE_FORMAT(CURRENT_DATE(), '%Y-%m')
  and a.main_business_income > 0
  and length(a.store_code) = 6
-- 核心变更：按月份、城市、门店编码、门店名称进行分组
group by a.month,
         c.statistics_city_name,
         a.store_code,
         a.store_name
-- 排序：按月份倒序，再按门店编码正序
order by a.month desc,
         a.store_code asc;