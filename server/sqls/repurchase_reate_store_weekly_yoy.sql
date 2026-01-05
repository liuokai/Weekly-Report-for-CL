-- 门店维度最新一周的年度项目回头率

WITH latest_config AS (
    -- 第一步：动态获取数据中最近的年份和周数
    SELECT
        YEAR(STR_TO_DATE(CONCAT(YEARWEEK(MAX(off_clock_time), 1), ' Monday'), '%x%v %W'))    AS target_year,
        WEEK(STR_TO_DATE(CONCAT(YEARWEEK(MAX(off_clock_time), 1), ' Monday'), '%x%v %W'), 1) AS target_week
    FROM dwd_sales_order_detail
    WHERE off_clock_time IS NOT NULL
),
store_identity AS (
    -- 第二步：识别每个门店在统计周期内“最近一笔订单”对应的名称和城市
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
    WHERE rn = 1 -- 只取最新的一条
),
ytd_base_metrics AS (
    -- 第三步：严格按 store_code 汇总本年和去年 YTD 基础数据
    SELECT
        YEAR(STR_TO_DATE(CONCAT(YEARWEEK(t1.off_clock_time, 1), ' Monday'), '%x%v %W')) AS s_year,
        t1.store_code,
        COUNT(DISTINCT t1.order_uid)                            AS total_orders_ytd,
        SUM(IF(t1.is_project_repurchase_customer = '是', 1, 0)) AS repurchase_orders_ytd
    FROM dwd_sales_order_detail t1
    CROSS JOIN latest_config lc
    WHERE t1.off_clock_time IS NOT NULL
      AND WEEK(STR_TO_DATE(CONCAT(YEARWEEK(t1.off_clock_time, 1), ' Monday'), '%x%v %W'), 1) <= lc.target_week
      AND YEAR(STR_TO_DATE(CONCAT(YEARWEEK(t1.off_clock_time, 1), ' Monday'), '%x%v %W')) IN (lc.target_year, lc.target_year - 1)
    GROUP BY 1, 2
),
rate_calculation AS (
    -- 第四步：计算累计回头率
    SELECT
        *,
        ROUND(repurchase_orders_ytd / NULLIF(total_orders_ytd, 0) * 100, 2) AS repurchase_rate_ytd
    FROM ytd_base_metrics
)
-- 第五步：合并门店最新名称，计算同比并输出
SELECT
    curr.s_year,
    (SELECT target_week FROM latest_config)                      AS as_of_week,
    si.statistics_city_name                                      AS city_name,
    curr.store_code,
    si.store_name,                                               -- 取自“最近一笔订单”的名称
    curr.total_orders_ytd,
    curr.repurchase_orders_ytd,
    curr.repurchase_rate_ytd,
    prev.repurchase_rate_ytd                                     AS prev_year_rate_ytd,
    ROUND(curr.repurchase_rate_ytd - prev.repurchase_rate_ytd, 2) AS yoy_change_pct
FROM rate_calculation curr
INNER JOIN store_identity si ON curr.store_code = si.store_code  -- 关联最新名称
LEFT JOIN rate_calculation prev
    ON curr.s_year = prev.s_year + 1
    AND curr.store_code = prev.store_code
WHERE curr.s_year = (SELECT target_year FROM latest_config)
ORDER BY si.statistics_city_name ASC, curr.repurchase_rate_ytd DESC;
