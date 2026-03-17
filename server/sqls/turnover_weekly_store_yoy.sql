-- 按周、门店统计营业额（ISO 年周 + 日期映射精准匹配 + 新增上年同期日期范围）
WITH weekly_city_sales AS (
    -- 【今年单周】按城市、门店、ISO周聚合今年的单周营业额
    SELECT
        b.statistics_city_name,
        a.store_code,
        a.store_name,
        STR_TO_DATE(CONCAT(YEARWEEK(a.off_clock_time, 1), ' Monday'), '%x%v %W') AS week_start,
        YEAR(STR_TO_DATE(CONCAT(YEARWEEK(a.off_clock_time, 1), ' Monday'), '%x%v %W')) AS sales_year,
        WEEK(STR_TO_DATE(CONCAT(YEARWEEK(a.off_clock_time, 1), ' Monday'), '%x%v %W'), 1) AS sales_week,
        DATE_ADD(STR_TO_DATE(CONCAT(YEARWEEK(a.off_clock_time, 1), ' Monday'), '%x%v %W'), INTERVAL 6 DAY) AS week_end,
        SUM(a.order_actual_payment) AS weekly_revenue
    FROM data_warehouse.dwd_sales_order_detail AS a
    LEFT JOIN dm_city AS b
        ON a.city_code = b.city_code
    WHERE a.off_clock_time IS NOT NULL
      AND (order_type in ('01','03') or project_name='修脚')
      AND a.off_clock_time >= '2024-01-01'
    GROUP BY
        b.statistics_city_name,
        a.store_code,
        a.store_name,
        week_start,
        sales_year,
        sales_week,
        week_end
),
ly_data_prep AS (
    -- 【去年数据预处理】给去年每一行数据打映射标签，同时保留城市、门店信息
    SELECT
        b.statistics_city_name,
        a.store_code,
        a.store_name,
        a.order_actual_payment,
        -- 核心逻辑：把去年的日期加1年，映射到今年对应的周
        STR_TO_DATE(CONCAT(YEARWEEK(DATE_ADD(a.off_clock_time, INTERVAL 1 YEAR), 1), ' Monday'), '%x%v %W') AS mapped_curr_week_start,
        DATE_ADD(STR_TO_DATE(CONCAT(YEARWEEK(DATE_ADD(a.off_clock_time, INTERVAL 1 YEAR), 1), ' Monday'), '%x%v %W'), INTERVAL 6 DAY) AS mapped_curr_week_end
    FROM data_warehouse.dwd_sales_order_detail AS a
    LEFT JOIN dm_city AS b
        ON a.city_code = b.city_code
    WHERE a.off_clock_time IS NOT NULL
      AND (order_type in ('01','03') or project_name='修脚')
      AND a.off_clock_time >= '2024-01-01'
),
ly_weekly_agg AS (
    -- 【去年单周】按映射后的周、城市、门店聚合，得到去年当周值
    SELECT
        mapped_curr_week_start,
        mapped_curr_week_end,
        statistics_city_name,
        store_code,
        store_name,
        SUM(order_actual_payment) AS ly_weekly_revenue,
        -- 防一对多：给每个（城市+门店+映射周）打唯一行号
        ROW_NUMBER() OVER(PARTITION BY statistics_city_name, store_code, store_name, mapped_curr_week_start, mapped_curr_week_end ORDER BY statistics_city_name) AS rn
    FROM ly_data_prep
    GROUP BY
        mapped_curr_week_start,
        mapped_curr_week_end,
        statistics_city_name,
        store_code,
        store_name
),
matched_weekly AS (
    -- 【第一步：先匹配当周数据】把今年和去年的当周数据 JOIN 成一行
    SELECT
        curr.statistics_city_name,
        curr.store_code,
        curr.store_name,
        curr.week_start,
        curr.week_end,
        curr.sales_year,
        curr.sales_week,
        curr.weekly_revenue AS current_value,
        ly.ly_weekly_revenue AS last_year_value,
        -- 防一对多
        ROW_NUMBER() OVER(PARTITION BY curr.statistics_city_name, curr.store_code, curr.store_name, curr.week_start, curr.week_end ORDER BY curr.sales_week) AS rn
    FROM weekly_city_sales curr
    LEFT JOIN ly_weekly_agg ly
        ON curr.statistics_city_name = ly.statistics_city_name
       AND curr.store_code = ly.store_code
       AND curr.store_name = ly.store_name
       AND curr.week_start = ly.mapped_curr_week_start
       AND curr.week_end = ly.mapped_curr_week_end
       AND ly.rn = 1
)
-- 【最终输出：100%保留所有原字段 + 新增上年同期日期范围】
SELECT
    statistics_city_name,
    store_code,
    store_name,
    sales_year AS `year`,
    sales_week AS `week`,
    -- 【完全保留原字段】今年日期范围
    CONCAT(DATE_FORMAT(week_start, '%Y-%m-%d'), ' ~ ', DATE_FORMAT(week_end, '%Y-%m-%d')) AS `date_range`,
    -- 【新增】上年同期日期范围
    CONCAT(
        DATE_FORMAT(DATE_SUB(week_start, INTERVAL 1 YEAR), '%Y-%m-%d'),
        ' ~ ',
        DATE_FORMAT(DATE_SUB(week_end, INTERVAL 1 YEAR), '%Y-%m-%d')
    ) AS `last_year_date_range`,
    current_value,
    last_year_value,
    IF(
        last_year_value IS NULL OR last_year_value = 0,
        NULL,
        ROUND((current_value - last_year_value) / last_year_value * 100, 2)
    ) AS `yoy_change`
FROM matched_weekly
WHERE sales_year >= 2025
  AND rn = 1 -- 防一对多
ORDER BY
    statistics_city_name,
    statistics_city_name,
    sales_year DESC,
    sales_week DESC;