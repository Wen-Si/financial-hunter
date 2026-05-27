# 金融猎手 - 游戏设计规范

## 1. 项目概述

### 1.1 游戏简介
**金融猎手**是一款AI驱动的金融职场生存游戏。玩家通过自然语言创建独特的数字人角色，AI将控制这些角色在复杂的金融职场世界中生存、成长与发展。

### 1.2 核心玩法
- **角色创建**: 玩家用自然语言描述数字人的品格、性格、专业技能、职业发展方向
- **AI驱动**: AI大模型（GLM-4.5-Flash）根据角色设定，自主做出决策和行动
- **生存挑战**: 数字人在100+真实金融场景中面临各种挑战
- **成长系统**: 通过经历事件，数字人的属性会动态变化

### 1.3 技术架构
- **前端**: React + TypeScript + Vite
- **后端**: Node.js + Express + TypeScript
- **数据库**: SQLite (轻量级，支持多实例)
- **AI模型**: 智谱GLM-4.5-Flash
- **部署**: GitHub Pages (前端) + 可自部署后端

---

## 2. 系统架构

### 2.1 前后端分离架构
```
┌─────────────────┐     ┌─────────────────┐
│   前端 (React)   │────▶│   后端 (Node.js) │
│  GitHub Pages   │◀────│   REST API      │
└─────────────────┘     └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │   SQLite DB     │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │  GLM-4.5-Flash  │
                        │     AI API      │
                        └─────────────────┘
```

### 2.2 核心模块
1. **用户系统**: 注册、登录、Token认证
2. **角色系统**: 数字人创建、属性管理、状态追踪
3. **场景系统**: 100+金融场景库，场景选择与执行
4. **AI引擎**: GLM-4.5-Flash集成，决策生成
5. **游戏状态**: 存档管理，历史记录

---

## 3. 数据模型

### 3.1 用户 (User)
```typescript
{
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  lastLoginAt: Date;
}
```

### 3.2 数字人 (DigitalAvatar)
```typescript
{
  id: string;
  userId: string;
  name: string;
  // 角色设定（玩家自然语言描述）
  characterDescription: string;
  // AI解析后的属性
  attributes: {
    品格: number;        // 0-100
    情商: number;        // 0-100
    专业知识: number;    // 0-100
    人脉: number;        // 0-100
    抗压能力: number;    // 0-100
    运气: number;        // 0-100
  };
  career: {
    当前职位: string;
    目标方向: string;
    工作年限: number;
    所属机构: string;
  };
  status: {
    金钱: number;
    心情: number;
    健康: number;
    声望: number;
  };
  // 游戏进度
  currentScenario: string;
  gameLog: GameEvent[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.3 场景 (Scenario)
```typescript
{
  id: string;
  category: string;      // 投行/基金/银行/保险/监管等
  difficulty: number;      // 1-5
  title: string;
  description: string;
  triggers: string[];     // 触发条件
  choices: Choice[];
  outcomes: Outcome[];
}
```

---

## 4. 金融场景库（100+场景）

### 4.1 场景分类

#### 投资银行类 (20场景)
1. IPO承销危机
2. 并购交易博弈
3. 尽职调查失误
4. 客户关系维护
5. 团队内部竞争
6. 高压项目截止
7. 合规审查应对
8. 奖金分配争议
9. 跳槽挖角诱惑
10. 行业丑闻应对
... 等20个场景

#### 基金管理类 (20场景)
11. 基金净值暴跌
12. 大额赎回压力
13. 投资标的暴雷
14. 老鼠仓嫌疑
15. 渠道销售冲突
16. 投资者教育
17. 规模扩张困境
18. 业绩排名竞争
... 等20个场景

#### 商业银行类 (20场景)
21. 贷款审批风险
22. 不良资产处置
23. 客户投诉升级
24. 网点运营危机
25. 金融科技冲击
26. 监管检查应对
27. 内部贪污发现
... 等20个场景

#### 风险管理类 (20场景)
31. 市场风险骤增
32. 信用风险暴露
33. 操作风险事件
34. 流动性危机
35. 系统性风险预警
... 等20个场景

#### 职场生存类 (20场景)
51. 办公室政治
52. 跨部门协作
53. 空降领导应对
54. 晋升答辩准备
55. 薪资谈判
56. 裁员危机
57. 职业转型
58. 职场性骚扰
59. 心理健康维护
60. 工作生活平衡
... 等20个场景

---

## 5. AI引擎设计

### 5.1 GLM-4.5-Flash集成
- **API Endpoint**: `https://open.bigmodel.cn/api/paas/v4/chat/completions`
- **Model**: `glm-4.5-flash`
- **用途**: 
  - 解析玩家自然语言角色设定
  - 生成AI决策和行动
  - 评估场景结果
  - 推进游戏剧情

### 5.2 AI决策流程
```
玩家设定 → 自然语言解析 → 属性生成 → 场景选择
    ↓
场景触发 → AI决策生成 → 行动执行 → 结果评估
    ↓
属性更新 → 新场景触发 → 循环进行
```

### 5.3 Prompt工程
```json
{
  "system": "你是一个金融职场模拟游戏的AI引擎...",
  "user": "当前场景：{scenario}\n数字人属性：{attributes}\n历史行动：{history}\n请生成下一步行动..."
}
```

---

## 6. 前端设计

### 6.1 页面结构
1. **首页** (`/`) - 游戏介绍，开始按钮
2. **登录页** (`/login`) - 用户登录
3. **注册页** (`/register`) - 新用户注册
4. **角色创建页** (`/create`) - 自然语言设定数字人
5. **游戏大厅** (`/lobby`) - 选择角色，查看状态
6. **游戏运行页** (`/game/:id`) - 观看AI运行游戏
7. **历史记录** (`/history`) - 查看过往游戏

### 6.2 UI/UX设计
- **设计风格**: 现代金融风格，深色主题，金色点缀
- **主色调**: #1a1a2e (深蓝黑) / #ffd700 (金色)
- **辅助色**: #16213e (深蓝) / #e94560 (警示红)
- **字体**: "Noto Sans SC", "PingFang SC", sans-serif

---

## 7. 后端API

### 7.1 认证接口
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户

### 7.2 角色接口
- `GET /api/avatars` - 获取用户的所有角色
- `POST /api/avatars` - 创建新角色
- `GET /api/avatars/:id` - 获取角色详情
- `DELETE /api/avatars/:id` - 删除角色

### 7.3 游戏接口
- `POST /api/game/start/:avatarId` - 开始游戏
- `GET /api/game/:avatarId/current` - 获取当前状态
- `POST /api/game/:avatarId/action` - 触发AI行动
- `GET /api/game/:avatarId/history` - 获取游戏历史

---

## 8. 部署计划

### 8.1 GitHub仓库结构
```
financial-hunter/
├── client/           # React前端
│   ├── public/
│   ├── src/
│   └── package.json
├── server/           # Node.js后端
│   ├── src/
│   └── package.json
├── database/         # 数据库和场景数据
├── README.md
└── SPEC.md
```

### 8.2 部署流程
1. 创建GitHub仓库
2. 推送代码到仓库
3. 前端部署到GitHub Pages
4. 后端可部署到Railway/Render/Heroku

---

## 9. 安全性考虑

### 9.1 认证
- JWT Token认证
- 密码bcrypt加密
- 敏感信息环境变量管理

### 9.2 API安全
- 请求频率限制
- 输入验证
- CORS配置

---

## 10. 未来扩展

- 多人联机模式
- 更多金融场景
- 成就系统
- 排行榜
- 社交功能
