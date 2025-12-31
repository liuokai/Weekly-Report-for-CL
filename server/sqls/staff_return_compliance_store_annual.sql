-- 新员工回头率达标率分门店统计（按年、门店维度）

-- 新员工回头率达标率分门店统计（按年、城市、门店维度）
WITH yearly_store_metrics AS (
    -- 第一步：关联维表并按年、业务城市、门店汇总原始指标
    SELECT
        YEAR(STR_TO_DATE(CONCAT(a.month, '-01'), '%Y-%m-%d'))                     AS `report_year`,
        b.statistics_city_name                                                   AS `city_name`,
        a.store_code                                                             AS `store_code`,
        a.store_name                                                             AS `store_name`,
        -- 统计新员工总数（按工号去重）
        COUNT(DISTINCT a.job_number)                                             AS `total_new_staff`,
        -- 统计回头率达标的新员工数（按工号去重）
        COUNT(DISTINCT IF(a.is_return_rate_standard = '是', a.job_number, NULL)) AS `standard_staff_count`
    FROM data_warehouse.dws_indicator_detail_massagist AS a
    LEFT JOIN data_warehouse.dm_city AS b
        ON a.city_code = b.city_code
    WHERE a.company_tenure IN (1, 2, 3) -- 仅限司龄 1,2,3 的新员工
    GROUP BY 1, 2, 3, 4
),
rate_calc AS (
    -- 第二步：计算每年各门店的达标率
    SELECT
        report_year,
        city_name,
        store_code,
        store_name,
        total_new_staff,
        standard_staff_count,
        ROUND(standard_staff_count / NULLIF(total_new_staff, 0) * 100, 2) AS compliance_rate
    FROM yearly_store_metrics
)
-- 第三步：自连接（门店年度同比）并按照要求顺序输出字段
SELECT
    curr.city_name                                        AS city_name,              -- 城市
    curr.report_year                                      AS report_year,            -- 统计年份
    curr.store_code                                       AS store_code,             -- 门店编码
    curr.store_name                                       AS store_name,             -- 门店名称
    curr.total_new_staff                                  AS yearly_new_staff_count, -- 年维度下门店新员工人数
    curr.standard_staff_count                             AS yearly_standard_count,  -- 门店新员工回头率达标人数
    curr.compliance_rate                                  AS compliance_rate,        -- 门店新员工回头率达标率(%)
    prev.compliance_rate                                  AS compliance_rate_ly,     -- 去年该门店达标率(%)
    -- 同比校验逻辑：若该门店去年数据缺失，则结果自动为 NULL
    ROUND(curr.compliance_rate - prev.compliance_rate, 2) AS yoy_change_pct          -- 同比(百分点)
FROM rate_calc curr
LEFT JOIN rate_calc prev
    ON curr.store_code = prev.store_code -- 维度1：必须是同一个门店进行同比
    AND CAST(curr.report_year AS INT) = CAST(prev.report_year AS INT) + 1 -- 维度2：年份差1
ORDER BY report_year DESC, city_name ASC, compliance_rate DESC;