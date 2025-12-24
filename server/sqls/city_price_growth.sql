SELECT '北京' as city, 350.0 as current_price, 320.0 as last_year_price, '9.4%' as growth_rate, 
150.0 as labor_cost, 20.0 as recruit_train_cost, 170.0 as total_cost, 200.0 as budget, 
'85%' as budget_usage_rate, '90%' as time_progress, '-5%' as usage_progress_diff
UNION ALL
SELECT '上海', 360.0, 340.0, '5.9%', 160.0, 25.0, 185.0, 210.0, '88%', '90%', '-2%'
UNION ALL
SELECT '广州', 330.0, 310.0, '6.5%', 140.0, 15.0, 155.0, 180.0, '86%', '90%', '-4%'
