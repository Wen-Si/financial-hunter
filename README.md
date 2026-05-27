# 金融猎手 (Financial Hunter)

🎮 一款AI驱动的金融职场生存游戏

## 游戏简介

**金融猎手**是一款创新的AI驱动游戏，玩家通过自然语言创建独特的数字人角色，AI将控制这些角色在复杂的金融职场世界中生存、成长与发展。

### 核心玩法

- 🎭 **角色创建**: 用自然语言描述你的数字人，包括品格、性格、专业技能、职业发展方向
- 🤖 **AI驱动**: 基于GLM-4.5-Flash大模型，AI自主控制角色做出决策
- 📈 **100+场景**: 涵盖投资银行、基金管理、商业银行、风险管理、职场生存等领域
- 🏆 **生存挑战**: 面对各种金融职场挑战，看看你能走多远

## 技术栈

### 前端
- React 18 + TypeScript
- Vite (构建工具)
- Tailwind CSS (样式)
- React Router (路由)
- Axios (HTTP客户端)

### 后端
- Node.js + Express
- TypeScript
- SQLite (数据库)
- JWT (认证)
- bcrypt (密码加密)

### AI
- 智谱AI GLM-4.5-Flash

## 快速开始

### 1. 克隆仓库
```bash
git clone https://github.com/YOUR_USERNAME/financial-hunter.git
cd financial-hunter
```

### 2. 安装依赖

**后端**
```bash
cd server
npm install
```

**前端**
```bash
cd client
npm install
```

### 3. 配置环境变量

在 `server/` 目录下创建 `.env` 文件：
```env
PORT=3000
JWT_SECRET=your_jwt_secret_key_here
GLM_API_KEY=your_glm_api_key_here
```

### 4. 启动后端
```bash
cd server
npm run dev
```

### 5. 启动前端
```bash
cd client
npm run dev
```

### 6. 访问游戏
打开浏览器访问 `http://localhost:5173`

## 目录结构

```
financial-hunter/
├── client/                 # React前端
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API服务
│   │   ├── types/          # TypeScript类型
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── server/                 # Node.js后端
│   ├── src/
│   │   ├── routes/         # API路由
│   │   ├── models/          # 数据模型
│   │   ├── services/        # 业务逻辑
│   │   ├── middleware/      # 中间件
│   │   ├── database/        # 数据库
│   │   ├── scenarios/       # 游戏场景
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── SPEC.md                  # 项目规范
└── README.md
```

## API文档

### 认证接口
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/auth/me | 获取当前用户 |

### 角色接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/avatars | 获取用户的所有角色 |
| POST | /api/avatars | 创建新角色 |
| GET | /api/avatars/:id | 获取角色详情 |
| DELETE | /api/avatars/:id | 删除角色 |

### 游戏接口
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/game/start/:avatarId | 开始游戏 |
| GET | /api/game/:avatarId/current | 获取当前状态 |
| POST | /api/game/:avatarId/action | 触发AI行动 |
| GET | /api/game/:avatarId/history | 获取游戏历史 |

## 游戏场景分类

### 🏦 投资银行类 (20场景)
IPO承销、并购交易、尽职调查、客户关系、高压项目等

### 📊 基金管理类 (20场景)
基金净值、大额赎回、投资暴雷、老鼠仓、渠道销售等

### 🏛 商业银行类 (20场景)
贷款审批、不良资产、客户投诉、金融科技、监管检查等

### ⚠️ 风险管理类 (20场景)
市场风险、信用风险、操作风险、流动性危机等

### 💼 职场生存类 (20场景)
办公室政治、晋升答辩、薪资谈判、裁员危机、职业转型等

## 数字人属性系统

| 属性 | 说明 | 范围 |
|------|------|------|
| 品格 | 道德品质和职业操守 | 0-100 |
| 情商 | 人际交往和情绪管理 | 0-100 |
| 专业知识 | 金融理论和实务技能 | 0-100 |
| 人脉 | 关系网络和社会资源 | 0-100 |
| 抗压能力 | 应对压力和挑战的能力 | 0-100 |
| 运气 | 随机事件的影响因子 | 0-100 |

## 状态系统

| 状态 | 说明 | 范围 |
|------|------|------|
| 金钱 | 经济状况 | 0-100 |
| 心情 | 情绪状态 | 0-100 |
| 健康 | 身心状态 | 0-100 |
| 声望 | 职业声誉 | 0-100 |

## 部署

### 前端部署到GitHub Pages

1. 在GitHub创建仓库
2. 修改 `client/vite.config.ts` 中的base路径
3. 运行 `npm run build`
4. 部署 `dist` 目录到GitHub Pages

### 后端部署

推荐部署到：
- Railway
- Render
- Heroku
- Vercel

## License

MIT License

## 联系方式

如有问题，请提交Issue或Pull Request。

---

**金融猎手** - 在金融职场的腥风血雨中，看看你能成为怎样的猎人！
