# 常乐经营管理周报系统 (ChangLe Operations Weekly)

![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![Webpack](https://img.shields.io/badge/Webpack-5.x-8DD6F9?logo=webpack&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?logo=tailwindcss&logoColor=white)
![Doris](https://img.shields.io/badge/Doris-DB-000000?logo=apache&logoColor=white)
![Dify](https://img.shields.io/badge/Dify-Workflow-blue?logo=openai&logoColor=white)

## 📖 项目概述

**常乐经营管理周报系统** 是一个集成了 **商业智能 (BI)** 与 **人工智能 (AI)** 的现代化数据看板。它不仅展示总部与城市维度的核心营运指标（如营业额、成本、利润、门店运营），还通过 **Dify Workflow API** 集成智能分析能力，为业务数据提供即时的自然语言深度洞察。

### ✨ 核心特性

- **BFF 架构设计**：通过 Node.js 中间层隔离前端与数据库/AI 服务，确保密钥安全，统一数据聚合。
- **Dify 智能工作流**：无缝集成 Dify Workflow，将复杂的业务逻辑和 Prompt 托管在 Dify 平台，前端仅需调用接口即可获取高质量分析报告。
- **AI 全局控制**：提供全局 AI 功能开关，可一键开启或关闭系统内所有智能分析组件，灵活应对演示或生产环境需求。
- **统一 UI 规范**：封装通用的进度条、图表与数据容器组件，确保不同业务板块视觉风格高度一致。
- **高性能体验**：采用数据缓存、异步 AI 请求、错误熔断等策略，拒绝页面卡顿。

---

## 🏗️ 系统架构

本项目采用 **Client-Server-Database** 的三层架构，其中 Server 端作为 BFF (Backend for Frontend) 层，同时充当 Dify API 的安全代理。

```mermaid
flowchart LR
    subgraph Client [前端 (React SPA)]
        UI[页面组件] --> |Fetch Data| API_Data[数据接口]
        UI --> |Fetch Analysis| API_AI[AI 代理接口]
        API_AI --> |Check Config| AI_Switch{AI 开关}
    end

    subgraph Server [BFF 层 (Node.js/Express)]
        Router[路由分发] --> |Registry| Registry[SQL 注册表]
        Router --> |Proxy| Dify_Proxy[Dify 安全代理]
        Registry --> |Load| SQLs[SQL 文件]
        Router --> |Query| DB_Pool[Doris 连接池]
    end
    
    subgraph Infrastructure [基础设施]
        Doris[(Doris 数仓)]
        Dify[Dify Workflow API]
    end

    API_Data --> Router
    AI_Switch -- Enabled --> Dify_Proxy
    AI_Switch -- Disabled --> Stop[停止请求]
    DB_Pool <--> Doris
    Dify_Proxy <--> Dify
```

### 📂 核心目录结构

```
ChangLe-Operations-Weekly/
├── public/                 # 静态资源入口
├── src/                    # 前端源码 (React)
│   ├── components/         # 通用组件
│   │   ├── Common/         # 核心UI组件 (UnifiedProgressBar, AiAnalysisBox等)
│   ├── config/             # 前端配置
│   │   ├── aiConfig.js     # AI 功能全局开关
│   │   └── businessTargets.js # 业务目标配置
│   ├── pages/              # 业务页面 (Turnover, Cost, Store...)
│   │   └── Turnover/       # 营业额模块
│   ├── services/           # 业务服务
│   │   └── difyService.js  # Dify API 前端调用封装
│   └── utils/              # 工具函数
├── server/                 # 后端源码 (BFF)
│   ├── sqls/               # SQL 查询文件仓库
│   ├── index.js            # 服务入口、DB连接与 Dify 代理路由
│   ├── queryRegistry.js    # SQL 映射注册表
│   └── .env                # 环境变量 (数据库凭证、Dify Keys)
├── package.json            # 项目依赖配置
└── webpack.config.js       # 构建与代理配置
```

---

## 🛠️ 技术深度解析

### 1. Dify 工作流集成 (Dify Integration)
我们将复杂的 AI 分析逻辑从代码中剥离，迁移至 **Dify** 平台。
*   **配置管理**：在 `server/.env` 中配置 `DIFY_API_KEY`、`DIFY_BASE_URL` 和 `DIFY_USER`。
*   **安全代理**：前端通过 `src/services/difyService.js` 发起请求，后端 `/api/dify/run-workflow` 负责附加鉴权信息并转发给 Dify，避免 API Key 泄露。
*   **智能解析**：前端服务自动解析 Dify 返回的复杂 JSON 结构（支持 Markdown、普通文本或嵌套 JSON），确保 UI 正确渲染。

### 2. AI 功能全局开关
为了方便演示和调试，系统引入了全局 AI 控制机制。
*   **位置**：`src/config/aiConfig.js`
*   **原理**：修改 `ENABLE_AI` 为 `false` 时，前端 `difyService` 会拦截所有 AI 请求，且相关 UI 组件（如 `AiAnalysisBox`）会自动隐藏，实现“零打扰”模式。

### 3. 统一进度条组件 (UnifiedProgressBar)
针对不同业务场景（营业额、利润、门店），封装了高度可复用的进度条组件。
*   **特性**：支持“实际进度”与“时间进度”对比，自动根据完成率显示不同颜色（完成度>=时间进度为主题色，否则为绿色预警），并统一了视觉宽度和排版。

---

## 🚀 快速开始

### 1. 环境准备
*   **Node.js**: >= 16.0.0 (推荐 18.x)
*   **MySQL/Doris**: 确保数据库服务可用

### 2. 安装依赖

```bash
# 安装根目录依赖（前端 + 构建工具）
npm install

# 安装服务端依赖
cd server
npm install
cd ..
```

### 3. 配置环境变量

复制 server 端的示例配置文件并填入真实信息：

```bash
cp server/.env.example server/.env
```

编辑 `server/.env`：

```env
# Database
DB_HOST=your_doris_host
DB_PORT=9030
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=data_warehouse

# Dify Workflow
DIFY_API_KEY=your_dify_api_key
DIFY_BASE_URL=http://your_dify_host/v1/workflows/run
DIFY_USER=changle-report
```

### 4. 启动开发服务

```bash
# 终端 1：启动后端服务 (BFF)
node server/index.js

# 终端 2：启动前端开发服务器 (Webpack Dev Server)
npm run dev
```

访问浏览器：`http://localhost:8000`

---

## 📝 开发指南

### 添加新的 SQL 报表
1. 在 `server/sqls/` 下创建新的 `.sql` 文件。
2. 在 `server/queryRegistry.js` 中注册该 SQL，分配一个 `queryKey`。
3. 前端使用 `fetch('/api/fetch-data', { body: { queryKey: '...' } })` 获取数据。

### 添加新的 AI 分析
1. 在 Dify 平台配置好 Workflow。
2. 在前端组件中引入 `difyService`。
3. 调用 `await difyService.runWorkflow(workflowKey, inputs)` 获取分析结果。

### 控制 AI 开关
修改 `src/config/aiConfig.js`：
```javascript
export const AI_CONFIG = {
  ENABLE_AI: true, // true: 开启; false: 关闭
};
```
