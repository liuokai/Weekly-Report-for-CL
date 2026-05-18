with order_detail as (
SELECT
    a.order_no,
    a.order_uid,
    a.service_duration,
    a.job_number,
    a.order_actual_payment,
    a.is_massager_project_return_customer,
    a.project_code                      AS sub_project_code,
    a.project_name                      AS sub_project_name,
    nvl(b.project_code, a.project_code) AS main_project_code,
    nvl(b.project_name, a.project_name) AS main_project_name,
    nvl(c.label_name, '新增标签')       as label_name,
    nvl(c.name, '陈阳')                 as name,
    nvl(c.technique_name, '足疗')       as technique_name
    FROM data_warehouse.dwd_sales_order_detail a
    LEFT JOIN (SELECT order_no, job_number, project_code, project_name
          FROM (SELECT order_no,
                       job_number,
                       project_code,
                       project_name,
                       ROW_NUMBER() OVER (
                           PARTITION BY order_no, job_number
                           ORDER BY off_clock_time DESC
                           ) AS rn
                FROM data_warehouse.dwd_sales_order_detail
                WHERE service_duration >= 40) t
          WHERE rn = 1) b ON a.order_no = b.order_no AND a.job_number = b.job_number
    left join (select project_code,
               --  group_concat(name)    as name,
                 case max(technique_name)
                     when '推拿' then '李峰、陈阳'
                     when '经络' then '张冬萍、陈雪晴'
                     when '足疗' then '陈阳'
                     when '踩背' then '陈阳'
                         else group_concat(name)
                             end as name,
                 max(project_name)     as project_name,
                 max(label_name)       as label_name,
                 max(technique_code)   as technique_code,
                 max(technique_name)   as technique_name,
                 max(service_duration) as service_duration
          from data_warehouse.tmp_technical_director_project_mapping
          group by project_code) c on case nvl(b.project_code, a.project_code) -- 关联项目所属技法与技术总监
                                          when '30005' then '32008'
                                          else nvl(b.project_code, a.project_code) end =
                                      c.project_code
    WHERE a.off_clock_time >= '2026-01-01')

select name                                                                                     as '责任人',
       technique_name                                                                           as '技法名称',
       main_project_name                                                                        as '项目名称',
       label_name                                                                               as '项目类型',
       count(distinct job_number)                                                               as '挂标签人数',
       sum(order_actual_payment)                                                                as '营业额',
       round(sum(order_actual_payment) / sum(sum(order_actual_payment)) over (partition by 1), 4) as '营业额占比',
       count(if(service_duration >= 40, order_uid, null))                                       as '订单数',
       count(if(is_massager_project_return_customer = '是', order_uid, null))                   as '推拿师项目回头',
       round(count(if(is_massager_project_return_customer = '是', order_uid, null)) /
             count(if(service_duration >= 40, order_uid, null)), 4)                             as '推拿师项目回头率',
       round(sum(order_actual_payment) / count(if(service_duration >= 40, order_uid, null)), 2) as '客单价'
from order_detail
group by name, technique_name, main_project_name, label_name
order by technique_name, main_project_name, label_name
;
