-- 闭店预警门店列表 

WITH
quarterly_store_metrics AS (
    SELECT
        CONCAT(LEFT(a.month, 4), '-Q', CEIL(RIGHT(a.month, 2) / 3)) AS quarter,
        -- 记录该季度数据所涵盖的最后一个月份
        CONCAT(LEFT(MAX(a.month), 4), '年', RIGHT(MAX(a.month), 2), '月') AS last_month_of_quarter,
        a.city_code,
        a.city_name,
        a.store_code,
        a.store_name,
        a.opening_date,
        sum(nvl(a.main_business_income, 0)) AS 主营业务收入,
        sum(nvl(a.labor_cost, 0)) AS 人工成本,
        sum(
            nvl(a.fixed_rent, 0) +
            nvl(a.percentage_rent, 0) +
            nvl(a.promotion_fee, 0) +
            nvl(a.property_fee, 0)
        ) AS 租金成本,
        sum(nvl(a.net_cash_flow, 0)) AS 现金流,
        CASE
            WHEN sum(nvl(a.main_business_income, 0)) = 0 THEN NULL
            ELSE (
                sum(
                    nvl(a.fixed_rent, 0) +
                    nvl(a.percentage_rent, 0) +
                    nvl(a.promotion_fee, 0) +
                    nvl(a.property_fee, 0) +
                    nvl(a.labor_cost, 0)
                )
            ) / sum(nvl(a.main_business_income, 0))
        END AS 当期成本占比,
        row_number() over (
            partition by a.store_code
            order by CONCAT(LEFT(a.month, 4), '-Q', CEIL(RIGHT(a.month, 2) / 3))
        ) AS rn
    FROM
        dws_profit_store_detail_monthly a
    WHERE
        a.month < DATE_FORMAT(date_sub(CURDATE(), interval 1 day), '%Y-%m')
    GROUP BY
        a.city_code,
        a.city_name,
        a.store_code,
        a.store_name,
        a.opening_date,
        CONCAT(LEFT(a.month, 4), '-Q', CEIL(RIGHT(a.month, 2) / 3))
),
quarterly_metrics AS (
    SELECT a.store_code,
         b.quarter,
         b.month,
         a.depreciation_charge      as 总折旧,
         b.cumulative_net_cash_flow as 累计经营现金流
    FROM tmp_store_depreciation_charge a
    LEFT JOIN (
        SELECT store_code, month, cumulative_net_cash_flow,
             CONCAT(LEFT(month, 4), '-Q', CEIL(RIGHT(month, 2) / 3)) as quarter,
             ROW_NUMBER() OVER ( PARTITION BY store_code, CONCAT(LEFT(month, 4), '-Q', CEIL(RIGHT(month, 2) / 3)) ORDER BY month DESC ) AS rn
        FROM dws_profit_store_detail_monthly
        WHERE month < DATE_FORMAT(date_sub(CURDATE(), interval 1 day), '%Y-%m')) b ON a.store_code = b.store_code AND b.rn = 1
),
calculated_results AS (
    SELECT
        q.quarter,
        q.last_month_of_quarter,
        q.city_code,
        q.city_name,
        q.store_code,
        q.store_name,
        q.opening_date,
        q.主营业务收入,
        q.人工成本,
        q.租金成本,
        q.现金流,
        q.当期成本占比,
        -- 上季度财务指标与占比（更新为租金成本）
        LAG(q.主营业务收入, 1) OVER ( PARTITION BY q.store_code ORDER BY q.rn ) AS 上季度主营业务收入,
        LAG(q.人工成本, 1) OVER ( PARTITION BY q.store_code ORDER BY q.rn ) AS 上季度人工成本,
        LAG(q.租金成本, 1) OVER ( PARTITION BY q.store_code ORDER BY q.rn ) AS 上季度租金成本,
        LAG(q.当期成本占比, 1) OVER ( PARTITION BY q.store_code ORDER BY q.rn ) AS 上季度成本占比,
        -- 上上季度财务指标与占比（更新为租金成本）
        LAG(q.主营业务收入, 2) OVER ( PARTITION BY q.store_code ORDER BY q.rn ) AS 上上季度主营业务收入,
        LAG(q.人工成本, 2) OVER ( PARTITION BY q.store_code ORDER BY q.rn ) AS 上上季度人工成本,
        LAG(q.租金成本, 2) OVER ( PARTITION BY q.store_code ORDER BY q.rn ) AS 上上季度租金成本,
        LAG(q.当期成本占比, 2) OVER ( PARTITION BY q.store_code ORDER BY q.rn ) AS 上上季度成本占比,
        qm.总折旧,
        qm.累计经营现金流,
        (qm.累计经营现金流 / NULLIF(qm.总折旧, 0)) as 累计现金流亏损占比
    FROM
        quarterly_store_metrics q
    LEFT JOIN quarterly_metrics qm ON q.quarter = qm.quarter AND q.store_code = qm.store_code
)

SELECT
    res.quarter as 季度,
    res.last_month_of_quarter as 季度末月份,
    dc.statistics_city_name as 城市名称,
    res.store_name as 门店名称,
    res.store_code as 门店编码,
    res.opening_date as 开业日期,
    m.city_manager_name as 城市总姓名,
    m.technology_vice_name as 技术副总姓名,
    -- 本季度指标
    res.主营业务收入 as `主营业务收入（本季度完整月份）`,
    res.人工成本 as `人工成本（本季度完整月份）`,
    res.租金成本 as `租金成本（本季度完整月份）`,
    res.现金流 as `现金流（本季度完整月份）`,
    CONCAT(ROUND(nvl(res.当期成本占比, 0) * 100, 1), '%') as `当期成本占比（本季度完整月份）`,
    -- 上季度指标展示
    res.上季度主营业务收入,
    res.上季度人工成本,
    res.上季度租金成本,
    CONCAT(ROUND(nvl(res.上季度成本占比, 0) * 100, 1), '%') as 上季度成本占比,
    -- 上上季度指标展示
    res.上上季度主营业务收入,
    res.上上季度人工成本,
    res.上上季度租金成本,
    CONCAT(ROUND(nvl(res.上上季度成本占比, 0) * 100, 1), '%') as 上上季度成本占比,
    -- 资产与现金流指标
    res.总折旧,
    res.累计经营现金流,
    CONCAT(ROUND(nvl(res.累计现金流亏损占比, 0) * 100, 1), '%') as 累计现金流亏损占比,
    CASE
        WHEN (res.当期成本占比 > 1 AND res.上季度成本占比 > 1 AND res.上上季度成本占比 > 1)
             AND (res.累计经营现金流 < 0 AND -res.累计经营现金流 > res.总折旧 * 0.5)
             THEN '连续三个季度人工+租金成本占比超过 100% 且 累计现金流亏损超过折旧的 50%'
        WHEN (res.当期成本占比 > 1 AND res.上季度成本占比 > 1 AND res.上上季度成本占比 > 1)
             THEN '连续三个季度人工+租金成本占比超过 100%'
        WHEN (res.累计经营现金流 < 0 AND -res.累计经营现金流 > res.总折旧 * 0.5)
             THEN '累计现金流亏损超过折旧的 50%'
        ELSE ''
    END AS `预警原因`
FROM
    calculated_results res
LEFT JOIN tmp_manager_store_mapping m ON res.store_code = m.store_code
LEFT JOIN dm_city dc ON res.city_code = dc.city_code
WHERE
    -- 动态筛选：始终取数据集中最新的一个季度
    res.quarter = (SELECT MAX(quarter) FROM quarterly_store_metrics)
    AND (
        (res.当期成本占比 > 1 AND res.上季度成本占比 > 1 AND res.上上季度成本占比 > 1)
        OR (res.累计经营现金流 < 0 AND -res.累计经营现金流 > res.总折旧 * 0.5)
    )
ORDER BY
    res.city_code,
    res.store_code,
    res.quarter;