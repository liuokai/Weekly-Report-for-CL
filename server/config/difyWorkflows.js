const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../server/.env') });

const difyWorkflows = [
  {
    id: 'turnover_overview',
    name: '营业额概览智能分析工作流',
    apiKey: process.env.DIFY_API_KEY_turnover_overview,
    user: 'changle-user-turnover_overview',
    description: '用于营业额 Tab 中营业额概览数据容器的智能总结'
  },
  {
    id: 'new_store_summary',
    name: '新店总结分析工作流',
    apiKey: process.env.DIFY_API_KEY_newstoreanalysis,
    user: 'changle-user-newstore-analysis',
    description: '用于现金流与新店 Tab 中新店总结数据容器的智能分析'
  },
  {
    id: 'position_reminder',
    name: '岗位提醒生成工作流',
    apiKey: process.env.DIFY_API_KEY_position_reminder,
    user: 'changle-user-position-reminder',
    description: '用于营业额 Tab 客单价拆解中的岗位提醒生成'
  },
  // You can add more workflows here if you have multiple Dify Apps
  // {
  //   id: 'finance_analysis',
  //   name: '财务专项分析',
  //   apiKey: 'app-...'
  // }
];

module.exports = difyWorkflows;
