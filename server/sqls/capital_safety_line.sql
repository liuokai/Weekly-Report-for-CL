WITH rent_monthly AS (
    SELECT
        SUM(
            COALESCE(fixed_rent, 0) +
            COALESCE(percentage_rent, 0) +
            COALESCE(property_fee, 0) +
            COALESCE(promotion_fee, 0)
        ) / 3 AS amount
    FROM dws_profit_store_detail_monthly
    WHERE month IN (
        SELECT month
        FROM (
            SELECT DISTINCT month
            FROM dws_profit_store_detail_monthly
            WHERE length(store_code) = 6
              AND month <= DATE_FORMAT(CURDATE(), '%Y-%m')
            ORDER BY month DESC
            LIMIT 3
        ) t
    )
      AND length(store_code) = 6
),
hq_salary AS (
    SELECT
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
massager_salary AS (
    SELECT
        SUM(total_payable + social_security_unit_amount) AS amount
    FROM ods_changle_tech_salary_massagist_monthly_performance
    WHERE stat_month = (
        SELECT MAX(stat_month)
        FROM ods_changle_tech_salary_massagist_monthly_performance
    )
),
manager_salary AS (
    SELECT
        SUM(total_payable + social_security_company_amount + provident_fund_company_amount) AS amount
    FROM ods_changle_tech_salary_business_salary_manager_other_detail
    WHERE income_month = (
        SELECT MAX(income_month)
        FROM ods_changle_tech_salary_business_salary_manager_other_detail
    )
),
salary_half AS (
    SELECT
        (COALESCE(h.amount, 0) + COALESCE(ms.amount, 0) + COALESCE(mg.amount, 0)) / 2 AS amount
    FROM hq_salary h, massager_salary ms, manager_salary mg
)
SELECT
    ROUND(COALESCE(r.amount, 0), 2) AS `一个月房租`,
    ROUND(COALESCE(s.amount, 0), 2) AS `半个月工资`,
    ROUND(COALESCE(r.amount, 0) + COALESCE(s.amount, 0), 2) AS `总和`
FROM rent_monthly r, salary_half s;
