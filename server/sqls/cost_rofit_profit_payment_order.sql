-- 总部岗位及指标明细
select CONCAT(YEAR(STR_TO_DATE(orders.send_bank_time, '%Y-%m')), 'Q',
              CEIL(MONTH(STR_TO_DATE(orders.send_bank_time, '%Y-%m')) / 3)) as quarter,           -- 归属季度
       orders.code as code,                                                                        -- 单据编号
       orders.fund_organization as fund_organization,                                              -- 组织名称
       orders.created_on as created_on,                                                            -- 创建时间
       if(orders.supplier is not null, orders.supplier, payto.supplier) as supplier_name,         -- 申请单位
       payto.supplier_Id as supplier_id,                                                           -- 申请人工号
       orders.payment_type as payment_type,                                                        -- 付款类型
       payto.material_name as material_name,                                                       -- 对象类型
       orders.excerpt as excerpt,                                                                  -- 付款摘要
       orders.payment as payment,                                                                  -- 付款金额
       orders.payment_name as payment_name,                                                        -- 付款单位
       orders.payment_num as payment_num,                                                          -- 付款账号
       orders.payment_bank as payment_bank,                                                        -- 付款银行
       orders.payee as payee,                                                                      -- 收款单位
       orders.payee_num as payee_num,                                                              -- 收款账号
       orders.payee_bank as payee_bank,                                                            -- 收款银行
       orders.send_bank_time as send_bank_time,                                                    -- 提交银行时间
       orders.bank_return_time as bank_return_time,                                                -- 银行返回时间
       orders.bank_return as bank_return,                                                          -- 银行返回信息
       orders.security_code as security_code,                                                      -- 对账防标码
       orders.pay_msg as pay_msg,                                                                  -- 付款失败原因
       CASE orders.state
           WHEN 0 THEN '待审核'
           WHEN 1 THEN '已审核'
           WHEN 2 THEN '审核失败'
           ELSE '未知'
           END as danju,                                                                           -- 单据状态
       CASE orders.kp_state
           WHEN '0' THEN '未开票'
           WHEN '1' THEN '已开票'
           ELSE '未知'
           END as kaipiao,                                                                         -- 发票状态
       CASE orders.account_status
           WHEN '0' THEN '未入账'
           WHEN '1' THEN '入账'
           ELSE '未入账'
           END as ruzhang,                                                                         -- 入账状态
       CASE orders.payment_statu
           WHEN 0 THEN '待付款'
           WHEN 1 THEN '付款成功'
           WHEN 2 THEN '付款失败'
           WHEN 3 THEN '处理中'
           WHEN 4 THEN '其他'
           ELSE '未知'
           END as fukuan                                                                           -- 付款状态
from data_warehouse_ods.ods_tencent_payment_order as orders
left join data_warehouse_ods.ods_tencent_pay_to_orderno as payto on payto.code = orders.code
where orders.del_flg = 0
  and payto.del_flg = 0
  and orders.payment_statu = '1'
  and orders.payment_type = '费用报销'
  and orders.payment is not null
  and orders.send_bank_time >= '2026-01-01 00:00:00'
  and payto.supplier_Id = ?
order by orders.send_bank_time desc, orders.created_on desc;
