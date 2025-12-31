-- 新员工回头率达标率分城市统计（按年、城市维度）

-- 按年、城市维度统计新员工回头率达标率（含达标人数及同比校验）
WITH yearly_city_metrics AS (
    -- 第一步：关联维表并按年、业务城市汇总原始指标
    SELECT YEAR(STR_TO_DATE(CONCAT(month, '-01'), '%Y-%m-%d'))                      AS `report_year`,
           b.statistics_city_name                                                   AS `city_name`,
           -- 统计新员工总数（按工号去重）
           COUNT(DISTINCT a.job_number)                                             AS `total_new_staff`,
           -- 统计回头率达标的新员工数（按工号去重）
           COUNT(DISTINCT IF(a.is_return_rate_standard = '是', a.job_number, NULL)) AS `standard_staff_count`
    FROM data_warehouse.dws_indicator_detail_massagist AS a
    LEFT JOIN data_warehouse.dm_city AS b ON a.city_code = b.city_code
    WHERE a.company_tenure in (1,2,3)  -- 仅限新员工
    GROUP BY 1, 2),  
     rate_calc AS (
         -- 第二步：计算每年各城市的达标率
         SELECT city_name,
                report_year,
                total_new_staff,
                standard_staff_count,
                ROUND(standard_staff_count / NULLIF(total_new_staff, 0) * 100, 2) AS compliance_rate
         FROM yearly_city_metrics)
-- 第三步：自连接并按照要求顺序输出字段
SELECT curr.city_name                                        AS city_name,              -- 城市
       curr.report_year                                      AS report_year,            -- 统计年份
       curr.total_new_staff                                  AS yearly_new_staff_count, -- 年维度下新员工人数
       curr.standard_staff_count                             AS yearly_standard_count,  -- 新员工回头率达标人数
       curr.compliance_rate                                  AS compliance_rate,        -- 新员工回头率达标率(%)
       prev.compliance_rate                                  AS compliance_rate_ly,     -- 去年的新员工回头率达标率(%)
       -- 同比校验逻辑：若去年数据缺失，则结果自动为 NULL
       ROUND(curr.compliance_rate - prev.compliance_rate, 2) AS yoy_change_pct          -- 同比(百分点)
FROM rate_calc curr
         LEFT JOIN rate_calc prev
                   ON curr.city_name = prev.city_name
                       AND CAST(curr.report_year AS INT) = CAST(prev.report_year AS INT) + 1
ORDER BY report_year DESC, city_name ASC;