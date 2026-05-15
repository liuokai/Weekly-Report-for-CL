
-- 2026预算计算

WITH current_info AS (SELECT date_format(days_sub(curdate(), 1), '%Y-%m') as cur_month,
                             day(days_sub(curdate(), 1))                  as passed_days,
                             day(last_day(days_sub(curdate(), 1)))        as total_days),
     old_store_base AS (SELECT a.month,
                               a.city_name,
                               a.revenue_budget,
                               a.profit_budget,
                               a.cash_flow_budget,
                               nvl(b.main_business_income, 0) as revenue_actual,
                               nvl(b.net_profit, 0)           as profit_actual,
                               nvl(b.net_cash_flow, 0)        as cash_flow_actual,
                               CASE
                                   WHEN a.month < c.cur_month THEN 1.00000
                                   WHEN a.month > c.cur_month THEN 0.00000
                                   ELSE round(cast(c.passed_days as double) / c.total_days, 5)
                                   END                        as progress_ratio
                        FROM data_warehouse.dws_store_revenue_estimate a
                                 CROSS JOIN current_info c
                                 LEFT JOIN data_warehouse.dws_profit_store_detail_monthly b
                                           ON a.month = b.month AND a.store_code = b.store_code
                        where a.open_date < '2026-01-01'),
     new_store_mapping AS (SELECT store_code,
                                  city_code,
                                  city_name,
                                  row_number() OVER (PARTITION BY city_code ORDER BY opening_time) as store_seq
                           FROM data_warehouse.dwd_store_info
                           WHERE date(opening_time) >= '2026-01-01'
                             AND date(store_info_record_time) = days_sub(curdate(), 1)),
     new_store_base AS (SELECT b.month,
                               b.city_name,
                               b.revenue_budget,
                               b.profit_budget,
                               b.cash_flow_budget,
                               nvl(act.main_business_income, 0) as revenue_actual,
                               nvl(act.net_profit, 0)           as profit_actual,
                               nvl(act.net_cash_flow, 0)        as cash_flow_actual,
                               CASE
                                   WHEN b.month < c.cur_month THEN 1.00000
                                   WHEN b.month > c.cur_month THEN 0.00000
                                   ELSE round(cast(c.passed_days as double) / c.total_days, 5)
                                   END                          as progress_ratio
                        FROM (SELECT *,
                                     dense_rank() OVER (PARTITION BY city_code ORDER BY substring(store_code, 1, 7), store_code) as store_seq
                              FROM data_warehouse.dws_new_store_revenue_estimate) b
                                 CROSS JOIN current_info c
                                 LEFT JOIN new_store_mapping m
                                           ON b.city_code = m.city_code AND b.store_seq = m.store_seq
                                 LEFT JOIN data_warehouse.dws_profit_store_detail_monthly act
                                           ON b.month = act.month AND m.store_code = act.store_code),
     combined_base AS (SELECT month,
                              city_name,
                              revenue_budget,
                              profit_budget,
                              cash_flow_budget,
                              revenue_actual,
                              profit_actual,
                              cash_flow_actual,
                              progress_ratio,
                              '老店' as store_type
                       FROM old_store_base
                       UNION ALL
                       SELECT month,
                              city_name,
                              revenue_budget,
                              profit_budget,
                              cash_flow_budget,
                              revenue_actual,
                              profit_actual,
                              cash_flow_actual,
                              progress_ratio,
                              '新店' as store_type
                       FROM new_store_base)
SELECT month                                                                  AS 月份,
       city_name                                                              AS 城市名称,
       max(progress_ratio)                                                    as 时间进度,

       round(sum(CASE WHEN store_type = '老店' THEN revenue_budget END), 2)   as '老店营业额-预算',
       round(sum(CASE WHEN store_type = '老店' THEN revenue_actual END), 2)   as '老店营业额-实际',
       round(sum(CASE WHEN store_type = '老店' THEN (1 - progress_ratio) * revenue_budget END),
             2)                                                               as '老店剩余营业额-预算',
       round(sum(CASE
                     WHEN store_type = '老店' THEN
                         CASE
                             WHEN progress_ratio = 1 THEN revenue_actual
                             WHEN progress_ratio = 0 THEN revenue_budget
                             ELSE revenue_actual + (1 - progress_ratio) * revenue_budget
                             END
           END),
             2)                                                               AS '老店营业额-滚动预测',

       round(sum(CASE WHEN store_type = '新店' THEN revenue_budget END), 2)   as '新店营业额-预算',
       round(sum(CASE WHEN store_type = '新店' THEN revenue_actual END), 2)   as '新店营业额-实际',
       round(sum(CASE WHEN store_type = '新店' THEN (1 - progress_ratio) * revenue_budget END),
             2)                                                               as '新店剩余营业额-预算',
       round(sum(CASE
                     WHEN store_type = '新店' THEN
                         CASE
                             WHEN progress_ratio = 1 THEN revenue_actual
                             WHEN progress_ratio = 0 THEN revenue_budget
                             ELSE revenue_actual + (1 - progress_ratio) * revenue_budget
                             END
           END),
             2)                                                               AS '新店营业额-滚动预测',

       round(sum(CASE WHEN store_type = '老店' THEN profit_budget END), 2)    as '老店利润-预算',
       round(sum(CASE WHEN store_type = '老店' THEN profit_actual END), 2)    as '老店利润-实际',
       round(sum(CASE WHEN store_type = '老店' THEN (1 - progress_ratio) * profit_budget END),
             2)                                                               as '老店剩余利润-预算',
       round(sum(CASE
                     WHEN store_type = '老店' THEN
                         CASE
                             WHEN progress_ratio = 1 THEN profit_actual
                             WHEN progress_ratio = 0 THEN profit_budget
                             ELSE profit_actual + (1 - progress_ratio) * profit_budget
                             END
           END),
             2)                                                               AS '老店利润-滚动预测',

       round(sum(CASE WHEN store_type = '新店' THEN profit_budget END), 2)    as '新店利润-预算',
       round(sum(CASE WHEN store_type = '新店' THEN profit_actual END), 2)    as '新店利润-实际',
       round(sum(CASE WHEN store_type = '新店' THEN (1 - progress_ratio) * profit_budget END),
             2)                                                               as '新店剩余利润-预算',
       round(sum(CASE
                     WHEN store_type = '新店' THEN
                         CASE
                             WHEN progress_ratio = 1 THEN profit_actual
                             WHEN progress_ratio = 0 THEN profit_budget
                             ELSE profit_actual + (1 - progress_ratio) * profit_budget
                             END
           END),
             2)                                                               AS '新店利润滚动-预测',

       round(sum(CASE WHEN store_type = '老店' THEN cash_flow_budget END), 2) as '老店现金流-预算',
       round(sum(CASE WHEN store_type = '老店' THEN cash_flow_actual END), 2) as '老店现金流-实际',
       round(sum(CASE WHEN store_type = '老店' THEN (1 - progress_ratio) * cash_flow_budget END),
             2)                                                               as '老店剩余现金流-预算',
       round(sum(CASE
                     WHEN store_type = '老店' THEN
                         CASE
                             WHEN progress_ratio = 1 THEN cash_flow_actual
                             WHEN progress_ratio = 0 THEN cash_flow_budget
                             ELSE cash_flow_actual + (1 - progress_ratio) * cash_flow_budget
                             END
           END),
             2)                                                               AS '老店现金流-滚动预测',

       round(sum(CASE WHEN store_type = '新店' THEN cash_flow_budget END), 2) as '新店现金流-预算',
       round(sum(CASE WHEN store_type = '新店' THEN cash_flow_actual END), 2) as '新店现金流-实际',
       round(sum(CASE WHEN store_type = '新店' THEN (1 - progress_ratio) * cash_flow_budget END),
             2)                                                               as '新店剩余现金流-预算',
       round(sum(CASE
                     WHEN store_type = '新店' THEN
                         CASE
                             WHEN progress_ratio = 1 THEN cash_flow_actual
                             WHEN progress_ratio = 0 THEN cash_flow_budget
                             ELSE cash_flow_actual + (1 - progress_ratio) * cash_flow_budget
                             END
           END), 2)                                                           AS '新店现金流-滚动预测'

FROM combined_base
GROUP BY month, city_name
ORDER BY month, city_name;