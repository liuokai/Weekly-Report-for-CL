      
-- 门店维度最新一周的年度项目回头率（新增时间范围 + 上年同期分子分母 + 保留所有原字段名）
WITH latest_config AS (
    -- 【完全保留原SQL第一步】动态获取数据中最近的年份和周数 + 【新增】生成今年的周起始/结束日期
    SELECT
        YEAR(STR_TO_DATE(CONCAT(YEARWEEK(MAX(off_clock_time), 1), ' Monday'), '%x%v %W'))    AS target_year,
        WEEK(STR_TO_DATE(CONCAT(YEARWEEK(MAX(off_clock_time), 1), ' Monday'), '%x%v %W'), 1) AS target_week,
        -- 【新增】今年最新一周的起始日期（周一）
        STR_TO_DATE(CONCAT(YEARWEEK(MAX(off_clock_time), 1), ' Monday'), '%x%v %W') AS target_week_start,
        -- 【新增】今年最新一周的结束日期（周日）
        DATE_ADD(STR_TO_DATE(CONCAT(YEARWEEK(MAX(off_clock_time), 1), ' Monday'), '%x%v %W'), INTERVAL 6 DAY) AS target_week_end
    FROM dwd_sales_order_detail
    WHERE off_clock_time IS NOT NULL
),
store_identity AS (
    -- 【完全保留原SQL第二步】识别每个门店在统计周期内“最近一笔订单”对应的名称和城市
    SELECT
        store_code,
        store_name,
        statistics_city_name
    FROM (
        SELECT
            t1.store_code,
            t1.store_name,
            t2.statistics_city_name,
            ROW_NUMBER() OVER(PARTITION BY t1.store_code ORDER BY t1.off_clock_time DESC) as rn
        FROM dwd_sales_order_detail t1
        LEFT JOIN dm_city t2 ON t1.city_code = t2.city_code
        WHERE t1.off_clock_time IS NOT NULL
          AND t1.off_clock_time >= '2024-01-01'
    ) tmp
    WHERE rn = 1
),
-- 【新增：对应参考SQL的curr_week_data】单独聚合【今年】的YTD基础数据
curr_ytd_data AS (
    SELECT
        YEAR(STR_TO_DATE(CONCAT(YEARWEEK(t1.off_clock_time, 1), ' Monday'), '%x%v %W')) AS s_year,
        t1.store_code,
        COUNT(DISTINCT t1.order_uid) AS total_orders_ytd,
        SUM(IF(t1.is_massager_project_return_customer = '是', 1, 0)) AS repurchase_orders_ytd
    FROM dwd_sales_order_detail t1
    CROSS JOIN latest_config lc
    WHERE t1.off_clock_time IS NOT NULL
      AND t1.service_duration >= 40
      AND WEEK(STR_TO_DATE(CONCAT(YEARWEEK(t1.off_clock_time, 1), ' Monday'), '%x%v %W'), 1) <= lc.target_week
      AND YEAR(STR_TO_DATE(CONCAT(YEARWEEK(t1.off_clock_time, 1), ' Monday'), '%x%v %W')) = lc.target_year
    GROUP BY s_year, t1.store_code
),
-- 【新增：对应参考SQL的ly_data_prep】给【去年】每一行数据，打上“映射到今年的周”标签，并过滤YTD范围
ly_data_prep AS (
    SELECT
        t1.order_uid,
        t1.is_massager_project_return_customer,
        t1.service_duration,
        t1.store_code,
        lc.target_week,
        -- 核心逻辑：严格照搬参考SQL，把去年的日期加1年
        YEARWEEK(DATE_ADD(t1.off_clock_time, INTERVAL 1 YEAR), 1) AS mapped_curr_year_week_key,
        WEEK(STR_TO_DATE(CONCAT(YEARWEEK(DATE_ADD(t1.off_clock_time, INTERVAL 1 YEAR), 1), ' Monday'), '%x%v %W'), 1) AS mapped_curr_week
    FROM dwd_sales_order_detail t1
    CROSS JOIN latest_config lc
    WHERE t1.off_clock_time IS NOT NULL
      AND t1.service_duration >= 40
      -- 先取去年的自然年数据
      AND YEAR(STR_TO_DATE(CONCAT(YEARWEEK(t1.off_clock_time, 1), ' Monday'), '%x%v %W')) = lc.target_year - 1
),
-- 【新增：对应参考SQL的ly_agg】单独聚合【去年】的YTD基础数据（按映射后的周过滤）
ly_agg AS (
    SELECT
        store_code,
        COUNT(DISTINCT order_uid) AS ly_total_orders_ytd,
        SUM(IF(is_massager_project_return_customer = '是', 1, 0)) AS ly_repurchase_orders_ytd
    FROM ly_data_prep
    -- 关键：映射后的周数 <= 今年的目标周数，确保是去年的YTD
    WHERE mapped_curr_week <= target_week
    GROUP BY store_code
),
-- 【保留原SQL第四步：只计算今年的回头率，字段名完全不变】
rate_calculation AS (
    SELECT
        *,
        ROUND(repurchase_orders_ytd / NULLIF(total_orders_ytd, 0) * 100, 2) AS repurchase_rate_ytd
    FROM curr_ytd_data
)
-- 【最终关联：严格对应参考SQL，只用 = 关联，保留所有原字段名 + 新增字段】
SELECT
    curr.s_year,
    (SELECT target_week FROM latest_config) AS as_of_week,
    -- 【新增】今年的时间周期范围
    CONCAT(
        DATE_FORMAT((SELECT target_week_start FROM latest_config), '%Y-%m-%d'),
        ' ~ ',
        DATE_FORMAT((SELECT target_week_end FROM latest_config), '%Y-%m-%d')
    ) AS current_year_date_range,
    -- 【新增】上年同期的时间周期范围
    CONCAT(
        DATE_FORMAT(DATE_SUB((SELECT target_week_start FROM latest_config), INTERVAL 1 YEAR), '%Y-%m-%d'),
        ' ~ ',
        DATE_FORMAT(DATE_SUB((SELECT target_week_end FROM latest_config), INTERVAL 1 YEAR), '%Y-%m-%d')
    ) AS last_year_date_range,
    si.statistics_city_name AS city_name,
    curr.store_code,
    si.store_name,
    -- 【保留原有今年分子分母】
    curr.total_orders_ytd,
    curr.repurchase_orders_ytd,
    curr.repurchase_rate_ytd,
    -- 【新增上年同期分子分母，字段名直接用ly_agg里的，不瞎改】
    ly.ly_total_orders_ytd,
    ly.ly_repurchase_orders_ytd,
    -- 【保留原有上年同期回头率】
    nvl(ROUND(ly.ly_repurchase_orders_ytd / NULLIF(ly.ly_total_orders_ytd, 0) * 100, 2),30) AS prev_year_rate_ytd,
    -- 【保留原有同比差值】
    ROUND(curr.repurchase_rate_ytd - nvl(ROUND(ly.ly_repurchase_orders_ytd / NULLIF(ly.ly_total_orders_ytd, 0) * 100, 2),30), 2) AS yoy_change_pct
FROM rate_calculation curr
INNER JOIN store_identity si ON curr.store_code = si.store_code
-- 【核心修改：对应参考SQL，只用store_code关联去年的聚合表】
LEFT JOIN ly_agg ly ON curr.store_code = ly.store_code
WHERE curr.s_year = (SELECT target_year FROM latest_config)
ORDER BY si.statistics_city_name ASC, curr.repurchase_rate_ytd DESC;

    