-- 资金安全线（城市维度）

WITH city_rent AS (
    -- 1. 按城市统计一个月房租（取最近三个月平均）
    SELECT
        dm.statistics_city_name,
        SUM(
            COALESCE(fixed_rent, 0) +
            COALESCE(percentage_rent, 0) +
            COALESCE(property_fee, 0) +
            COALESCE(promotion_fee, 0)
        ) / 3 AS amount
    FROM dws_profit_store_detail_monthly t
    JOIN data_warehouse.dm_city dm ON t.city_code = dm.city_code
    WHERE t.month IN (
        SELECT month
        FROM (
            SELECT DISTINCT month
            FROM dws_profit_store_detail_monthly
            WHERE length(store_code) = 6
              AND month <= DATE_FORMAT(CURDATE(), '%Y-%m')
            ORDER BY month DESC
            LIMIT 3
        ) tmp
    )
      AND length(t.store_code) = 6
    GROUP BY dm.statistics_city_name
),
city_massager_salary AS (
    -- 2. 按城市统计技师工资（最新月份）
    SELECT
        dm.statistics_city_name,
        SUM(total_payable + social_security_unit_amount) AS amount
    FROM ods_changle_tech_salary_massagist_monthly_performance t
    JOIN data_warehouse.dm_city dm ON t.city_code = dm.city_code
    WHERE t.stat_month = (
        SELECT MAX(stat_month)
        FROM ods_changle_tech_salary_massagist_monthly_performance
    )
    GROUP BY dm.statistics_city_name
),
city_manager_salary AS (
    -- 3. 按城市统计管理人员工资（最新月份）
    SELECT
        dm.statistics_city_name,
        SUM(total_payable + social_security_company_amount + provident_fund_company_amount) AS amount
    FROM ods_changle_tech_salary_business_salary_manager_other_detail t
    JOIN data_warehouse.dm_city dm ON t.city_code = dm.city_code
    WHERE t.income_month = (
        SELECT MAX(income_month)
        FROM ods_changle_tech_salary_business_salary_manager_other_detail
    )
    GROUP BY dm.statistics_city_name
),
hq_salary_record AS (
    -- 4. 总部工资单独列出（由于无 city_code，标记为'总部'）
    SELECT
        '总部' AS statistics_city_name,
        SUM(total_revenue + social_security_unit_amount + housing_fund_unit_amount) AS amount
    FROM data_warehouse_ods.ods_tencent_business_headquarters_salary
    WHERE del_flg = 0
      AND enable_flg = 1
      AND month = (
          SELECT MAX(month)
          FROM data_warehouse_ods.ods_tencent_business_headquarters_salary
          WHERE del_flg = 0 AND enable_flg = 1
      )
),
all_cities AS (
    -- 5. 汇总所有出现的城市名，确保数据不遗漏
    SELECT statistics_city_name FROM city_rent
    UNION
    SELECT statistics_city_name FROM city_massager_salary
    UNION
    SELECT statistics_city_name FROM city_manager_salary
    UNION
    SELECT statistics_city_name FROM hq_salary_record
)
SELECT
    base.statistics_city_name AS `统计城市`,
    ROUND(COALESCE(r.amount, 0), 2) AS `一个月房租`,
    ROUND((
        COALESCE(ms.amount, 0) +
        COALESCE(mg.amount, 0) +
        COALESCE(hq.amount, 0)
    ) / 2, 2) AS `半个月工资`,
    ROUND(
        COALESCE(r.amount, 0) +
        (COALESCE(ms.amount, 0) + COALESCE(mg.amount, 0) + COALESCE(hq.amount, 0)) / 2,
    2) AS `资金安全线`
FROM all_cities base
LEFT JOIN city_rent r ON base.statistics_city_name = r.statistics_city_name
LEFT JOIN city_massager_salary ms ON base.statistics_city_name = ms.statistics_city_name
LEFT JOIN city_manager_salary mg ON base.statistics_city_name = mg.statistics_city_name
LEFT JOIN hq_salary_record hq ON base.statistics_city_name = hq.statistics_city_name
ORDER BY `资金安全线` DESC;