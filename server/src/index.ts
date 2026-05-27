import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './database';
import authRoutes from './routes/auth';
import avatarRoutes from './routes/avatars';
import gameRoutes from './routes/game';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 请求日志
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/avatars', avatarRoutes);
app.use('/api/game', gameRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 场景统计
app.get('/api/scenarios/stats', (req, res) => {
  const { scenarios } = require('./scenarios');
  const categoryCount: Record<string, number> = {};
  const difficultyCount: Record<number, number> = {};

  for (const scenario of scenarios) {
    categoryCount[scenario.category] = (categoryCount[scenario.category] || 0) + 1;
    difficultyCount[scenario.difficulty] = (difficultyCount[scenario.difficulty] || 0) + 1;
  }

  res.json({
    total: scenarios.length,
    byCategory: categoryCount,
    byDifficulty: difficultyCount
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 初始化数据库并启动服务器
initializeDatabase();

app.listen(PORT, () => {
  console.log(`🚀 金融猎手后端服务已启动`);
  console.log(`📡 API地址: http://localhost:${PORT}`);
  console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
