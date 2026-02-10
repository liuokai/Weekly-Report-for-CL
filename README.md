# 常乐经营管理周报系统 (ChangLe Operations Weekly)

> **聚焦总部与城市维度核心营运指标的智能化周报看板系统**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.x-61DAFB.svg)
![Node](https://img.shields.io/badge/Node.js-16.x+-339933.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC.svg)

## 📖 项目简介 (Introduction)

**常乐经营管理周报系统** 是一款专为连锁企业设计的现代化经营数据分析平台。它采用 Client-BFF (Backend for Frontend) 架构，旨在解决传统报表系统数据维度单一、交互体验差、缺乏智能分析等痛点。

系统通过集成 AI 工作流（Dify），不仅提供营业额、成本、现金流等核心指标的可视化监控，还能自动生成业务洞察摘要，帮助管理层快速掌握企业经营状况，实现从“看数据”到“懂数据”的跨越。

## ✨ 核心特性 (Features)

*   **📈 全维度经营分析**
    *   **营业额洞察**：周度趋势对比、价格与客流驱动因素分解、城市/门店业绩排行。
    *   **成本与利润管控**：利润率实时监控、成本结构层层拆解、总部费用预算执行分析。
    *   **现金流健康度**：资金测算与预测、新店投资回报分析、持续亏损门店预警。

*   **🤖 AI 智能辅助**
    *   集成 Dify Workflow，基于实时数据自动生成新店开发进度与经营情况的智能分析摘要。

*   **🏢 多层级数据穿透**
    *   支持从“总部全貌”到“城市分布”再到“门店明细”的三级数据钻取，满足不同层级的管理需求。

*   **🛡️ 稳健的系统架构**
    *   **BFF 中台架构**：统一管理 SQL 注册表与查询执行，隔离前端与敏感数据源。
    *   **无兜底策略**：坚持真实数据呈现，移除误导性的 Mock 数据，确保决策依据的准确性。

## 🛠 技术栈 (Tech Stack)

| 领域 | 技术/工具 | 说明 |
| :--- | :--- | :--- |
| **Frontend** | **React 18** | 核心 UI 框架 |
| | **TailwindCSS** | 原子化 CSS 样式库 |
| | **Recharts** | 数据可视化图表库 |
| | **Webpack 5** | 模块打包与构建工具 |
| **Backend (BFF)** | **Node.js** | 运行时环境 |
| | **Express** | Web 服务框架 |
| **Database** | **MySQL / Doris** | 业务数据存储与查询 |
| **AI Integration** | **Dify** | LLM 工作流编排平台 |

## 📂 项目结构 (Project Structure)

采用标准的 Client-BFF 分层结构，前后端代码分离但同库管理：

```bash
ChangLe-Operations-Weekly/
├── public/                 # 静态资源入口
├── src/                    # 前端源码 (React Application)
│   ├── components/         # 通用 UI 组件 (图表、表格、容器等)
│   ├── pages/              # 业务页面模块
│   │   ├── Turnover/       # 营业额模块
│   │   ├── CostAndProfit/  # 成本与利润模块
│   │   ├── CashFlow/       # 现金流与新店模块
│   │   └── WeeklyReport/   # 入口与布局容器
│   ├── config/             # 业务配置 (目标值、常量)
│   ├── services/           # 前端 API 服务封装
│   └── utils/              # 工具函数
├── server/                 # 后端源码 (BFF Service)
│   ├── sqls/               # SQL 查询文件仓库 (核心业务逻辑)
│   ├── config/             # 后端配置 (AI Prompt、缓存策略)
│   ├── services/           # 后端业务逻辑 (AI 生成器等)
│   ├── queryRegistry.js    # SQL 注册表 (Key-Value 映射)
│   └── index.js            # 服务入口与路由定义
├── package.json            # 项目根依赖与脚本
└── webpack.config.js       # 构建配置
```

## ✅ 环境要求 (Requirements)

*   **Node.js**: v16.0.0 或更高版本
*   **npm**: v8.0.0 或更高版本
*   **Database**: 需具备 MySQL 协议兼容的数据库连接权限

## 🚀 安装与运行 (Installation & Usage)

### 1. 克隆项目与安装依赖

```bash
# 安装根目录依赖 (前端依赖)
npm install

# 安装后端依赖
cd server && npm install
cd ..
```

### 2. 配置环境变量

在 `server/` 目录下创建 `.env` 文件（可参考 `.env.example`），配置数据库连接与 AI 服务密钥：

```env
# Database Configuration
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=your_db_name

# AI Service (Dify)
DIFY_API_KEY=your_dify_api_key
```

### 3. 启动服务

建议开启两个终端窗口分别启动前后端服务：

**终端 1：启动后端服务 (BFF)**
```bash
npm run server
# 服务将运行在 http://localhost:3001
```

**终端 2：启动前端应用**
```bash
npm run dev
# 页面将自动打开 http://localhost:8000 (已配置代理指向后端)
```

## � 页面展示框架 (Presentation Framework)

系统界面设计遵循“总览-分支-明细”的逻辑，顶部为统一导航栏，主体内容通过 Tab 切换三大核心业务模块。

### 1. 营业额模块 (Turnover)
> **关注收入趋势、价格与客流分解**

| 组件名称 | 功能描述 |
| :--- | :--- |
| **WeeklyTurnoverChart** | **周度趋势**：展示近12周营业额变化，对比去年同期数据。 |
| **RevenueDecomposition** | **营收分解**：包含城市视图与门店视图，支持点击城市钻取查看具体门店业绩与同比增速。 |
| **PriceDecomposition** | **价格驱动**：分析年度平均客单价与各城市客单价分布，识别价格对营收的影响。 |
| **VolumeDecomposition** | **客流驱动**：多维度拆解客次量、会员活跃度与流失率，定位流量增长点。 |

### 2. 成本与利润模块 (Cost & Profit)
> **关注利润率、成本结构与预算执行**

| 组件名称 | 功能描述 |
| :--- | :--- |
| **AnnualCostAnalysis** | **年度概览**：展示累计利润、利润率及目标达成进度条。 |
| **ProfitTrendChart** | **趋势分析**：支持“利润金额”与“利润率”双视角切换，直观呈现盈利能力波动。 |
| **HeadquartersCostBudget** | **总部预算**：监控人力、行政、IT 等职能部门的费用预算执行情况。 |
| **CostStructureContainer** | **成本结构**：详细的门店损益表（P&L），涵盖收入、管理费、人工及变动成本。 |

### 3. 现金流与新店模块 (Cash Flow & New Store)
> **关注资金预测、扩张进度与风险预警**

| 组件名称 | 功能描述 |
| :--- | :--- |
| **NewStoreProcess** | **拓店总结**：统计新店开业与老店重装进度，**集成 AI 分析**自动生成文字摘要。 |
| **CapitalForecast** | **资金测算**：基于当前经营状况预测 2026 年资金结余与资本性支出。 |
| **NewStoreOperation** | **爬坡监控**：跟踪新店开业后的营收达标率与盈亏平衡点。 |
| **ClosingWarning** | **闭店预警**：基于多重指标（持续亏损、现金流为负）筛选高风险门店列表。 |

## 🤝 贡献指南 (Contributing)

1.  Fork 本仓库
2.  创建特性分支 (`git checkout -b feature/AmazingFeature`)
3.  提交更改 (`git commit -m 'Add some AmazingFeature'`)
4.  推送到分支 (`git push origin feature/AmazingFeature`)
5.  提交 Pull Request

## 📄 许可证 (License)

本项目采用 [MIT License](LICENSE) 许可证。
