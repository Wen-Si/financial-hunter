import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { Avatar, AvatarAttributes, Career, Status, GameEvent } from '../types';
import { parseCharacterDescription } from '../services/aiService';

const router = Router();

// 获取用户的所有角色
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const avatars = db.prepare(`
      SELECT * FROM avatars WHERE user_id = ? ORDER BY created_at DESC
    `).all(req.userId);

    const parsedAvatars = avatars.map((avatar: any) => ({
      ...avatar,
      attributes: JSON.parse(avatar.attributes),
      career: JSON.parse(avatar.career),
      status: JSON.parse(avatar.status),
      gameLog: JSON.parse(avatar.game_log)
    }));

    res.json({ avatars: parsedAvatars });
  } catch (error) {
    console.error('获取角色列表错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建新角色
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name, characterDescription } = req.body;

    if (!name || !characterDescription) {
      return res.status(400).json({ error: '请提供角色名称和描述' });
    }

    // 使用AI解析角色描述
    const attributes = await parseCharacterDescription(characterDescription);

    const avatarId = uuidv4();
    const defaultCareer: Career = {
      当前职位: '分析师',
      目标方向: '投资银行',
      工作年限: 1,
      所属机构: '未知'
    };

    const defaultStatus: Status = {
      金钱: 50,
      心情: 70,
      健康: 80,
      声望: 30
    };

    db.prepare(`
      INSERT INTO avatars (id, user_id, name, character_description, attributes, career, status, game_log)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      avatarId,
      req.userId,
      name,
      characterDescription,
      JSON.stringify(attributes),
      JSON.stringify(defaultCareer),
      JSON.stringify(defaultStatus),
      JSON.stringify([])
    );

    const newAvatar: Avatar = {
      id: avatarId,
      userId: req.userId!,
      name,
      characterDescription,
      attributes,
      career: defaultCareer,
      status: defaultStatus,
      currentScenario: null,
      gameLog: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({
      message: '角色创建成功',
      avatar: newAvatar
    });
  } catch (error) {
    console.error('创建角色错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取角色详情
router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const avatar = db.prepare(`
      SELECT * FROM avatars WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.userId) as any;

    if (!avatar) {
      return res.status(404).json({ error: '角色不存在' });
    }

    res.json({
      avatar: {
        ...avatar,
        attributes: JSON.parse(avatar.attributes),
        career: JSON.parse(avatar.career),
        status: JSON.parse(avatar.status),
        gameLog: JSON.parse(avatar.game_log)
      }
    });
  } catch (error) {
    console.error('获取角色详情错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除角色
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const result = db.prepare(`
      DELETE FROM avatars WHERE id = ? AND user_id = ?
    `).run(req.params.id, req.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: '角色不存在' });
    }

    res.json({ message: '角色删除成功' });
  } catch (error) {
    console.error('删除角色错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 更新角色状态
router.patch('/:id/status', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { status, career, attributes } = req.body;

    const avatar = db.prepare(`
      SELECT * FROM avatars WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.userId) as any;

    if (!avatar) {
      return res.status(404).json({ error: '角色不存在' });
    }

    const currentStatus = JSON.parse(avatar.status);
    const currentCareer = JSON.parse(avatar.career);
    const currentAttributes = JSON.parse(avatar.attributes);

    const updatedStatus = status ? { ...currentStatus, ...status } : currentStatus;
    const updatedCareer = career ? { ...currentCareer, ...career } : currentCareer;
    const updatedAttributes = attributes ? { ...currentAttributes, ...attributes } : currentAttributes;

    db.prepare(`
      UPDATE avatars 
      SET status = ?, career = ?, attributes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      JSON.stringify(updatedStatus),
      JSON.stringify(updatedCareer),
      JSON.stringify(updatedAttributes),
      req.params.id
    );

    res.json({
      message: '状态更新成功',
      avatar: {
        ...avatar,
        attributes: updatedAttributes,
        career: updatedCareer,
        status: updatedStatus
      }
    });
  } catch (error) {
    console.error('更新角色状态错误:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
