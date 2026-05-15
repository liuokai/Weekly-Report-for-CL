SELECT
    1 AS row_order,
    '预算金额（万元）' AS row_type,
    393.83 AS expense_budget,
    532.08 AS labor_cost
UNION ALL
SELECT
    2 AS row_order,
    '实际金额（万元）' AS row_type,
    ROUND(actual_amount / 10000, 2) AS expense_budget,
    ROUND(massage_home_budget / 10000, 2) AS labor_cost
FROM (
    SELECT SUM(massage_home_budget) AS massage_home_budget
    FROM data_warehouse.dws_headquarters_cost_budget_monthly
    WHERE LEFT(month, 4) = '2026'
) budget_data
LEFT JOIN (
    SELECT SUM(actual_amount) AS actual_amount
    FROM data_warehouse.tmp_hq_post_indicator_config
    WHERE event = '推拿之家'
      AND LEFT(quarter, 4) = '2026'
) actual_data
ON 1 = 1
ORDER BY row_order;
