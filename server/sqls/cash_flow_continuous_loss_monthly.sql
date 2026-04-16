-- 现金流持续亏损门店月度明细（用于列表表格展示）
-- 返回符合持续亏损条件的门店，按月度展示现金流数据

SELECT b.statistics_city_name                   AS city_name,        -- 城市名称
       a.store_code                             AS store_code,       -- 门店编码
       a.store_name                             AS store_name,       -- 门店名称
       YEAR(a.opening_date)                     AS opening_year,     -- 开业年份
       a.opening_date                           AS opening_date,     -- 开业时间
       a.`year`                                 AS year,             -- 年份
       a.quarter_number                         AS quarter_number,   -- 季度编号
       a.month_number                           AS month_number,     -- 月份编号（1-12）
       a.monthly_cashflow                       AS monthly_cashflow  -- 月度现金流
FROM dws_single_store_monthly_cashflow_loss_statistics a
         LEFT JOIN dm_city b ON a.city_code = b.city_code
WHERE -- 只取符合持续亏损考核条件的门店（与季度表逻辑一致）
    a.store_code IN (
        SELECT store_code
        FROM dws_single_store_quarterly_cashflow_loss_statistics
        WHERE concat(year, '-Q', quarter_number) >= '2025-Q1'
          AND ramp_up_end_month < DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m')
          AND is_cashflow_assessed_this_quarter = '是'
          AND quarterly_cashflow_assessment = 1
          AND (CAST(`year` AS SIGNED) * 4 + quarter_number) >= (
              YEAR(DATE_SUB(CURDATE(), INTERVAL 1 DAY)) * 4 +
              QUARTER(DATE_SUB(CURDATE(), INTERVAL 1 DAY)) - 2)
    )
  AND concat(a.year, '-Q', a.quarter_number) >= '2025-Q1'
ORDER BY b.statistics_city_name, a.store_code, a.year, a.month_number;
