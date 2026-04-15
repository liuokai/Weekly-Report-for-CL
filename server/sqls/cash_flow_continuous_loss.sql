 -- 现金流持续亏损门店



SELECT a.stat_month           AS 'stat_month',-- '统计月份',
       a.quarter_of_month     AS 'quarter_number',-- '月份所属季度',
       a.store_code           AS 'store_code',-- '门店编码',
       a.city_name            AS 'city_name',-- '城市名称',
       a.city_code            AS 'city_code',-- '城市编码',
       a.store_name           AS 'store_name',-- '门店名称',
       a.opening_date         AS 'opening_date',-- '门店开业日期',
       a.main_business_income AS 'main_business_income',-- '主营业务收入',
       a.net_cash_flow        AS 'monthly_cashflow',-- '月度现金流',
       a.qtr_total_cash       AS 'qtr_total_cash',-- '所属季度净现金流量合计',
       a.qtr_avg_cash         AS 'qtr_avg_cash',-- '季度月均净现金流量',
       CASE
           WHEN a.qtr_total_cash < -30000 THEN '持续亏损门店'
           WHEN a.qtr_total_cash >= -30000 AND a.qtr_total_cash < 0 THEN '预警门店'
           ELSE '正常门店'
           END                AS 'store_type', -- 门店预警类型
       b.ramp_up_period       as ramp_up_period, -- 爬坡期长度
       b.ramp_up_end_date     as ramp_up_end_date -- 爬坡期结束日期
FROM (SELECT month                                                                                AS stat_month,
             CONCAT(YEAR(STR_TO_DATE(month, '%Y-%m')), 'Q', QUARTER(STR_TO_DATE(month, '%Y-%m'))) AS quarter_of_month,
             store_code,
             city_name,
             city_code,
             store_name,
             opening_date,
             main_business_income,
             net_cash_flow,
             SUM(net_cash_flow) OVER (
                 PARTITION BY
                     store_code,
                     CONCAT(YEAR(STR_TO_DATE(month, '%Y-%m')), 'Q', QUARTER(STR_TO_DATE(month, '%Y-%m')))
                 )                                                                                AS qtr_total_cash,
             ROUND(
                     SUM(net_cash_flow) OVER (
                         PARTITION BY
                             store_code,
                             CONCAT(YEAR(STR_TO_DATE(month, '%Y-%m')), 'Q', QUARTER(STR_TO_DATE(month, '%Y-%m')))
                         ) / COUNT(month) OVER (
                         PARTITION BY
                             store_code,
                             CONCAT(YEAR(STR_TO_DATE(month, '%Y-%m')), 'Q', QUARTER(STR_TO_DATE(month, '%Y-%m')))
                         ),
                     2
             )                                                                                    AS qtr_avg_cash
      FROM dws_profit_store_detail_monthly a
      WHERE length(store_code) = 6
        and main_business_income > 0
        and month >= DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL (QUARTER(CURRENT_DATE()) ) * 3 MONTH), '%Y-%m')
        AND month < DATE_FORMAT(CURRENT_DATE(), '%Y-%m')) a
         left join (SELECT store_code,
                           store_name,
                           opening_date,
                           ramp_up_period,
                           DATE_ADD(opening_date,
                                    INTERVAL (CASE
                                                  WHEN DAYOFMONTH(opening_date) > 15 THEN ramp_up_period + 1
                                                  ELSE ramp_up_period END) - 1 MONTH
                           )                                AS ramp_up_end_date,
                           CONCAT(YEAR(DATE_ADD(opening_date,
                                                INTERVAL (CASE
                                                              WHEN DAYOFMONTH(opening_date) > 15 THEN ramp_up_period + 1
                                                              ELSE ramp_up_period END) - 1 MONTH
                                       )), 'Q', QUARTER(DATE_ADD(opening_date,
                                                                 INTERVAL (CASE
                                                                               WHEN DAYOFMONTH(opening_date) > 15
                                                                                   THEN ramp_up_period + 1
                                                                               ELSE ramp_up_period END) - 1 MONTH
                                                        ))) AS ramp_up_end_quarter
                    FROM dws_new_store_commission_monthly
                    GROUP BY store_code, store_name, ramp_up_period, opening_date) b on a.store_code = b.store_code
WHERE a.qtr_total_cash < -10000
  and a.quarter_of_month > b.ramp_up_end_quarter
ORDER BY a.store_code, a.stat_month;