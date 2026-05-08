

-- 总部岗位指标配置
select
    quarter        ,-- '季度，如：2024-Q1',
    event          ,-- '事件名称',
    task           ,-- '任务名称',
    post_name      ,-- '岗位',
    job_number     ,-- '工号',
    budget_subject ,-- '预算科目详情',
    name           ,--  '名字',
    budget_amount  ,-- '预算金额',
    actual_amount  ,-- '实际使用金额',
    balance_amount --  '结余金额(自动计算)'

from tmp_hq_post_indicator_config;