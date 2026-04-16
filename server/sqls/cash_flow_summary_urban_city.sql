-- 城市现金流总结 


WITH base_data AS (
    -- 1. 历史数据部分 (2025及以前)
    SELECT
        year,
        city_code,
        city_name,
        net_cash_flow,
        new_store_investment AS total_investment_amt,
        year_end_surplus AS year_surplus
    FROM tmp_store_operating_cash_flow_city
    WHERE year <= '2025'

    UNION ALL

    -- 2. 当前年度数据部分 (2026)
    SELECT
        aa.year,
        aa.city_code,
        aa.city_name,
        aa.net_cash_flow,
        nvl(bb.total_investment_amt, 0) AS total_investment_amt,
        (nvl(aa.net_cash_flow, 0) - nvl(bb.total_investment_amt, 0)) AS year_surplus
    FROM (
        SELECT
            LEFT(month, 4) AS year,
            IF(city_code IN ('028', '0816', '0838'), '028', city_code) AS city_code,
            IF(city_name IN ('成都市', '德阳市', '绵阳市'), '四川', city_name) AS city_name, -- 对应你图中四川的逻辑
            SUM(net_cash_flow) AS net_cash_flow
        FROM data_warehouse.dws_profit_store_detail_monthly
        WHERE month BETWEEN '2026-01' AND DATE_FORMAT(CURRENT_DATE(), '%Y-%m')
        GROUP BY 1, 2, 3
    ) aa
    LEFT JOIN (
        SELECT
            CAST(YEAR(CURRENT_DATE()) AS CHAR) AS year,
            city_code,
            SUM(total_investment_amt) AS total_investment_amt
        FROM data_warehouse.dws_store_initial_investment
        GROUP BY 1, 2
    ) bb ON bb.year = aa.year AND bb.city_code = aa.city_code
)
-- 3. 最终透视展示并添加合计
SELECT
    year AS '年度',
    -- 全局合计列
    SUM(net_cash_flow) AS '总_经营现金流',
    SUM(total_investment_amt) AS '总_新店投资',
    SUM(year_surplus) AS '总_年度结余',
    -- 上海
    SUM(CASE WHEN city_name LIKE '%上海%' THEN net_cash_flow ELSE 0 END) AS '上海_经营现金流',
    SUM(CASE WHEN city_name LIKE '%上海%' THEN total_investment_amt ELSE 0 END) AS '上海_新店投资',
    SUM(CASE WHEN city_name LIKE '%上海%' THEN year_surplus ELSE 0 END) AS '上海_年度结余',

    -- 北京
    SUM(CASE WHEN city_name LIKE '%北京%' THEN net_cash_flow ELSE 0 END) AS '北京_经营现金流',
    SUM(CASE WHEN city_name LIKE '%北京%' THEN total_investment_amt ELSE 0 END) AS '北京_新店投资',
    SUM(CASE WHEN city_name LIKE '%北京%' THEN year_surplus ELSE 0 END) AS '北京_年度结余',

    -- 南京
    SUM(CASE WHEN city_name LIKE '%南京%' THEN net_cash_flow ELSE 0 END) AS '南京_经营现金流',
    SUM(CASE WHEN city_name LIKE '%南京%' THEN total_investment_amt ELSE 0 END) AS '南京_新店投资',
    SUM(CASE WHEN city_name LIKE '%南京%' THEN year_surplus ELSE 0 END) AS '南京_年度结余',

    -- 四川 (对应逻辑中的成德绵汇总)
    SUM(CASE WHEN city_name = '四川' THEN net_cash_flow ELSE 0 END) AS '四川_经营现金流',
    SUM(CASE WHEN city_name = '四川' THEN total_investment_amt ELSE 0 END) AS '四川_新店投资',
    SUM(CASE WHEN city_name = '四川' THEN year_surplus ELSE 0 END) AS '四川_年度结余',

    -- 宁波
    SUM(CASE WHEN city_name LIKE '%宁波%' THEN net_cash_flow ELSE 0 END) AS '宁波_经营现金流',
    SUM(CASE WHEN city_name LIKE '%宁波%' THEN total_investment_amt ELSE 0 END) AS '宁波_新店投资',
    SUM(CASE WHEN city_name LIKE '%宁波%' THEN year_surplus ELSE 0 END) AS '宁波_年度结余',

    -- 广州
    SUM(CASE WHEN city_name LIKE '%广州%' THEN net_cash_flow ELSE 0 END) AS '广州_经营现金流',
    SUM(CASE WHEN city_name LIKE '%广州%' THEN total_investment_amt ELSE 0 END) AS '广州_新店投资',
    SUM(CASE WHEN city_name LIKE '%广州%' THEN year_surplus ELSE 0 END) AS '广州_年度结余',

    -- 杭州
    SUM(CASE WHEN city_name LIKE '%杭州%' THEN net_cash_flow ELSE 0 END) AS '杭州_经营现金流',
    SUM(CASE WHEN city_name LIKE '%杭州%' THEN total_investment_amt ELSE 0 END) AS '杭州_新店投资',
    SUM(CASE WHEN city_name LIKE '%杭州%' THEN year_surplus ELSE 0 END) AS '杭州_年度结余',

    -- 深圳
    SUM(CASE WHEN city_name LIKE '%深圳%' THEN net_cash_flow ELSE 0 END) AS '深圳_经营现金流',
    SUM(CASE WHEN city_name LIKE '%深圳%' THEN total_investment_amt ELSE 0 END) AS '深圳_新店投资',
    SUM(CASE WHEN city_name LIKE '%深圳%' THEN year_surplus ELSE 0 END) AS '深圳_年度结余',

    -- 重庆
    SUM(CASE WHEN city_name LIKE '%重庆%' THEN net_cash_flow ELSE 0 END) AS '重庆_经营现金流',
    SUM(CASE WHEN city_name LIKE '%重庆%' THEN total_investment_amt ELSE 0 END) AS '重庆_新店投资',
    SUM(CASE WHEN city_name LIKE '%重庆%' THEN year_surplus ELSE 0 END) AS '重庆_年度结余'

FROM base_data
GROUP BY year
ORDER BY   year DESC;