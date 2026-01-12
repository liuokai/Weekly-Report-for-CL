SELECT
    SUM(
        COALESCE(fixed_rent, 0) +
        COALESCE(percentage_rent, 0) +
        COALESCE(property_fee, 0) +
        COALESCE(promotion_fee, 0)
    ) / 3 AS avg_monthly_rent
FROM dws_profit_store_detail_monthly
WHERE month IN (
    SELECT month FROM (
        SELECT DISTINCT month
        FROM dws_profit_store_detail_monthly
        WHERE length(store_code) = 6
          AND month <= DATE_FORMAT(CURDATE(), '%Y-%m')
        ORDER BY month DESC
        LIMIT 3
    ) AS tmp
)
AND length(store_code) = 6;
