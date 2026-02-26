-- 按月累计统计新店目标完成情况

WITH base_data AS (
    -- 1. 基础聚合：按月和城市算出原始汇总数据
    SELECT
        month,
        city_name,
        SUM(new_store_opening_target) AS sum_new_target,
        SUM(new_store_opening_num)    AS sum_new_num,
        SUM(reinstall_store_target)   AS sum_reinstall_target,
        SUM(reinstall_store_num)      AS sum_reinstall_num,
        SUM(total_store_num)          AS sum_total_store
    FROM dws_store_open_progress_monthly
    WHERE month <= DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY), '%Y-%m')
    GROUP BY month, city_name
),
combined_rows AS (
    -- 2. 第一部分：城市明细行 (Type 0)
    SELECT
        month, city_name AS city_name_display, 0 AS row_type,
        sum_new_target, sum_new_num, sum_reinstall_target, sum_reinstall_num, sum_total_store
    FROM base_data

    UNION ALL

    -- 3. 第二部分：当月合计行 (Type 1)
    SELECT
        month, '月度合计' AS city_name_display, 1 AS row_type,
        SUM(sum_new_target), SUM(sum_new_num), SUM(sum_reinstall_target), SUM(sum_reinstall_num), SUM(sum_total_store)
    FROM base_data
    GROUP BY month

    UNION ALL

    -- 4. 第三部分：月度累计汇总行 (Type 2)
    -- 注意：这里先按月汇总，再通过窗口函数计算累计
    SELECT
        month, '月度累计汇总' AS city_name_display, 2 AS row_type,
        SUM(SUM(sum_new_target)) OVER (ORDER BY month) AS sum_new_target,
        SUM(SUM(sum_new_num)) OVER (ORDER BY month) AS sum_new_num,
        SUM(SUM(sum_reinstall_target)) OVER (ORDER BY month) AS sum_reinstall_target,
        SUM(SUM(sum_reinstall_num)) OVER (ORDER BY month) AS sum_reinstall_num,
        SUM(sum_total_store) -- 门店总数通常取当月快照值，不需要累计，若需累计请加窗口函数
    FROM base_data
    GROUP BY month
)
SELECT
    month,
    city_name_display AS city_name,

    sum_new_target AS new_store_target,
    sum_new_num AS new_store_count,

    CASE
        WHEN (sum_new_target IS NULL OR sum_new_target = 0) AND sum_new_num > 0 THEN '高于目标'
        WHEN (sum_new_target IS NULL OR sum_new_target = 0) AND (sum_new_num IS NULL OR sum_new_num = 0) THEN NULL
        WHEN sum_new_num = sum_new_target THEN '如期完成'
        WHEN sum_new_num > sum_new_target THEN '高于目标'
        WHEN sum_new_num < sum_new_target THEN '尚未完成'
    END AS new_store_target_status,

    sum_reinstall_target AS reinstall_target,
    sum_reinstall_num AS reinstall_count,

    CASE
        WHEN (sum_reinstall_target IS NULL OR sum_reinstall_target = 0) AND sum_reinstall_num > 0 THEN '高于目标'
        WHEN (sum_reinstall_target IS NULL OR sum_reinstall_target = 0) AND (sum_reinstall_num IS NULL OR sum_reinstall_num = 0) THEN NULL
        WHEN sum_reinstall_num = sum_reinstall_target THEN '如期完成'
        WHEN sum_reinstall_num > sum_reinstall_target THEN '高于目标'
        WHEN sum_reinstall_num < sum_reinstall_target THEN '尚未完成'
    END AS reinstall_target_status,

    sum_total_store AS total_store_count
FROM combined_rows
ORDER BY
    month ASC,
    row_type ASC, -- 确保顺序是：明细 -> 当月合计 -> 月度累计
    sum_total_store DESC;