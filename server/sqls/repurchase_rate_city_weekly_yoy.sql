-- 周维度的项目回头率统计（按城市 + 严格照搬参考SQL的日期映射逻辑）
WITH curr_week_data AS (
    -- 【第一步：完全对应参考SQL的curr_week_data】按年、周、城市汇总【今年】数据
    SELECT
        YEAR(STR_TO_DATE(CONCAT(YEARWEEK(t1.off_clock_time, 1), ' Monday'), '%x%v %W'))    AS s_year,
        WEEK(STR_TO_DATE(CONCAT(YEARWEEK(t1.off_clock_time, 1), ' Monday'), '%x%v %W'), 1) AS s_week,
        STR_TO_DATE(CONCAT(YEARWEEK(t1.off_clock_time, 1), ' Monday'), '%x%v %W')          AS week_start_date,
        DATE_ADD(STR_TO_DATE(CONCAT(YEARWEEK(t1.off_clock_time, 1), ' Monday'), '%x%v %W'),
                 INTERVAL 6 DAY)                                                            AS week_end_date,
        t2.statistics_city_name,
        COUNT(DISTINCT t1.order_uid)                            AS total_orders,
        SUM(IF(t1.is_massager_project_return_customer = '是', 1, 0)) AS repurchase_orders
    FROM dwd_sales_order_detail t1
    LEFT JOIN dm_city t2 ON t1.city_code = t2.city_code
    WHERE t1.off_clock_time IS NOT NULL
      AND t1.off_clock_time >= '2024-01-01'
      AND service_duration >= 40
    GROUP BY 1, 2, 3, 4, 5
),
ly_data_prep AS (
    -- 【第二步：完全对应参考SQL的ly_data_prep】给去年每一行数据，打上“对应今年的周起始/结束”标签 + 城市
    SELECT
        t1.order_uid,
        t1.is_massager_project_return_customer,
        t1.service_duration,
        t2.statistics_city_name,
        -- 核心逻辑：严格照搬参考SQL，把去年的日期加1年，找到它属于今年的哪一周
        STR_TO_DATE(CONCAT(YEARWEEK(DATE_ADD(t1.off_clock_time, INTERVAL 1 YEAR), 1), ' Monday'), '%x%v %W') AS mapped_curr_week_start,
        DATE_ADD(STR_TO_DATE(CONCAT(YEARWEEK(DATE_ADD(t1.off_clock_time, INTERVAL 1 YEAR), 1), ' Monday'), '%x%v %W'), INTERVAL 6 DAY) AS mapped_curr_week_end
    FROM dwd_sales_order_detail t1
    LEFT JOIN dm_city t2 ON t1.city_code = t2.city_code
    WHERE t1.off_clock_time IS NOT NULL
      AND t1.off_clock_time >= '2024-01-01'
      AND service_duration >= 40
),
ly_agg AS (
    -- 【第三步：完全对应参考SQL的ly_agg】按“对应今年的周 + 城市”分组，确保一周一行
    SELECT
        mapped_curr_week_start,
        mapped_curr_week_end,
        statistics_city_name,
        COUNT(DISTINCT order_uid) AS ly_total_orders,
        SUM(IF(is_massager_project_return_customer = '是', 1, 0)) AS ly_repurchase_orders
    FROM ly_data_prep
    GROUP BY mapped_curr_week_start, mapped_curr_week_end, statistics_city_name
)
-- 【最终关联：严格照搬参考SQL，只用 = 关联，彻底解决报错】
SELECT
    curr.s_year,
    curr.s_week,
    -- 今年周的时间范围
    CONCAT(DATE_FORMAT(curr.week_start_date, '%Y-%m-%d'), ' ~ ', DATE_FORMAT(curr.week_end_date, '%Y-%m-%d')) AS week_date_range,
    -- 【新增】去年同期周的时间范围
    CONCAT(
        DATE_FORMAT(DATE_SUB(curr.week_start_date, INTERVAL 1 YEAR), '%Y-%m-%d'),
        ' ~ ',
        DATE_FORMAT(DATE_SUB(curr.week_end_date, INTERVAL 1 YEAR), '%Y-%m-%d')
    ) AS last_year_week_date_range,
    curr.statistics_city_name AS city_name,
    curr.total_orders,
    curr.repurchase_orders,
    ROUND(curr.repurchase_orders / NULLIF(curr.total_orders, 0) * 100, 2) AS repurchase_rate,
    -- 去年数据
    ly.ly_total_orders,
    ly.ly_repurchase_orders,
    ROUND(ly.ly_repurchase_orders / NULLIF(ly.ly_total_orders, 0) * 100, 2) AS prev_year_rate,
    ROUND(
        ROUND(curr.repurchase_orders / NULLIF(curr.total_orders, 0) * 100, 2) - ROUND(ly.ly_repurchase_orders / NULLIF(ly.ly_total_orders, 0) * 100, 2),
        2
    ) AS yoy_change_pct
FROM curr_week_data curr
LEFT JOIN ly_agg ly
    -- 严格照搬参考SQL：只用 = 关联（周起始 + 周结束 + 城市）
    ON curr.week_start_date = ly.mapped_curr_week_start
   AND curr.week_end_date = ly.mapped_curr_week_end
   AND curr.statistics_city_name = ly.statistics_city_name
WHERE curr.s_year >= 2025
ORDER BY curr.s_year DESC, curr.s_week DESC, curr.statistics_city_name ASC;


