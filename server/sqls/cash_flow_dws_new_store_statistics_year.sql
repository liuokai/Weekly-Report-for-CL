-- 年度数据（原第一个SQL，城市顺序已调整）
SELECT year                                                                     AS '年度',

       -- 合计
       SUM(new_store_target_count)                                              AS '合计_新店目标',
       SUM(new_opened_store_count)                                              AS '合计_新开店',
       SUM(closed_store_count)                                                  AS '合计_闭店',
       SUM(net_new_store_count)                                                 AS '合计_净增',
       SUM(year_end_store_count)                                                AS '合计_年末门店数',
       SUM(target_comparison)                                                   AS '合计_对照目标',

       -- 四川 (028)
       SUM(CASE WHEN city_name = '四川' THEN new_store_target_count ELSE 0 END) AS '四川_新店目标',
       SUM(CASE WHEN city_name = '四川' THEN new_opened_store_count ELSE 0 END) AS '四川_新开店',
       SUM(CASE WHEN city_name = '四川' THEN closed_store_count ELSE 0 END)     AS '四川_闭店',
       SUM(CASE WHEN city_name = '四川' THEN net_new_store_count ELSE 0 END)    AS '四川_净增',
       SUM(CASE WHEN city_name = '四川' THEN year_end_store_count ELSE 0 END)   AS '四川_年末门店数',
       SUM(CASE WHEN city_name = '四川' THEN target_comparison ELSE 0 END)      AS '四川_对照目标',

       -- 重庆 (023)
       SUM(CASE WHEN city_name = '重庆' THEN new_store_target_count ELSE 0 END) AS '重庆_新店目标',
       SUM(CASE WHEN city_name = '重庆' THEN new_opened_store_count ELSE 0 END) AS '重庆_新开店',
       SUM(CASE WHEN city_name = '重庆' THEN closed_store_count ELSE 0 END)     AS '重庆_闭店',
       SUM(CASE WHEN city_name = '重庆' THEN net_new_store_count ELSE 0 END)    AS '重庆_净增',
       SUM(CASE WHEN city_name = '重庆' THEN year_end_store_count ELSE 0 END)   AS '重庆_年末门店数',
       SUM(CASE WHEN city_name = '重庆' THEN target_comparison ELSE 0 END)      AS '重庆_对照目标',

       -- 深圳 (0755)
       SUM(CASE WHEN city_name = '深圳' THEN new_store_target_count ELSE 0 END) AS '深圳_新店目标',
       SUM(CASE WHEN city_name = '深圳' THEN new_opened_store_count ELSE 0 END) AS '深圳_新开店',
       SUM(CASE WHEN city_name = '深圳' THEN closed_store_count ELSE 0 END)     AS '深圳_闭店',
       SUM(CASE WHEN city_name = '深圳' THEN net_new_store_count ELSE 0 END)    AS '深圳_净增',
       SUM(CASE WHEN city_name = '深圳' THEN year_end_store_count ELSE 0 END)   AS '深圳_年末门店数',
       SUM(CASE WHEN city_name = '深圳' THEN target_comparison ELSE 0 END)      AS '深圳_对照目标',

       -- 杭州 (0571)
       SUM(CASE WHEN city_name = '杭州' THEN new_store_target_count ELSE 0 END) AS '杭州_新店目标',
       SUM(CASE WHEN city_name = '杭州' THEN new_opened_store_count ELSE 0 END) AS '杭州_新开店',
       SUM(CASE WHEN city_name = '杭州' THEN closed_store_count ELSE 0 END)     AS '杭州_闭店',
       SUM(CASE WHEN city_name = '杭州' THEN net_new_store_count ELSE 0 END)    AS '杭州_净增',
       SUM(CASE WHEN city_name = '杭州' THEN year_end_store_count ELSE 0 END)   AS '杭州_年末门店数',
       SUM(CASE WHEN city_name = '杭州' THEN target_comparison ELSE 0 END)      AS '杭州_对照目标',

       -- 南京 (025)
       SUM(CASE WHEN city_name = '南京' THEN new_store_target_count ELSE 0 END) AS '南京_新店目标',
       SUM(CASE WHEN city_name = '南京' THEN new_opened_store_count ELSE 0 END) AS '南京_新开店',
       SUM(CASE WHEN city_name = '南京' THEN closed_store_count ELSE 0 END)     AS '南京_闭店',
       SUM(CASE WHEN city_name = '南京' THEN net_new_store_count ELSE 0 END)    AS '南京_净增',
       SUM(CASE WHEN city_name = '南京' THEN year_end_store_count ELSE 0 END)   AS '南京_年末门店数',
       SUM(CASE WHEN city_name = '南京' THEN target_comparison ELSE 0 END)      AS '南京_对照目标',

       -- 宁波 (0574)
       SUM(CASE WHEN city_name = '宁波' THEN new_store_target_count ELSE 0 END) AS '宁波_新店目标',
       SUM(CASE WHEN city_name = '宁波' THEN new_opened_store_count ELSE 0 END) AS '宁波_新开店',
       SUM(CASE WHEN city_name = '宁波' THEN closed_store_count ELSE 0 END)     AS '宁波_闭店',
       SUM(CASE WHEN city_name = '宁波' THEN net_new_store_count ELSE 0 END)    AS '宁波_净增',
       SUM(CASE WHEN city_name = '宁波' THEN year_end_store_count ELSE 0 END)   AS '宁波_年末门店数',
       SUM(CASE WHEN city_name = '宁波' THEN target_comparison ELSE 0 END)      AS '宁波_对照目标',

       -- 广州 (020)
       SUM(CASE WHEN city_name = '广州' THEN new_store_target_count ELSE 0 END) AS '广州_新店目标',
       SUM(CASE WHEN city_name = '广州' THEN new_opened_store_count ELSE 0 END) AS '广州_新开店',
       SUM(CASE WHEN city_name = '广州' THEN closed_store_count ELSE 0 END)     AS '广州_闭店',
       SUM(CASE WHEN city_name = '广州' THEN net_new_store_count ELSE 0 END)    AS '广州_净增',
       SUM(CASE WHEN city_name = '广州' THEN year_end_store_count ELSE 0 END)   AS '广州_年末门店数',
       SUM(CASE WHEN city_name = '广州' THEN target_comparison ELSE 0 END)      AS '广州_对照目标',

       -- 上海 (021)
       SUM(CASE WHEN city_name = '上海' THEN new_store_target_count ELSE 0 END) AS '上海_新店目标',
       SUM(CASE WHEN city_name = '上海' THEN new_opened_store_count ELSE 0 END) AS '上海_新开店',
       SUM(CASE WHEN city_name = '上海' THEN closed_store_count ELSE 0 END)     AS '上海_闭店',
       SUM(CASE WHEN city_name = '上海' THEN net_new_store_count ELSE 0 END)    AS '上海_净增',
       SUM(CASE WHEN city_name = '上海' THEN year_end_store_count ELSE 0 END)   AS '上海_年末门店数',
       SUM(CASE WHEN city_name = '上海' THEN target_comparison ELSE 0 END)      AS '上海_对照目标',

       -- 北京 (010)
       SUM(CASE WHEN city_name = '北京' THEN new_store_target_count ELSE 0 END) AS '北京_新店目标',
       SUM(CASE WHEN city_name = '北京' THEN new_opened_store_count ELSE 0 END) AS '北京_新开店',
       SUM(CASE WHEN city_name = '北京' THEN closed_store_count ELSE 0 END)     AS '北京_闭店',
       SUM(CASE WHEN city_name = '北京' THEN net_new_store_count ELSE 0 END)    AS '北京_净增',
       SUM(CASE WHEN city_name = '北京' THEN year_end_store_count ELSE 0 END)   AS '北京_年末门店数',
       SUM(CASE WHEN city_name = '北京' THEN target_comparison ELSE 0 END)      AS '北京_对照目标'

FROM dws_new_store_statistics_year
GROUP BY year

UNION ALL

-- 月度数据（直接嵌套子查询，城市顺序已调整）
SELECT t.year_month                                                                                AS '年度',

       -- 合计
       SUM(t.new_store_target)                                                                     AS '合计_新店目标',
       SUM(t.new_opened_store)                                                                     AS '合计_新开店',
       SUM(t.closed_store)                                                                         AS '合计_闭店',
       SUM(t.new_opened_store - t.closed_store)                                                    AS '合计_净增',
       SUM(t.current_year_end_store)                                                               AS '合计_年末门店数',
       SUM(t.new_opened_store - t.new_store_target)                                                AS '合计_对照目标',

       -- 四川 (028)
       SUM(CASE WHEN t.city_code = '028' THEN t.new_store_target ELSE 0 END)                       AS '四川_新店目标',
       SUM(CASE WHEN t.city_code = '028' THEN t.new_opened_store ELSE 0 END)                       AS '四川_新开店',
       SUM(CASE WHEN t.city_code = '028' THEN t.closed_store ELSE 0 END)                           AS '四川_闭店',
       SUM(CASE WHEN t.city_code = '028' THEN t.new_opened_store - t.closed_store ELSE 0 END)      AS '四川_净增',
       SUM(CASE WHEN t.city_code = '028' THEN t.current_year_end_store ELSE 0 END)                 AS '四川_年末门店数',
       SUM(CASE WHEN t.city_code = '028' THEN t.new_opened_store - t.new_store_target ELSE 0 END)  AS '四川_对照目标',

       -- 重庆 (023)
       SUM(CASE WHEN t.city_code = '023' THEN t.new_store_target ELSE 0 END)                       AS '重庆_新店目标',
       SUM(CASE WHEN t.city_code = '023' THEN t.new_opened_store ELSE 0 END)                       AS '重庆_新开店',
       SUM(CASE WHEN t.city_code = '023' THEN t.closed_store ELSE 0 END)                           AS '重庆_闭店',
       SUM(CASE WHEN t.city_code = '023' THEN t.new_opened_store - t.closed_store ELSE 0 END)      AS '重庆_净增',
       SUM(CASE WHEN t.city_code = '023' THEN t.current_year_end_store ELSE 0 END)                 AS '重庆_年末门店数',
       SUM(CASE WHEN t.city_code = '023' THEN t.new_opened_store - t.new_store_target ELSE 0 END)  AS '重庆_对照目标',

       -- 深圳 (0755)
       SUM(CASE WHEN t.city_code = '0755' THEN t.new_store_target ELSE 0 END)                      AS '深圳_新店目标',
       SUM(CASE WHEN t.city_code = '0755' THEN t.new_opened_store ELSE 0 END)                      AS '深圳_新开店',
       SUM(CASE WHEN t.city_code = '0755' THEN t.closed_store ELSE 0 END)                          AS '深圳_闭店',
       SUM(CASE WHEN t.city_code = '0755' THEN t.new_opened_store - t.closed_store ELSE 0 END)     AS '深圳_净增',
       SUM(CASE WHEN t.city_code = '0755' THEN t.current_year_end_store ELSE 0 END)                AS '深圳_年末门店数',
       SUM(CASE WHEN t.city_code = '0755' THEN t.new_opened_store - t.new_store_target ELSE 0 END) AS '深圳_对照目标',

       -- 杭州 (0571)
       SUM(CASE WHEN t.city_code = '0571' THEN t.new_store_target ELSE 0 END)                      AS '杭州_新店目标',
       SUM(CASE WHEN t.city_code = '0571' THEN t.new_opened_store ELSE 0 END)                      AS '杭州_新开店',
       SUM(CASE WHEN t.city_code = '0571' THEN t.closed_store ELSE 0 END)                          AS '杭州_闭店',
       SUM(CASE WHEN t.city_code = '0571' THEN t.new_opened_store - t.closed_store ELSE 0 END)     AS '杭州_净增',
       SUM(CASE WHEN t.city_code = '0571' THEN t.current_year_end_store ELSE 0 END)                AS '杭州_年末门店数',
       SUM(CASE WHEN t.city_code = '0571' THEN t.new_opened_store - t.new_store_target ELSE 0 END) AS '杭州_对照目标',

       -- 南京 (025)
       SUM(CASE WHEN t.city_code = '025' THEN t.new_store_target ELSE 0 END)                       AS '南京_新店目标',
       SUM(CASE WHEN t.city_code = '025' THEN t.new_opened_store ELSE 0 END)                       AS '南京_新开店',
       SUM(CASE WHEN t.city_code = '025' THEN t.closed_store ELSE 0 END)                           AS '南京_闭店',
       SUM(CASE WHEN t.city_code = '025' THEN t.new_opened_store - t.closed_store ELSE 0 END)      AS '南京_净增',
       SUM(CASE WHEN t.city_code = '025' THEN t.current_year_end_store ELSE 0 END)                 AS '南京_年末门店数',
       SUM(CASE WHEN t.city_code = '025' THEN t.new_opened_store - t.new_store_target ELSE 0 END)  AS '南京_对照目标',

       -- 宁波 (0574)
       SUM(CASE WHEN t.city_code = '0574' THEN t.new_store_target ELSE 0 END)                      AS '宁波_新店目标',
       SUM(CASE WHEN t.city_code = '0574' THEN t.new_opened_store ELSE 0 END)                      AS '宁波_新开店',
       SUM(CASE WHEN t.city_code = '0574' THEN t.closed_store ELSE 0 END)                          AS '宁波_闭店',
       SUM(CASE WHEN t.city_code = '0574' THEN t.new_opened_store - t.closed_store ELSE 0 END)     AS '宁波_净增',
       SUM(CASE WHEN t.city_code = '0574' THEN t.current_year_end_store ELSE 0 END)                AS '宁波_年末门店数',
       SUM(CASE WHEN t.city_code = '0574' THEN t.new_opened_store - t.new_store_target ELSE 0 END) AS '宁波_对照目标',

       -- 广州 (020)
       SUM(CASE WHEN t.city_code = '020' THEN t.new_store_target ELSE 0 END)                       AS '广州_新店目标',
       SUM(CASE WHEN t.city_code = '020' THEN t.new_opened_store ELSE 0 END)                       AS '广州_新开店',
       SUM(CASE WHEN t.city_code = '020' THEN t.closed_store ELSE 0 END)                           AS '广州_闭店',
       SUM(CASE WHEN t.city_code = '020' THEN t.new_opened_store - t.closed_store ELSE 0 END)      AS '广州_净增',
       SUM(CASE WHEN t.city_code = '020' THEN t.current_year_end_store ELSE 0 END)                 AS '广州_年末门店数',
       SUM(CASE WHEN t.city_code = '020' THEN t.new_opened_store - t.new_store_target ELSE 0 END)  AS '广州_对照目标',

       -- 上海 (021)
       SUM(CASE WHEN t.city_code = '021' THEN t.new_store_target ELSE 0 END)                       AS '上海_新店目标',
       SUM(CASE WHEN t.city_code = '021' THEN t.new_opened_store ELSE 0 END)                       AS '上海_新开店',
       SUM(CASE WHEN t.city_code = '021' THEN t.closed_store ELSE 0 END)                           AS '上海_闭店',
       SUM(CASE WHEN t.city_code = '021' THEN t.new_opened_store - t.closed_store ELSE 0 END)      AS '上海_净增',
       SUM(CASE WHEN t.city_code = '021' THEN t.current_year_end_store ELSE 0 END)                 AS '上海_年末门店数',
       SUM(CASE WHEN t.city_code = '021' THEN t.new_opened_store - t.new_store_target ELSE 0 END)  AS '上海_对照目标',

       -- 北京 (010)
       SUM(CASE WHEN t.city_code = '010' THEN t.new_store_target ELSE 0 END)                       AS '北京_新店目标',
       SUM(CASE WHEN t.city_code = '010' THEN t.new_opened_store ELSE 0 END)                       AS '北京_新开店',
       SUM(CASE WHEN t.city_code = '010' THEN t.closed_store ELSE 0 END)                           AS '北京_闭店',
       SUM(CASE WHEN t.city_code = '010' THEN t.new_opened_store - t.closed_store ELSE 0 END)      AS '北京_净增',
       SUM(CASE WHEN t.city_code = '010' THEN t.current_year_end_store ELSE 0 END)                 AS '北京_年末门店数',
       SUM(CASE WHEN t.city_code = '010' THEN t.new_opened_store - t.new_store_target ELSE 0 END)  AS '北京_对照目标'

FROM (
         -- 你提供的原始聚合SQL，作为嵌套子查询
         SELECT LEFT(a.month, 4)                                                   AS 'year_month',
                b.statistics_city_code                                             AS 'city_code',
                b.statistics_city_name                                             AS 'city_name',
                SUM(a.new_store_opening_target)                                    AS 'new_store_target',
                SUM(a.new_store_opening_num)                                       AS 'new_opened_store',
                SUM(a.closing_store_num)                                           AS 'closed_store',
                max(c.year_end_store_count)                                        AS 'last_year_end_store',
                max(NVL(c.year_end_store_count, 0)) +
                SUM(NVL(a.new_store_opening_num, 0) - NVL(a.closing_store_num, 0)) AS 'current_year_end_store'
         FROM dws_store_open_progress_monthly a
                  LEFT JOIN dm_city b ON a.city_code = b.city_code
                  LEFT JOIN dws_new_store_statistics_year c
                            ON b.city_code = c.city_code AND LEFT(a.month, 4) = c.year + 1
         WHERE a.month >= '2026-01'
         GROUP BY LEFT(a.month, 4),
                  b.statistics_city_code,
                  b.statistics_city_name) t
GROUP BY t.year_month

ORDER BY `年度`;


