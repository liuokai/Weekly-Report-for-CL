-- 新店目标与开店实际情况

SELECT
    month,
    city_name_display AS city_name,

    sum_new_target AS `新店目标`,
    sum_new_num    AS `新店数量`,

    CASE
        WHEN (sum_new_target IS NULL OR sum_new_target = 0) AND sum_new_num > 0 THEN '高于目标'
        WHEN (sum_new_target IS NULL OR sum_new_target = 0) AND (sum_new_num IS NULL OR sum_new_num = 0) THEN NULL
        WHEN sum_new_num = sum_new_target THEN '如期完成'
        WHEN sum_new_num > sum_new_target THEN '高于目标'
        WHEN sum_new_num < sum_new_target THEN '尚未完成'
    END AS `新店目标完成情况`,

    sum_reinstall_target AS `重装目标`,
    sum_reinstall_num    AS `重装数量`,

    CASE
        WHEN (sum_reinstall_target IS NULL OR sum_reinstall_target = 0) AND sum_reinstall_num > 0 THEN '高于目标'
        WHEN (sum_reinstall_target IS NULL OR sum_reinstall_target = 0) AND (sum_reinstall_num IS NULL OR sum_reinstall_num = 0) THEN NULL
        WHEN sum_reinstall_num = sum_reinstall_target THEN '如期完成'
        WHEN sum_reinstall_num > sum_reinstall_target THEN '高于目标'
        WHEN sum_reinstall_num < sum_reinstall_target THEN '尚未完成'
    END AS `重装目标完成情况`,

    sum_total_store AS `门店数量`

FROM (
    SELECT
        month,
        -- 使用 GROUPING 函数并取别名，规避 ORDER BY 的限制
        GROUPING(city_name) AS is_total_row,
        IF(GROUPING(city_name) = 1, '月度合计', city_name) AS city_name_display,
        SUM(new_store_opening_target) AS sum_new_target,
        SUM(new_store_opening_num)    AS sum_new_num,
        SUM(reinstall_store_target)   AS sum_reinstall_target,
        SUM(reinstall_store_num)      AS sum_reinstall_num,
        SUM(total_store_num)          AS sum_total_store
    FROM dws_store_open_progress_monthly
    GROUP BY month, city_name WITH ROLLUP
) t
-- 过滤掉 month 为空的行（ROLLUP 会额外产生一行全表总合计，如果不需要可以滤掉）
WHERE month IS NOT NULL
ORDER BY
    month ASC,
    is_total_row ASC,      -- 0 是明细，1 是合计，确保合计在月度末尾
    sum_total_store DESC;