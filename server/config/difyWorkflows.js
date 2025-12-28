const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../server/.env') });

const difyWorkflows = [
  {
    id: 'default',
    name: '默认经营分析工作流',
    apiKey: process.env.DIFY_API_KEY,
    description: '使用系统默认配置的 Dify 工作流进行分析'
  },
  // You can add more workflows here if you have multiple Dify Apps
  // {
  //   id: 'finance_analysis',
  //   name: '财务专项分析',
  //   apiKey: 'app-...'
  // }
];

module.exports = difyWorkflows;
