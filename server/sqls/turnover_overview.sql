--按年度统计营业额
select YEAR(off_clock_time) as year, sum(order_actual_payment) as total_turnover
from data_warehouse.dwd_sales_order_detail 
where off_clock_time >= '2024-01-01' 
group by YEAR(off_clock_time);
