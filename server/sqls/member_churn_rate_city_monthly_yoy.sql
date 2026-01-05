-- 按月份、城市维度统计会员流失率

WITH monthly_churn_stats AS (  
        -- 第一步：按月、按城市聚合数据  
        SELECT  
            month,  
            c.statistics_city_name AS city, -- 增加城市维度  
            SUM(member_count) AS member_count,  
            SUM(lost_member_count) AS lost_member_count,  
            -- 计算城市整体加权流失率  
            ROUND(SUM(lost_member_count) / NULLIF(SUM(member_count), 0) * 100, 2) AS churn_rate  
        FROM dws_store_member_statistics_monthly AS a  
             LEFT JOIN data_warehouse.ods_changle_store_business_store_information AS b  
                    ON a.store_code = b.store_code  
             LEFT JOIN dm_city AS c  
                    ON b.city_code = c.city_code -- 请根据实际维表关联键修改  
        GROUP BY month, c.statistics_city_name  
    )  
    -- 第二步：自连接计算同比  
    SELECT  
        curr.month AS month,  
        curr.city AS city,  
        curr.member_count AS member_count,  
        COALESCE(curr.lost_member_count, 0) AS lost_member_count,  
        COALESCE(curr.churn_rate, 0) AS churn_rate,  
        prev.churn_rate AS churn_rate_last_year,  
        ROUND(COALESCE(curr.churn_rate, 0) - prev.churn_rate, 2) AS churn_rate_yoy  
    FROM monthly_churn_stats curr  
         LEFT JOIN monthly_churn_stats prev  
                ON curr.city = prev.city  
                   AND SUBSTRING(curr.month, 6, 2) = SUBSTRING(prev.month, 6, 2) -- 月份匹配  
                   AND CAST(SUBSTRING(curr.month, 1, 4) AS INT) = CAST(SUBSTRING(prev.month, 1, 4) AS INT) + 1 -- 年份差1  
    WHERE curr.month >= '2025-01'  
    ORDER BY curr.month ASC, churn_rate DESC;