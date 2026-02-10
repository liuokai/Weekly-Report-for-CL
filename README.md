# 常乐经营管理周报系统

常乐经营管理周报系统是一个聚焦总部与城市维度核心营运指标的数据看板。前端采用 React 单页应用架构，通过 BFF (Backend for Frontend) 层统一管理数据请求与 AI 分析服务。

## 🛠 技术栈

- **前端**: React 18, TailwindCSS, Recharts
- **后端**: Node.js, Express
- **数据库**: MySQL (兼容 Doris)
- **AI 服务**: Dify Workflow集成 (通过 BFF 代理)

## 🖥 预览页面呈现框架

页面整体分为 **顶部导航栏** 与 **内容区域** 两部分：

### 1. 顶部导航栏 (Header)
- 展示项目标题 "常乐经营管理周报"。
- 显示当前数据更新时间。
- 包含 "AI 经营分析洞察" 副标题。

### 2. 内容区域 (Content)
内容区域通过 Tab 标签页进行模块划分，包含以下三个核心模块：

- **营业额模块 (Turnover)**: 关注收入趋势、价格与客流分解。
- **成本与利润模块 (Cost & Profit)**: 关注利润率、成本结构与总部预算。
- **现金流与新店模块 (Cash Flow & New Store)**: 关注资金预测、新店开发进度与经营预警。

---

## 📊 各数据容器实现逻辑

### 1. 营业额模块 (Turnover)

该模块主要展示企业的营收状况，从总体趋势到细分驱动因素（价格、客流）。

| 数据容器 (Container) | 核心功能 | 数据源 (SQL / Config) | 实现逻辑 |
| :--- | :--- | :--- | :--- |
| **WeeklyTurnoverChart** | 周度营业额趋势 | `getWeeklyTurnover` | 展示近12周的营业额变化趋势，包含当期值与去年同期值的对比折线图。 |
| **RevenueDecomposition** | 营收分解 (城市/门店) | `getCityTurnover`<br>`getStoreTurnover` | **城市视图**: 展示各城市本周营业额、同比增速。<br>**门店视图**: 点击城市可钻取查看该城市下所有门店的营业额排行与同比数据。 |
| **PriceDecomposition** | 价格驱动因素分析 | `getAnnualAvgPrice`<br>`getCityAnnualAvgPrice` | 分析客单价变化对营收的影响。展示年度平均客单价与各城市客单价的对比情况。 |
| **VolumeDecomposition** | 客流驱动因素分析 | `getUserVisitCountAnnual`<br>`getMemberChurnRate` 等 | 分析客次量、会员活跃度、回头率等指标。通过多维度数据（总客流、会员流失率）拆解营收增长的流量来源。 |

### 2. 成本与利润模块 (Cost & Profit)

该模块聚焦于企业的盈利能力与成本控制情况。

| 数据容器 (Container) | 核心功能 | 数据源 (SQL / Config) | 实现逻辑 |
| :--- | :--- | :--- | :--- |
| **AnnualCostAnalysis** | 年度利润概览 | `getProfitYearly` | 展示本年度累计利润金额、利润率及与去年同期的对比（同比增速）。顶部展示目标达成率进度条。 |
| **ProfitTrendChart** | 利润趋势分析 | `getProfitTrend` | 支持切换查看 "月度利润金额" 或 "利润率" 的近12个月趋势图，可叠加显示去年同期曲线。 |
| **HeadquartersCostBudget** | 总部费用预算监控 | `costMapping.js` (配置) | 基于静态配置的预算科目，展示总部各部门（如人力、行政、IT等）的费用预算执行情况与差异分析。 |
| **CostStructureContainer** | 门店成本结构分析 | `getProfitStoreDetailMonthly` | **表格展示**: 详细列出各门店的收入、管理费、人工成本、变动成本及最终利润。<br>**钻取分析**: 点击城市可查看该城市下门店的详细成本构成。 |

### 3. 现金流与新店模块 (Cash Flow & New Store)

该模块关注企业的资金健康度以及新店的扩张与运营表现。

| 数据容器 (Container) | 核心功能 | 数据源 (SQL / Config) | 实现逻辑 |
| :--- | :--- | :--- | :--- |
| **NewStoreProcess**<br>(Summary Metrics) | 新店拓店与重装总结 | `getCashFlowNewStoreProcess` | **核心指标**: 统计全年及截止当前月的新店开业数、老店重装数与目标值的对比。<br>**AI 分析**: 自动生成新店开发进度的智能分析摘要。 |
| **CityBudgetExecution** | 城市预算执行总结 | `getCityBudgetSummary` | 展示各城市在经营现金流、新店投资方面的预算执行情况，计算偏差率。 |
| **CapitalForecast** | 资金测算 (2026预估) | `getCashFlowBudget` | 预测未来的资金流入流出情况，包含经营性现金流预测与资本性支出（新店/重装）预测，计算预计资金结余。 |
| **NewStoreOperation** | 新店经营情况总结 | `getCashFlowNewStoreOperationStatus` | 监控新店开业后的爬坡期表现，展示新店的营收达标率与盈亏平衡点预测。 |
| **NewStoreSupply** | 新店供应总结 | `getCashFlowNewStoreSupply` | 分析新店的供应链支持情况，如物资配备到位率等（具体逻辑依赖 SQL 实现）。 |
| **ContinuousLoss** | 现金流持续亏损门店 | `getCashFlowContinuousLoss` | 筛选出连续 N 个月现金流为负的门店列表，作为重点关注对象。 |
| **ClosingWarning** | 触发闭店预警门店 | `getCashFlowClosingWarning` | 基于利润、现金流等多重指标，筛选出达到闭店预警阈值的门店清单。 |

---

## 🚀 快速开始

### 1. 环境准备
确保本地已安装 Node.js (v16+) 和 npm。

### 2. 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd server && npm install
cd ..
```

### 3. 启动项目

建议开启两个终端窗口分别启动前后端：

**终端 1 (后端服务)**:
```bash
npm run server
# 服务运行在 http://localhost:3001
```

**终端 2 (前端应用)**:
```bash
npm run dev
# 页面运行在 http://localhost:8000 (已配置代理指向后端)
```

## 📝 开发指南

- **添加新报表**: 
  1. 在 `server/sqls` 添加 SQL 文件。
  2. 在 `server/queryRegistry.js` 注册 Query Key。
  3. 在前端使用 `useFetchData('QueryKey')` 获取数据。
- **修改配置**: 业务目标配置位于 `src/config/businessTargets.js`。

## ⚠️ 注意事项

- **数据安全**: `server/.env` 文件包含数据库连接信息，请勿提交到版本控制系统。
- **无兜底策略**: 系统已移除所有 Mock 数据，若 SQL 查询无结果，页面相关区域将显示空白或加载状态，请确保数据库连接正常且有数据。
