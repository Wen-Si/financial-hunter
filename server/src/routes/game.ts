import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Avatar, GameEvent, GameHistory, Scenario } from '../types';
import { generateAIAction, evaluateOutcome, selectNextScenario } from '../services/aiService';
import { scenarios, getScenariosByCategory } from '../scenarios';
import { selectRelevantScenario } from '../services/scenarioService';

const router = Router();

// 获取游戏历史
router.get('/:avatarId/history', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    // 验证角色所有权
    const avatar = db.prepare(`
      SELECT * FROM avatars WHERE id = ? AND user_id = ?
    `).get(req.params.avatarId, req.userId);

    if (!avatar) {
      return res.status(404).json({ error: '角色不存在' });
    }

    const history = db.prepare(`
      SELECT * FROM game_history WHERE avatar_id = ? ORDER BY created_at DESC LIMIT 50
    `).all(req.params.avatarId);

    const parsedHistory = history.map((h: any) => ({
      ...h,
      attributesChange: JSON.parse(h.attributes_change),
      statusChange: JSON.parse(h.status_change)
    }));

    res.json({ history: parsedHistory });
  } catch (error) {
    console.error('获取游戏历史错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取当前状态
router.get('/:avatarId/current', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const avatar = db.prepare(`
      SELECT * FROM avatars WHERE id = ? AND user_id = ?
    `).get(req.params.avatarId, req.userId) as any;

    if (!avatar) {
      return res.status(404).json({ error: '角色不存在' });
    }

    res.json({
      avatar: {
        id: avatar.id,
        name: avatar.name,
        attributes: JSON.parse(avatar.attributes),
        career: JSON.parse(avatar.career),
        status: JSON.parse(avatar.status),
        currentScenario: avatar.current_scenario,
        gameLog: JSON.parse(avatar.game_log)
      }
    });
  } catch (error) {
    console.error('获取当前状态错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 开始游戏
router.post('/start/:avatarId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const avatar = db.prepare(`
      SELECT * FROM avatars WHERE id = ? AND user_id = ?
    `).get(req.params.avatarId, req.userId) as any;

    if (!avatar) {
      return res.status(404).json({ error: '角色不存在' });
    }

    const attributes = JSON.parse(avatar.attributes);
    const status = JSON.parse(avatar.status);
    const career = JSON.parse(avatar.career);

    // 选择初始场景
    const initialScenario = selectRelevantScenario(attributes, status, career, []);

    if (!initialScenario) {
      return res.status(500).json({ error: '无法选择合适的场景' });
    }

    // 更新角色当前场景
    db.prepare(`
      UPDATE avatars 
      SET current_scenario = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(initialScenario.id, req.params.avatarId);

    res.json({
      message: '游戏开始',
      scenario: initialScenario,
      avatar: {
        id: avatar.id,
        name: avatar.name,
        attributes,
        career,
        status
      }
    });
  } catch (error) {
    console.error('开始游戏错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 执行AI行动
router.post('/:avatarId/action', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const avatar = db.prepare(`
      SELECT * FROM avatars WHERE id = ? AND user_id = ?
    `).get(req.params.avatarId, req.userId) as any;

    if (!avatar) {
      return res.status(404).json({ error: '角色不存在' });
    }

    const attributes = JSON.parse(avatar.attributes);
    const status = JSON.parse(avatar.status);
    const career = JSON.parse(avatar.career);
    const gameLog = JSON.parse(avatar.game_log) as GameEvent[];

    // 获取当前场景
    const currentScenarioId = avatar.current_scenario;
    let currentScenario: Scenario | undefined;

    if (currentScenarioId) {
      currentScenario = scenarios.find(s => s.id === currentScenarioId);
    }

    // 如果没有当前场景，选择一个新场景
    if (!currentScenario) {
      currentScenario = selectRelevantScenario(attributes, status, career, gameLog);
      if (!currentScenario) {
        return res.status(500).json({ error: '无法选择合适的场景' });
      }
    }

    // 生成AI行动
    const avatarData: Avatar = {
      id: avatar.id,
      userId: avatar.user_id,
      name: avatar.name,
      characterDescription: avatar.character_description,
      attributes,
      career,
      status,
      currentScenario: currentScenario.id,
      gameLog,
      createdAt: avatar.created_at,
      updatedAt: avatar.updated_at
    };

    const aiAction = await generateAIAction(avatarData, currentScenario, gameLog);

    // 评估结果
    const outcome = evaluateOutcome(
      aiAction.selectedChoice || { id: 'default', text: aiAction.action },
      currentScenario,
      attributes,
      status
    );

    // 计算属性变化
    const newAttributes = { ...attributes };
    const newStatus = { ...status };

    for (const [key, value] of Object.entries(outcome.attributesChange)) {
      const attrKey = key as keyof typeof attributes;
      newAttributes[attrKey] = Math.max(0, Math.min(100, (newAttributes[attrKey] || 50) + value));
    }

    for (const [key, value] of Object.entries(outcome.statusChange)) {
      const statusKey = key as keyof typeof status;
      newStatus[statusKey] = Math.max(0, Math.min(100, (newStatus[statusKey] || 50) + value));
    }

    // 添加游戏事件
    const gameEvent: GameEvent = {
      id: uuidv4(),
      scenarioId: currentScenario.id,
      scenarioTitle: currentScenario.title,
      action: aiAction.action,
      result: outcome.description,
      timestamp: new Date().toISOString()
    };

    const newGameLog = [...gameLog, gameEvent];

    // 选择下一个场景
    const nextScenario = selectNextScenario(newAttributes, newStatus, career, newGameLog);

    // 更新数据库
    db.prepare(`
      UPDATE avatars 
      SET attributes = ?, status = ?, current_scenario = ?, game_log = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      JSON.stringify(newAttributes),
      JSON.stringify(newStatus),
      nextScenario?.id || null,
      JSON.stringify(newGameLog),
      req.params.avatarId
    );

    // 记录游戏历史
    db.prepare(`
      INSERT INTO game_history (id, avatar_id, scenario_id, action, result, attributes_change, status_change)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      req.params.avatarId,
      currentScenario.id,
      aiAction.action,
      outcome.description,
      JSON.stringify(outcome.attributesChange),
      JSON.stringify(outcome.statusChange)
    );

    res.json({
      action: aiAction,
      outcome,
      newAttributes,
      newStatus,
      nextScenario,
      gameEvent,
      isGameOver: newStatus.健康 <= 0 || newStatus.心情 <= 0 || newStatus.声望 <= 0
    });
  } catch (error) {
    console.error('执行行动错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取所有场景
router.get('/scenarios/all', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const categories = req.query.categories as string;
    let filteredScenarios = scenarios;

    if (categories) {
      const categoryList = categories.split(',');
      filteredScenarios = scenarios.filter(s => categoryList.includes(s.category));
    }

    res.json({ scenarios: filteredScenarios });
  } catch (error) {
    console.error('获取场景列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
