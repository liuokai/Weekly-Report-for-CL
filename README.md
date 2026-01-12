# 常乐经营管理周报系统

- 技术栈：React 18、Webpack 5、Express、MySQL2（Doris 兼容）、TailwindCSS
- 端口：前端 8000（代理后端 3001）

## 项目概述

常乐经营管理周报系统聚焦总部与城市维度核心营运指标的周报看板。前端以 React 单页应用展示业务数据与图表，后端以 Node.js/Express 作为 BFF 层统一管理 SQL 查询与 AI 工作流代理，前后端通过 `/api` 路由交互。

### 核心特性

- BFF 中台：后端统一维护 SQL 注册表与查询执行，隔离前端与数据源/密钥
- 统一 UI：通用图表、表格、进度条组件保证一致性
- 代理与缓存：Webpack Dev Server 代理后端；后端内置缓存命中提升体验
- 无兜底策略：移除兜底/示例数据源；真实 SQL 无结果时前端展示空白

## 系统架构

采用 Client–BFF–Database 三层架构，BFF 同时承担 AI 工作流代理。

### 核心目录结构

```
├── public/                 静态资源入口
├── src/                    前端源码 (React)
│   ├── components/Common   通用组件
│   ├── pages               业务页面（营业额/成本与利润/现金流/门店）
│   │   └── Turnover        营业额模块页面与组件
│   ├── config              前端配置（业务目标、AI 开关）
│   ├── services            接口封装
│   └── utils               工具函数与数据预加载
├── server/                 后端源码 (BFF)
│   ├── sqls                SQL 查询文件仓库
│   ├── index.js            服务入口与路由
│   ├── queryRegistry.js    SQL 注册表（queryKey → SQL）
│   └── .env                环境变量（数据库、AI Keys）
├── package.json            根依赖与脚本
└── webpack.config.js       构建与代理配置
```

## 页面与数据

### WeeklyReport 总览
- Tab 切换：营业额 / 成本与利润 / 现金流
- 入口组件位置：[WeeklyReport/index.jsx](file:///Users/kailiu/AI-Project/ChangLe%20Operations%20Weekly/src/pages/WeeklyReport/index.jsx)

### 营业额模块（Turnover）
- 价格分解（客单价、指标联动）：[PriceDecompositionContainer.jsx](file:///Users/kailiu/AI-Project/ChangLe%20Operations%20Weekly/src/pages/Turnover/PriceDecompositionContainer.jsx)
- 客次量分解（影响指标分析、城市统计）：[VolumeDecompositionContainer.jsx](file:///Users/kailiu/AI-Project/ChangLe%20Operations%20Weekly/src/pages/Turnover/VolumeDecompositionContainer.jsx)
- 城市与门店周度营业额：城市趋势与门店列表：[RevenueDecompositionContainer.jsx](file:///Users/kailiu/AI-Project/ChangLe%20Operations%20Weekly/src/pages/Turnover/RevenueDecompositionContainer.jsx)

### 真实数据源（示例）
- 周度营业额（城市/门店）：`turnover_weekly_city_yoy.sql`、`turnover_weekly_store_yoy.sql`
- 客次量：`user_visit_count_annual.sql`、`user_visit_count_daily_avg_visit_monthly.sql`、`user_visit_count_cum_monthly.sql`
- 回头率：`repurchase_rate_annual_yoy.sql`、`repurchase_rate_weekly_yoy.sql`、`repurchase_reate_city_weekly_yoy.sql`、`repurchase_reate_store_weekly_yoy.sql`
- 活跃会员数：`active_user_monthly_yoy.sql`、`active_user_city_monthly_yoy.sql`、`active_user_store_monthly_yoy.sql`
- 主动评价率：`active_review_rates_monthly_yoy.sql`、`active_review_rates_city_monthly_yoy.sql`、`active_review_rates_store_monthly_yoy.sql`
- 推拿师天均服务时长：`staff_avg_daily_service_duration_monthly_yoy.sql`、`staff_avg_daily_service_duration_city_monthly_yoy.sql`、`staff_avg_daily_service_duration_store_monthly_yoy.sql`
- 推拿师时长不达标占比：`staff_service_duration_below_standard_monthly.sql`、`staff_service_duration_below_standard_city_monthly.sql`
- 新员工回头率达标率：`staff_return_compliance_annual.sql`、`staff_return_compliance_monthly.sql`、`staff_return_compliance_city_annual.sql`、`staff_return_compliance_city_monthly.sql`、`staff_return_compliance_store_annual.sql`
- 床位人员配置比：`bed_to_staff_ratio_annual.sql`、`bed_to_staff_ratio_weekly.sql`、`bed_to_staff_ratio_city_annual.sql`、`bed_to_staff_ratio_city_weekly.sql`、`bed_to_staff_ratio_store_annual.sql`

## 无兜底数据策略

已移除所有兜底/示例 SQL 及引用。当真实 SQL 无结果时，前端展示空白。

移除列表（示例）：
- `process_city_data.sql`
- `process_metric_trend.sql`
- `volume_city_breakdown.sql`
- `volume_influence_city.sql`
- `volume_influence_trend.sql`

## 后端接口

主要接口位于：[server/index.js](file:///Users/kailiu/AI-Project/ChangLe%20Operations%20Weekly/server/index.js)

- `POST /api/fetch-data` 执行 SQL（queryKey 见注册表）
- `GET /api/cost-structure` 成本结构分析（含回退逻辑）
- `POST /api/generate-reminder` 生成提醒/公告
- `POST /api/dify/run-workflow` Dify 工作流代理
- `GET /api/analysis/variables` 获取分析变量配置
- `GET /api/analysis/workflows` 获取工作流配置
- `POST /api/analysis/execute-smart-analysis` 执行智能分析
- `GET /health` 健康检查

## SQL 注册与调用

后端注册表：[queryRegistry.js](file:///Users/kailiu/AI-Project/ChangLe%20Operations%20Weekly/server/queryRegistry.js)，每个 `queryKey` 对应一份 SQL 与中文描述。前端通过 `useFetchData(queryKey)` 或直接调用 `/api/fetch-data` 获取数据。

示例请求体：

```json
{ "queryKey": "getCityWeeklyTrend", "params": ["成都市"] }
```

## 快速开始

```bash
# 安装依赖（根目录）
npm install

# 安装后端依赖
cd server && npm install && cd ..

# 启动后端（终端1）
npm run server

# 启动前端（终端2）
npm run dev
```

打开浏览器访问：`http://localhost:8000`

## 环境变量与安全

后端环境变量位于 `server/.env`。该文件非常重要，包含数据库与第三方服务密钥，不应随意修改。如需调整请先获得授权，并避免在版本库中泄露。

## 开发指南

### 添加新的 SQL 报表
1. 在 `server/sqls` 新建 `.sql`
2. 在 `server/queryRegistry.js` 注册并编写中文描述
3. 前端通过 `useFetchData('queryKey')` 或 `/api/fetch-data` 使用

### 常见问题
- 端口占用：`EADDRINUSE :3001`，请结束占用进程或修改端口
- Invalid query key：说明未在注册表注册或已删除
- Doris 表缺失：后端将返回错误；本项目不再返回兜底数据
- 构建警告：bundle 较大可考虑代码分割

