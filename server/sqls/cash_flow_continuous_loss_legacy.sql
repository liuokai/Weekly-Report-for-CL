-- 现金流持续亏损门店（季度粒度，供旧版卡片组件使用）

SELECT concat(year, '-Q', quarter_number)      AS quarter,
       b.statistics_city_name                  as city_name,
       a.`store_name`                          AS store_name,
       a.`store_code`                          AS store_code,
       c.city_manager_name                     as city_manager_name,
       c.technology_vice_name                  as technology_vice_name,
       `opening_date`                          AS opening_date,
       `ramp_up_period_months`                 AS ramp_up_period_months,
       `ramp_up_end_month`                     AS ramp_up_end_month,
       `cashflow_assessment_start_date`        AS cash_flow_assessment_start_date,
       `cashflow_assessment_end_date`          AS cash_flow_assessment_end_date,
       `is_cashflow_assessed_this_quarter`     AS is_cash_flow_assessed_quarter,
       `quarterly_net_profit`                  AS quarterly_net_profit,
       `quarterly_depreciation`               AS quarterly_depreciation,
       `quarterly_cashflow`                    AS quarterly_cash_flow,
       `quarterly_cashflow_deduction_standard` AS quarterly_cash_flow_deduction_standard,
       `quarterly_cashflow_deduction_amount`   AS quarterly_cash_flow_deduction_amount
FROM dws_single_store_quarterly_cashflow_loss_statistics a
         left join dm_city b on a.city_code = b.city_code
         left join tmp_manager_store_mapping c on a.store_code = c.store_code
WHERE concat(year, '-Q', quarter_number) >= '2025-Q1'
  AND ramp_up_end_month < DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m')
  AND is_cashflow_assessed_this_quarter = '是'
  AND quarterly_cashflow_assessment = 1
  AND (CAST(`year` AS SIGNED) * 4 + `quarter_number`) >= (
    YEAR(DATE_SUB(CURDATE(), INTERVAL 1 DAY)) * 4 +
    QUARTER(DATE_SUB(CURDATE(), INTERVAL 1 DAY)) - 2)
order by concat(year, '-Q', quarter_number);
