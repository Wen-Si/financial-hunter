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

### 方式一：Docker 部署 (推荐)

#### 前置要求
- Docker 20.10+
- Docker Compose 2.0+

#### 部署步骤

1. 克隆仓库
```bash
git clone https://github.com/YOUR_USERNAME/financial-hunter.git
cd financial-hunter
```

2. 配置环境变量

编辑 `docker-compose.yml` 文件，修改以下配置：
```yaml
services:
  server:
    environment:
      - JWT_SECRET=your_jwt_secret_key_here
      - GLM_API_KEY=your_glm_api_key_here  # 替换为你的智谱AI API Key
```

3. 启动服务
```bash
docker-compose up -d
```

4. 访问游戏

- 前端: http://localhost:8080
- 后端 API: http://localhost:3000

5. 查看日志
```bash
docker-compose logs -f
```

6. 停止服务
```bash
docker-compose down
```

7. 重新构建（当代码有更新时）
```bash
docker-compose up -d --build
```

---

### 方式二：手动部署

#### 前置要求
- Node.js 18+
- npm 9+

#### 部署步骤

1. 克隆仓库
```bash
git clone https://github.com/YOUR_USERNAME/financial-hunter.git
cd financial-hunter
```

2. 安装依赖

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

3. 配置环境变量

在 `server/` 目录下创建 `.env` 文件：
```env
PORT=3000
JWT_SECRET=your_jwt_secret_key_here
GLM_API_KEY=your_glm_api_key_here
```

4. 启动后端
```bash
cd server
npm run dev
```

5. 启动前端（在另一个终端）
```bash
cd client
npm run dev
```

6. 访问游戏

打开浏览器访问 http://localhost:5173

---

## 如何获取 API Key

### 智谱AI GLM API Key

1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册/登录账号
3. 进入控制台 -> API Keys -> 创建新密钥
4. 复制生成的 API Key
5. 将 API Key 填入环境变量 `GLM_API_KEY`

**注意**: 请妥善保管你的 API Key，不要泄露给他人或提交到代码仓库。

---

## 常见问题解答 (FAQ)

### Q1: Docker 部署时端口被占用怎么办？

**A**: 修改 `docker-compose.yml` 中的端口映射：

```yaml
services:
  server:
    ports:
      - "3001:3000"  # 使用 3001 端口
  client:
    ports:
      - "8081:80"    # 使用 8081 端口
```

### Q2: 如何查看容器日志？

**A**: 使用以下命令查看日志：

```bash
# 查看所有服务日志
docker-compose logs -f

# 只看后端日志
docker-compose logs -f server

# 只看前端日志
docker-compose logs -f client
```

### Q3: 如何重置数据库？

**A**: 停止服务后，删除数据库文件并重新启动：

```bash
docker-compose down
rm -rf database/
docker-compose up -d
```

### Q4: 前端开发模式下 API 请求跨域错误？

**A**: 这是正常的。开发模式下 (npm run dev) 使用的是绝对路径 `http://localhost:3000/api`，生产环境使用 Nginx 反向代理 `/api`。开发完成后执行 `npm run build` 即可。

### Q5: GLM API 调用失败怎么办？

**A**: 检查以下几点：
1. API Key 是否正确配置
2. API Key 是否有效（是否欠费/过期）
3. 网络是否能访问智谱AI服务器
4. 查看后端日志确认具体错误信息

### Q6: 如何修改 JWT Secret？

**A**: 修改 `docker-compose.yml` 或 `.env` 文件中的 `JWT_SECRET` 值。建议使用足够长的随机字符串：

```bash
# 生成随机密钥
openssl rand -base64 32
```

### Q7: 如何自定义游戏场景？

**A**: 编辑 `server/src/scenarios/index.ts` 文件，可以添加新的游戏场景、修改场景权重等。

### Q8: 前端构建失败？

**A**: 尝试清理缓存后重新构建：

```bash
cd client
rm -rf node_modules dist
npm install
npm run build
```

### Q9: 容器启动后前端无法访问？

**A**: 检查以下几点：
1. Nginx 容器是否正常运行: `docker-compose ps`
2. 端口是否正确映射
3. 查看 Nginx 日志: `docker-compose logs client`
4. 确认浏览器访问的是正确的端口

### Q10: 如何备份数据？

**A**: 数据库文件位于 `database/` 目录，定期备份该目录：

```bash
# 备份
cp -r database/ database-backup-$(date +%Y%m%d)/

# 恢复
cp -r database-backup-YYYYMMDD/* database/
```

---

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
│   ├── nginx.conf          # Nginx配置文件
│   ├── Dockerfile          # 前端Docker镜像
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
│   ├── Dockerfile          # 后端Docker镜像
│   └── .env
├── database/               # 数据库文件目录（自动创建）
├── docker-compose.yml       # Docker Compose配置
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

### Docker 部署（生产环境推荐）

使用 Docker Compose 一键部署：

```bash
docker-compose up -d
```

详细说明请参见上方「方式一：Docker 部署」部分。

### 前端部署

#### GitHub Pages

1. 在GitHub创建仓库
2. 运行 `npm run build`
3. 部署 `dist` 目录到GitHub Pages

#### VPS/Nginx

使用 Docker 部署或直接构建：

```bash
cd client
npm run build
# 将 dist 目录部署到 Nginx
```

### 后端部署

推荐部署方式：
- **Railway**: 支持 Docker，部署简单
- **Render**: 免费额度，支持 Node.js
- **Heroku**: 老牌 PaaS 平台
- **Docker + VPS**: 完全自托管

---

## License

MIT License

## 联系方式

如有问题，请提交Issue或Pull Request。

---

**金融猎手** - 在金融职场的腥风血雨中，看看你能成为怎样的猎人！
