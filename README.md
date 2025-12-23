# 常乐经营管理周报系统 (ChangLe Operations Weekly)

![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![Webpack](https://img.shields.io/badge/Webpack-5.x-8DD6F9?logo=webpack&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?logo=tailwindcss&logoColor=white)
![Doris](https://img.shields.io/badge/Doris-DB-000000?logo=apache&logoColor=white)

## 📖 项目概述

**常乐经营管理周报系统** 是一个集成了 **商业智能 (BI)** 与 **人工智能 (AI)** 的现代化数据看板。它不仅展示总部与城市维度的核心营运指标（如营业额、成本、利润），还通过 BFF 架构集成 DeepSeek AI，为枯燥的数据提供即时的自然语言深度洞察。

### ✨ 核心特性

- **BFF 架构设计**：通过 Node.js 中间层隔离前端与数据库/AI 服务，确保密钥安全，统一数据聚合。
- **AI 智能分析**：内置 AI 服务，自动结合当前业务数据与预设 Prompt，生成专业的经营分析报告。
- **高性能体验**：采用数据缓存、异步 AI 请求、超时熔断等策略，拒绝页面卡顿。
- **灵活扩展**：基于 `Registry` 模式管理 SQL 与 Prompt，新增报表只需配置即可，无需大量改动代码。

---

## 🏗️ 系统架构

本项目采用 **Client-Server-Database** 的三层架构，其中 Server 端作为 BFF 层。

```mermaid
flowchart LR
    subgraph Client [前端 (React SPA)]
        UI[页面组件] --> |HTTP Fetch| API[API 请求]
        API --> |LocalStorage| Cache[本地缓存]
    end

    subgraph Server [BFF 层 (Node.js/Express)]
        Router[路由分发] --> |Registry| Registry[查询/Prompt 注册表]
        Registry --> |Load| SQLs[SQL 文件]
        Registry --> |Load| Prompts[Prompt 模板]
        Router --> |Query| DB_Pool[Doris 连接池]
        Router --> |Analyze| AI_Service[DeepSeek AI 服务]
    end
    
    subgraph Infrastructure [基础设施]
        Doris[(Doris 数仓)]
        DeepSeek[DeepSeek API]
    end

    API --> Router
    DB_Pool <--> Doris
    AI_Service <--> DeepSeek
```

### 📂 核心目录结构

```
ChangLe-Operations-Weekly/
├── public/                 # 静态资源入口
├── src/                    # 前端源码 (React)
│   ├── api/                # 前端 API 封装
│   ├── components/         # 通用组件 (图表、AI 分析框等)
│   ├── pages/              # 业务页面 (Turnover, Cost, Store...)
│   │   └── Turnover/       # 示例：营业额模块
│   └── utils/              # 工具函数
├── server/                 # 后端源码 (BFF)
│   ├── config/             # 配置文件
│   ├── services/           # 业务服务 (AI 服务等)
│   ├── sqls/               # SQL 查询文件仓库
│   ├── prompts/            # AI 提示词模板仓库
│   ├── index.js            # 服务入口与数据库连接
│   └── queryRegistry.js    # 核心：SQL 与 Prompt 映射注册表
├── package.json            # 项目依赖配置
└── webpack.config.js       # 构建与代理配置
```

---

## 🛠️ 技术深度解析

### 1. BFF 层与查询注册机制 (Query Registry)
为了避免在代码中硬编码 SQL 和 Prompt，我们设计了 `server/queryRegistry.js`。
*   **原理**：将每个业务查询抽象为一个 `key`（如 `getTurnoverOverview`），并绑定对应的 `.sql` 文件路径和 `.txt` 提示词模板路径。
*   **优势**：前端只需请求 `key`，无需关心底层数据实现；后端通过 `key` 自动加载 SQL 执行查询，并可选地加载 Prompt 调用 AI。

### 2. 异步 AI 分析与熔断策略
AI 分析通常耗时较长（5-30秒），为了不阻塞核心数据的展示，我们采取了以下策略：
*   **并行请求**：前端 `useEffect` 中同时发起两个请求：一个仅获取数据（毫秒级响应），一个获取 AI 分析（较慢）。
*   **独立状态**：数据和 AI 分析拥有独立的状态管理，数据加载完成立即渲染图表，AI 分析在后台生成，完成后动态插入 UI。
*   **双重超时熔断**：
    *   **后端**：设置 OpenAI SDK 调用超时（30s），防止服务挂起。
    *   **前端**：设置 `Promise.race` 超时（45s），确保 UI 即使在网络极端差的情况下也能给出反馈，而不是无限 Loading。

### 3. Markdown 渲染与富文本展示
AI 生成的内容包含丰富的格式（标题、列表、加粗）。前端引入 `react-markdown` 并配合 Tailwind Typography 样式，将 AI 的纯文本响应实时渲染为排版精美的 HTML，提升阅读体验。

---

## 🚀 快速开始

### 前置要求
*   **Node.js**: >= 16.0.0 (推荐 18.x)
*   **npm**: >= 8.0.0
*   **Doris 数据库**: 可用的连接凭证
*   **DeepSeek API**: 有效的 API Key

### 1. 安装依赖

```bash
# 1. 安装根目录（前端）依赖
npm install

# 2. 安装服务端依赖
cd server
npm install
cd ..
```

### 2. 环境配置 (.env)

在 `server/` 目录下创建 `.env` 文件（参考 `.env.example`）：

```env
# Database Configuration (Doris)
DB_HOST=your_doris_host
DB_PORT=9030
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database

# AI Service Configuration (DeepSeek)
AI_API_KEY=your_sk_key
AI_ENDPOINT=https://api.deepseek.com
```

### 3. 启动开发服务

建议开启两个终端分别运行：

**Terminal 1 (后端 BFF 服务):**
```bash
cd server
npm run dev
# 服务将运行在 http://localhost:3001
```

**Terminal 2 (前端 Webpack 服务):**
```bash
npm run dev
# 页面将自动打开 http://localhost:8000
```

---

## ✅ 任务清单 (Todo)

- [x] **架构重构**：完成 BFF 架构搭建，分离前后端。
- [x] **AI 集成**：接入 DeepSeek 模型，实现自动化经营分析。
- [x] **体验优化**：解决首屏加载闪烁问题，优化数值显示精度。
- [x] **错误处理**：完善前后端网络异常与 AI 超时的错误捕获。
- [ ] **更多维度**：接入成本、利润、现金流等模块的真实数据库查询。
- [ ] **用户鉴权**：添加登录功能与角色权限控制。

---

## 🤝 贡献指南

欢迎提交 Issue 或 Pull Request！
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

*Powered by React, Node.js & DeepSeek AI*
