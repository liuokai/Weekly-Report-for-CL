-- 按月统计会员流失率

WITH monthly_churn_stats AS (  
        -- 第一步：按月汇总全公司数据  
        SELECT  
            month,  
            SUM(member_count) AS member_count,  
            SUM(lost_member_count) AS lost_member_count,  
            -- 计算加权流失率  
            ROUND(SUM(lost_member_count) / NULLIF(SUM(member_count), 0) * 100, 2) AS churn_rate  
        FROM dws_store_member_statistics_monthly  
        GROUP BY month  
    )  
    -- 第二步：自连接计算同比  
    SELECT  
        curr.month AS month,  
        curr.member_count AS member_count,  
        COALESCE(curr.lost_member_count, 0) AS lost_member_count,  
        COALESCE(curr.churn_rate, 0) AS churn_rate,  
        prev.churn_rate AS churn_rate_last_year,  
        ROUND(COALESCE(curr.churn_rate, 0) - prev.churn_rate, 2) AS churn_rate_yoy  
    FROM monthly_churn_stats curr  
         LEFT JOIN monthly_churn_stats prev  
                ON SUBSTRING(curr.month, 6, 2) = SUBSTRING(prev.month, 6, 2) -- 月份匹配  
                   AND CAST(SUBSTRING(curr.month, 1, 4) AS INT) = CAST(SUBSTRING(prev.month, 1, 4) AS INT) + 1 -- 年份差1  
    WHERE curr.month >= '2025-01'  
    ORDER BY curr.month ASC, churn_rate DESC;
