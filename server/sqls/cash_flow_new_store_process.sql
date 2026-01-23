-- 新店目标与开店实际情况

select
    month,
    city_name,

    new_store_opening_target      as `新店目标`,
    new_store_opening_num         as `新店数量`,

    case
        -- 有实际，但目标为 0 / NULL → 高于目标
        when (new_store_opening_target is null or new_store_opening_target = 0)
             and new_store_opening_num > 0 then '高于目标'

        -- 目标为 0 / NULL，且实际也为 0 / NULL → 不标记
        when (new_store_opening_target is null or new_store_opening_target = 0)
             and (new_store_opening_num is null or new_store_opening_num = 0) then null

        -- 正常对比目标
        when new_store_opening_num = new_store_opening_target then '如期完成'
        when new_store_opening_num > new_store_opening_target then '高于目标'
        when new_store_opening_num < new_store_opening_target then '未完成'
    end as `新店目标完成情况`,

    reinstall_store_target        as `重装目标`,
    reinstall_store_num           as `重装数量`,

    case
        when (reinstall_store_target is null or reinstall_store_target = 0)
             and reinstall_store_num > 0 then '高于目标'

        when (reinstall_store_target is null or reinstall_store_target = 0)
             and (reinstall_store_num is null or reinstall_store_num = 0) then null

        when reinstall_store_num = reinstall_store_target then '如期完成'
        when reinstall_store_num > reinstall_store_target then '高于目标'
        when reinstall_store_num < reinstall_store_target then '未完成'
    end as `重装目标完成情况`,

    total_store_num               as `门店数量`

from dws_store_open_progress_monthly
order by month, total_store_num desc;