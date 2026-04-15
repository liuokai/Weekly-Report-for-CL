-- 新店门店数量统计

SELECT 
    year AS '年度',

    -- 合计
    SUM(  new_store_target_count  ) AS '合计_新店目标',
    SUM(  new_opened_store_count  ) AS '合计_新开店',
    SUM(  closed_store_count  ) AS '合计_闭店',
    SUM(  net_new_store_count  ) AS '合计_净增',
    SUM(  year_end_store_count  ) AS '合计_年末门店数',
    SUM(  target_comparison  ) AS '合计_对照目标',

    -- 上海
    SUM(CASE WHEN city_name = '上海' THEN new_store_target_count ELSE 0 END) AS '上海_新店目标',
    SUM(CASE WHEN city_name = '上海' THEN new_opened_store_count ELSE 0 END) AS '上海_新开店',
    SUM(CASE WHEN city_name = '上海' THEN closed_store_count ELSE 0 END) AS '上海_闭店',
    SUM(CASE WHEN city_name = '上海' THEN net_new_store_count ELSE 0 END) AS '上海_净增',
    SUM(CASE WHEN city_name = '上海' THEN year_end_store_count ELSE 0 END) AS '上海_年末门店数',
    SUM(CASE WHEN city_name = '上海' THEN target_comparison ELSE 0 END) AS '上海_对照目标',

    -- 北京
    SUM(CASE WHEN city_name = '北京' THEN new_store_target_count ELSE 0 END) AS '北京_新店目标',
    SUM(CASE WHEN city_name = '北京' THEN new_opened_store_count ELSE 0 END) AS '北京_新开店',
    SUM(CASE WHEN city_name = '北京' THEN closed_store_count ELSE 0 END) AS '北京_闭店',
    SUM(CASE WHEN city_name = '北京' THEN net_new_store_count ELSE 0 END) AS '北京_净增',
    SUM(CASE WHEN city_name = '北京' THEN year_end_store_count ELSE 0 END) AS '北京_年末门店数',
    SUM(CASE WHEN city_name = '北京' THEN target_comparison ELSE 0 END) AS '北京_对照目标',

    -- 南京
    SUM(CASE WHEN city_name = '南京' THEN new_store_target_count ELSE 0 END) AS '南京_新店目标',
    SUM(CASE WHEN city_name = '南京' THEN new_opened_store_count ELSE 0 END) AS '南京_新开店',
    SUM(CASE WHEN city_name = '南京' THEN closed_store_count ELSE 0 END) AS '南京_闭店',
    SUM(CASE WHEN city_name = '南京' THEN net_new_store_count ELSE 0 END) AS '南京_净增',
    SUM(CASE WHEN city_name = '南京' THEN year_end_store_count ELSE 0 END) AS '南京_年末门店数',
    SUM(CASE WHEN city_name = '南京' THEN target_comparison ELSE 0 END) AS '南京_对照目标',

    -- 四川
    SUM(CASE WHEN city_name = '四川' THEN new_store_target_count ELSE 0 END) AS '四川_新店目标',
    SUM(CASE WHEN city_name = '四川' THEN new_opened_store_count ELSE 0 END) AS '四川_新开店',
    SUM(CASE WHEN city_name = '四川' THEN closed_store_count ELSE 0 END) AS '四川_闭店',
    SUM(CASE WHEN city_name = '四川' THEN net_new_store_count ELSE 0 END) AS '四川_净增',
    SUM(CASE WHEN city_name = '四川' THEN year_end_store_count ELSE 0 END) AS '四川_年末门店数',
    SUM(CASE WHEN city_name = '四川' THEN target_comparison ELSE 0 END) AS '四川_对照目标',

    -- 宁波
    SUM(CASE WHEN city_name = '宁波' THEN new_store_target_count ELSE 0 END) AS '宁波_新店目标',
    SUM(CASE WHEN city_name = '宁波' THEN new_opened_store_count ELSE 0 END) AS '宁波_新开店',
    SUM(CASE WHEN city_name = '宁波' THEN closed_store_count ELSE 0 END) AS '宁波_闭店',
    SUM(CASE WHEN city_name = '宁波' THEN net_new_store_count ELSE 0 END) AS '宁波_净增',
    SUM(CASE WHEN city_name = '宁波' THEN year_end_store_count ELSE 0 END) AS '宁波_年末门店数',
    SUM(CASE WHEN city_name = '宁波' THEN target_comparison ELSE 0 END) AS '宁波_对照目标',

    -- 广州
    SUM(CASE WHEN city_name = '广州' THEN new_store_target_count ELSE 0 END) AS '广州_新店目标',
    SUM(CASE WHEN city_name = '广州' THEN new_opened_store_count ELSE 0 END) AS '广州_新开店',
    SUM(CASE WHEN city_name = '广州' THEN closed_store_count ELSE 0 END) AS '广州_闭店',
    SUM(CASE WHEN city_name = '广州' THEN net_new_store_count ELSE 0 END) AS '广州_净增',
    SUM(CASE WHEN city_name = '广州' THEN year_end_store_count ELSE 0 END) AS '广州_年末门店数',
    SUM(CASE WHEN city_name = '广州' THEN target_comparison ELSE 0 END) AS '广州_对照目标',

    -- 杭州
    SUM(CASE WHEN city_name = '杭州' THEN new_store_target_count ELSE 0 END) AS '杭州_新店目标',
    SUM(CASE WHEN city_name = '杭州' THEN new_opened_store_count ELSE 0 END) AS '杭州_新开店',
    SUM(CASE WHEN city_name = '杭州' THEN closed_store_count ELSE 0 END) AS '杭州_闭店',
    SUM(CASE WHEN city_name = '杭州' THEN net_new_store_count ELSE 0 END) AS '杭州_净增',
    SUM(CASE WHEN city_name = '杭州' THEN year_end_store_count ELSE 0 END) AS '杭州_年末门店数',
    SUM(CASE WHEN city_name = '杭州' THEN target_comparison ELSE 0 END) AS '杭州_对照目标',

    -- 深圳
    SUM(CASE WHEN city_name = '深圳' THEN new_store_target_count ELSE 0 END) AS '深圳_新店目标',
    SUM(CASE WHEN city_name = '深圳' THEN new_opened_store_count ELSE 0 END) AS '深圳_新开店',
    SUM(CASE WHEN city_name = '深圳' THEN closed_store_count ELSE 0 END) AS '深圳_闭店',
    SUM(CASE WHEN city_name = '深圳' THEN net_new_store_count ELSE 0 END) AS '深圳_净增',
    SUM(CASE WHEN city_name = '深圳' THEN year_end_store_count ELSE 0 END) AS '深圳_年末门店数',
    SUM(CASE WHEN city_name = '深圳' THEN target_comparison ELSE 0 END) AS '深圳_对照目标',

    -- 重庆
    SUM(CASE WHEN city_name = '重庆' THEN new_store_target_count ELSE 0 END) AS '重庆_新店目标',
    SUM(CASE WHEN city_name = '重庆' THEN new_opened_store_count ELSE 0 END) AS '重庆_新开店',
    SUM(CASE WHEN city_name = '重庆' THEN closed_store_count ELSE 0 END) AS '重庆_闭店',
    SUM(CASE WHEN city_name = '重庆' THEN net_new_store_count ELSE 0 END) AS '重庆_净增',
    SUM(CASE WHEN city_name = '重庆' THEN year_end_store_count ELSE 0 END) AS '重庆_年末门店数',
    SUM(CASE WHEN city_name = '重庆' THEN target_comparison ELSE 0 END) AS '重庆_对照目标'

FROM dws_new_store_statistics_year
GROUP BY year
ORDER BY year DESC;