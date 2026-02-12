-- 现金流持续亏损门店

SELECT
    concat(year,'-Q',quarter_number) AS quarter, -- 原字段：季度
    b.statistics_city_name as city_name, -- 原字段：城市名称
    a.`store_name` AS store_name, -- 原字段：门店名称
    a.`store_code` AS store_code, -- 原字段：门店编码
    c.city_manager_name as city_manager_name, -- 原字段：城市总
    c.technology_vice_name as technology_vice_name, -- 原字段：技术副总
    `opening_date` AS opening_date, -- 原字段：开业日期
    `ramp_up_period_months` AS ramp_up_period_months, -- 原字段：爬坡期
    `ramp_up_end_month` AS ramp_up_end_month, -- 原字段：爬坡期结束月份
    `cashflow_assessment_start_date` AS cash_flow_assessment_start_date, -- 原字段：门店考核现金流亏损开始日期
    `cashflow_assessment_end_date` AS cash_flow_assessment_end_date, -- 原字段：门店考核现金流亏损结束日期
    `is_cashflow_assessed_this_quarter` AS is_cash_flow_assessed_quarter, -- 原字段：该季度是否考核现金流
    `quarterly_net_profit` AS quarterly_net_profit, -- 原字段：季度净利润
    `quarterly_depreciation` AS quarterly_depreciation, -- 原字段：季度折旧
    `quarterly_cashflow` AS quarterly_cash_flow, -- 原字段：季度现金流
    `quarterly_cashflow_deduction_standard` AS quarterly_cash_flow_deduction_standard, -- 原字段：季度现金流考核扣款标准
    `quarterly_cashflow_deduction_amount` AS quarterly_cash_flow_deduction_amount -- 原字段：季度现金流考核扣款
FROM dws_single_store_quarterly_cashflow_loss_statistics a
left join dm_city b on a.city_code = b.city_code
left join tmp_manager_store_mapping c on a.store_code = c.store_code
WHERE
    concat(year,'-Q',quarter_number) >= '2025-Q1'
    -- 基础条件：爬坡期已结束且该季度属于考核期
    AND ramp_up_end_month < DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m')
    AND is_cashflow_assessed_this_quarter = '是'
    AND quarterly_cashflow_assessment = 1 -- 季度现金流亏损超过 3 万元
    AND (CAST(`year` AS SIGNED) * 4 + `quarter_number`) >= (
    YEAR(DATE_SUB(CURDATE(), INTERVAL 1 DAY)) * 4 +
    QUARTER(DATE_SUB(CURDATE(), INTERVAL 1 DAY)) - 2  ) -- 最近 3 个季度内的数据
order by concat(year,'-Q',quarter_number);