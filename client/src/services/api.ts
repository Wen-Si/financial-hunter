import {
  LoginResponse,
  User,
  Avatar,
  GameActionResponse,
  GameStartResponse,
  Scenario,
  AvatarAttributes,
  Status,
  GameEvent,
  CharacterPair,
  EmotionType,
} from '../types';
import * as localService from './localStorage';
import * as aiService from './aiService';
import * as scenarioService from './scenarioService';
import { generateComicFrames } from './comicService';

// ==========================================
// 认证API - 使用localStorage
// ==========================================
export const authAPI = {
  register: (username: string, email: string, password: string): Promise<{ data: LoginResponse }> => {
    return localService.registerUser(username, email, password).then((result) => {
      // Auto login after register
      localService.setCurrentUser(result.user);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      return { data: result };
    });
  },

  login: (username: string, password: string): Promise<{ data: LoginResponse }> => {
    return localService.loginUser(username, password).then((result) => {
      localService.setCurrentUser(result.user);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      return { data: result };
    });
  },

  getMe: (): Promise<{ data: { user: User } }> => {
    const user = localService.getCurrentUser();
    if (user) {
      return Promise.resolve({ data: { user } });
    }
    return Promise.reject(new Error('未登录'));
  },
};

// ==========================================
// 角色API - 使用localStorage
// ==========================================
export const avatarAPI = {
  getAll: (): Promise<{ data: { avatars: Avatar[] } }> => {
    const user = localService.getCurrentUser();
    if (!user) return Promise.reject(new Error('未登录'));
    const avatars = localService.getAvatars(user.id);
    return Promise.resolve({ data: { avatars } });
  },

  create: (name: string, characterDescription: string): Promise<{ data: { message: string; avatar: Avatar } }> => {
    // 旧的单角色创建接口已废弃，重定向到角色对创建
    return Promise.reject(new Error('请使用 createCharacterPair 创建角色'));
  },

  // 创建角色对（男性+女性）
  createCharacterPair: (
    maleName: string,
    femaleName: string,
    maleDescription: string,
    femaleDescription: string,
    maleAvatarUrl?: string | null,
    femaleAvatarUrl?: string | null
  ): Promise<{ data: { message: string; characterPair: CharacterPair } }> => {
    const user = localService.getCurrentUser();
    if (!user) return Promise.reject(new Error('未登录'));
    
    if (user.hasCreatedCharacters) {
      return Promise.reject(new Error('你已经创建过角色对，每个玩家只能创建一对角色'));
    }

    // 解析两个角色的描述
    return Promise.all([
      aiService.parseCharacterDescription(maleDescription),
      aiService.parseCharacterDescription(femaleDescription),
    ]).then(([maleParsed, femaleParsed]) => {
      const result = localService.createCharacterPair(
        user.id,
        maleDescription,
        femaleDescription,
        maleName,
        femaleName,
        maleParsed.career,
        femaleParsed.career,
        maleAvatarUrl,
        femaleAvatarUrl
      );
      return { data: result };
    });
  },

  getCharacterPair: (): Promise<{ data: CharacterPair | null }> => {
    const pair = localService.getCharacterPair();
    return Promise.resolve({ data: pair });
  },

  hasCharacterPair: (): Promise<{ data: boolean }> => {
    const user = localService.getCurrentUser();
    if (!user) return Promise.reject(new Error('未登录'));
    return Promise.resolve({ data: localService.hasCharacterPair(user.id) });
  },

  deleteCharacterPair: (): Promise<{ data: {} }> => {
    const user = localService.getCurrentUser();
    if (!user) return Promise.reject(new Error('未登录'));
    localService.deleteCharacterPair(user.id);
    return Promise.resolve({ data: {} });
  },

  get: (id: string): Promise<{ data: { avatar: Avatar } }> => {
    const avatar = localService.getAvatar(id);
    if (avatar) {
      return Promise.resolve({ data: { avatar } });
    }
    return Promise.reject(new Error('角色不存在'));
  },

  delete: (id: string): Promise<{ data: {} }> => {
    const user = localService.getCurrentUser();
    if (!user) return Promise.reject(new Error('未登录'));
    localService.deleteAvatar(user.id, id);
    return Promise.resolve({ data: {} });
  },
};

// ==========================================
// 游戏API - 使用localStorage + AI + ScenarioService
// ==========================================
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function applyChanges(
  base: Record<string, number>,
  changes: Partial<Record<string, number>>
): Record<string, number> {
  const result = { ...base };
  for (const [key, value] of Object.entries(changes)) {
    if (value !== undefined && key in result) {
      // 属性不设置上限，但最大不超过1000
      result[key] = Math.max(0, Math.min(1000, result[key] + value));
    }
  }
  return result;
}

function checkGameOver(status: Status): boolean {
  return status.金钱 <= 0 || status.健康 <= 0 || status.声望 <= 0 || status.心情 <= 0;
}

// 计算合作情绪
function calculateEmotion(outcome: { emotion?: EmotionType; statusChange?: Partial<Status> }): EmotionType {
  if (outcome.emotion) return outcome.emotion;
  
  // 根据状态变化推断情绪
  const moodChange = outcome.statusChange?.心情 || 0;
  const healthChange = outcome.statusChange?.健康 || 0;
  
  if (moodChange >= 10 || healthChange >= 10) return 'joy';
  if (moodChange <= -10) return 'sadness';
  if (moodChange >= 5 && moodChange < 10) return 'harmony';
  if (moodChange <= -5 && moodChange > -10) return 'tension';
  return 'neutral';
}

// 更新关系状态
function updateRelationship(
  pair: CharacterPair,
  outcome: { emotion?: EmotionType; attributesChange?: Partial<AvatarAttributes> }
): CharacterPair {
  const newPair = { ...pair };
  const emotion = outcome.emotion || 'neutral';
  
  // 根据结果更新关系
  switch (emotion) {
    case 'joy':
      newPair.relationship.harmony = Math.min(100, newPair.relationship.harmony + 5);
      newPair.relationship.trust = Math.min(100, newPair.relationship.trust + 3);
      newPair.relationship.joyfulMoments++;
      newPair.currentEmotion = 'joy';
      break;
    case 'conflict':
      newPair.relationship.harmony = Math.max(0, newPair.relationship.harmony - 10);
      newPair.relationship.trust = Math.max(0, newPair.relationship.trust - 5);
      newPair.relationship.conflicts++;
      newPair.currentEmotion = 'conflict';
      break;
    case 'sadness':
      newPair.relationship.harmony = Math.max(0, newPair.relationship.harmony - 5);
      newPair.currentEmotion = 'sadness';
      break;
    case 'tension':
      newPair.currentEmotion = 'tension';
      break;
    case 'harmony':
      newPair.relationship.harmony = Math.min(100, newPair.relationship.harmony + 3);
      newPair.currentEmotion = 'harmony';
      break;
    default:
      newPair.currentEmotion = 'neutral';
  }
  
  return newPair;
}

export const gameAPI = {
  // 开始游戏 - 使用角色对
  startWithPair: (): Promise<{ data: GameStartResponse }> => {
    const pair = localService.getCharacterPair();
    if (!pair) return Promise.reject(new Error('角色对不存在'));

    // 使用男性的属性和职业来选择场景
    const history = localService.getGameHistory(pair.male.id);
    const scenario = scenarioService.selectRelevantScenario(
      pair.male.attributes,
      pair.male.status,
      pair.male.career,
      history
    );

    if (!scenario) {
      return Promise.reject(new Error('没有可用的场景'));
    }

    // 更新角色的当前场景
    localService.updateAvatar(pair.male.id, { currentScenario: scenario.id });
    localService.updateAvatar(pair.female.id, { currentScenario: scenario.id });

    const { outcomes, ...scenarioWithoutOutcomes } = scenario;

    // 生成漫画分镜
    const comicFrames = generateComicFrames(
      scenario,
      pair.male.name,
      pair.female.name,
      '两人准备迎接挑战...',
      '故事开始了',
      'neutral'
    );

    return Promise.resolve({
      data: {
        message: '游戏开始',
        scenario: scenarioWithoutOutcomes as Scenario,
        characterPair: pair,
        comicFrames,
      },
    });
  },

  start: (avatarId: string): Promise<{ data: GameStartResponse }> => {
    // 兼容旧接口，尝试使用角色对
    return gameAPI.startWithPair();
  },

  getCurrent: (avatarId: string): Promise<{ data: { currentScenario: Scenario | null; avatar: Avatar } }> => {
    const avatar = localService.getAvatar(avatarId);
    if (!avatar) return Promise.reject(new Error('角色不存在'));

    let currentScenario: Scenario | null = null;
    if (avatar.currentScenario) {
      const found = scenarioService.scenarios.find((s: any) => s.id === avatar.currentScenario);
      if (found) {
        const { outcomes, ...rest } = found;
        currentScenario = rest as Scenario;
      }
    }

    return Promise.resolve({
      data: {
        currentScenario,
        avatar,
      },
    });
  },

  executeAction: (avatarId: string): Promise<{ data: GameActionResponse }> => {
    const avatar = localService.getAvatar(avatarId);
    if (!avatar) return Promise.reject(new Error('角色不存在'));

    if (!avatar.currentScenario) {
      return Promise.reject(new Error('没有当前场景，请先开始游戏'));
    }

    // Find the current scenario with outcomes
    const scenario = scenarioService.scenarios.find((s) => s.id === avatar.currentScenario);
    if (!scenario) return Promise.reject(new Error('场景不存在'));

    const history = localService.getGameHistory(avatarId);

    // Use AI to generate action
    return aiService.generateAIAction(avatar, scenario, history).then((aiResult) => {
      const selectedChoice = aiResult.selectedChoice || scenario.choices[0];

      // Use AI to generate outcome (NEW: AI-generated results)
      return aiService.generateAIOutcome(avatar, scenario, selectedChoice, history).then((aiOutcome) => {
        // Apply changes
        const newAttributes = applyChanges(
          avatar.attributes as unknown as Record<string, number>,
          aiOutcome.attributesChange as unknown as Partial<Record<string, number>>
        ) as unknown as AvatarAttributes;

        const newStatus = applyChanges(
          avatar.status as unknown as Record<string, number>,
          aiOutcome.statusChange as unknown as Partial<Record<string, number>>
        ) as unknown as Status;

        // Check game over
        const isGameOver = checkGameOver(newStatus);

        // Save game event
        const gameEvent: GameEvent = {
          id: generateId(),
          scenarioId: scenario.id,
          scenarioTitle: scenario.title,
          action: aiResult.action,
          result: aiOutcome.description,
          timestamp: new Date().toISOString(),
          emotion: aiOutcome.emotion,
        };
        localService.saveGameEvent(avatarId, gameEvent);

        // Update avatar
        const updatedHistory = [...history, gameEvent];
        localService.updateAvatar(avatarId, {
          attributes: newAttributes,
          status: newStatus,
          gameLog: updatedHistory,
        });

        // Select next scenario (or generate AI scenario)
        let nextScenario: Scenario | null = null;
        if (!isGameOver) {
          // 30% chance to generate AI scenario for more variety
          if (Math.random() < 0.3) {
            aiService.generateRandomScenario(avatar, updatedHistory).then(aiScenario => {
              if (aiScenario) {
                // Store AI-generated scenario temporarily
                (scenarioService as any).aiGeneratedScenario = aiScenario;
              }
            });
          }
          
          const next = scenarioService.selectNextScenario(newAttributes, newStatus, avatar.career, updatedHistory);
          if (next) {
            const { outcomes, ...rest } = next;
            nextScenario = rest as Scenario;
            localService.updateAvatar(avatarId, { currentScenario: next.id });
          }
        }

        return {
          data: {
            action: {
              action: aiResult.action,
              reasoning: aiResult.reasoning,
              selectedChoice,
            },
            outcome: {
              description: aiOutcome.description,
              attributesChange: aiOutcome.attributesChange,
              statusChange: aiOutcome.statusChange,
              emotion: aiOutcome.emotion,
            },
            newAttributes,
            newStatus,
            nextScenario,
            gameEvent,
            isGameOver,
          },
        };
      });
    });
  },

  // 双角色执行行动
  executeActionWithPair: (): Promise<{ data: GameActionResponse }> => {
    const pair = localService.getCharacterPair();
    if (!pair) return Promise.reject(new Error('角色对不存在'));

    if (!pair.male.currentScenario) {
      return Promise.reject(new Error('没有当前场景，请先开始游戏'));
    }

    // Find the current scenario with outcomes
    const scenario = scenarioService.scenarios.find((s) => s.id === pair.male.currentScenario);
    if (!scenario) return Promise.reject(new Error('场景不存在'));

    const history = localService.getGameHistory(pair.male.id);

    // 使用AI为两个角色生成协同行动
    return aiService.generateCooperativeAction(pair, scenario, history).then((aiResult) => {
      const selectedChoice = aiResult.selectedChoice || scenario.choices[0];

      // Use AI to generate outcome for male character (NEW: AI-generated results)
      return aiService.generateAIOutcome(pair.male, scenario, selectedChoice, history).then((aiOutcome) => {
        // Apply changes to male
        const newAttributesMale = applyChanges(
          pair.male.attributes as unknown as Record<string, number>,
          aiOutcome.attributesChange as unknown as Partial<Record<string, number>>
        ) as unknown as AvatarAttributes;

        const newStatusMale = applyChanges(
          pair.male.status as unknown as Record<string, number>,
          aiOutcome.statusChange as unknown as Partial<Record<string, number>>
        ) as unknown as Status;

        // 为女性角色应用稍微不同的变化（合作时变化略有不同）
        const femaleAttributeChange = { ...aiOutcome.attributesChange };
        const femaleStatusChange = { ...aiOutcome.statusChange };
        
        // 合作效果：女性角色从合作中获得额外加成
        Object.keys(femaleAttributeChange).forEach(key => {
          const val = femaleAttributeChange[key as keyof AvatarAttributes] || 0;
          femaleAttributeChange[key as keyof AvatarAttributes] = Math.floor(val * 0.7); // 获得70%的效果
        });
        
        Object.keys(femaleStatusChange).forEach(key => {
          const val = femaleStatusChange[key as keyof Status] || 0;
          // 女性从合作中获得更好的心情加成
          if (val > 0 && key === '心情') {
            femaleStatusChange[key as keyof Status] = val + 2;
          } else {
            femaleStatusChange[key as keyof Status] = Math.floor(val * 0.7);
          }
        });

        const newAttributesFemale = applyChanges(
          pair.female.attributes as unknown as Record<string, number>,
          femaleAttributeChange as unknown as Partial<Record<string, number>>
        ) as unknown as AvatarAttributes;

        const newStatusFemale = applyChanges(
          pair.female.status as unknown as Record<string, number>,
          femaleStatusChange as unknown as Partial<Record<string, number>>
        ) as unknown as Status;

        // Check game over (任一角色状态耗尽)
        const isGameOver = checkGameOver(newStatusMale) || checkGameOver(newStatusFemale);

        // Save game event for both
        const gameEvent: GameEvent = {
          id: generateId(),
          scenarioId: scenario.id,
          scenarioTitle: scenario.title,
          action: aiResult.action,
          result: aiOutcome.description,
          timestamp: new Date().toISOString(),
          emotion: aiOutcome.emotion,
        };

        localService.saveGameEvent(pair.male.id, gameEvent);
        localService.saveGameEvent(pair.female.id, gameEvent);

        // 更新角色对
        const updatedHistory = [...history, gameEvent];
        localService.updateAvatar(pair.male.id, {
          attributes: newAttributesMale,
          status: newStatusMale,
          gameLog: updatedHistory,
        });
        localService.updateAvatar(pair.female.id, {
          attributes: newAttributesFemale,
          status: newStatusFemale,
          gameLog: updatedHistory,
        });

        // 更新关系状态
        const updatedPair = updateRelationship(pair, { emotion: aiOutcome.emotion, attributesChange: aiOutcome.attributesChange });
        localService.updateCharacterPair(updatedPair);

        // Select next scenario (or generate AI scenario)
        let nextScenario: Scenario | null = null;
        let nextComicFrames: GameActionResponse['comicFrames'] = undefined;
        
        if (!isGameOver) {
          // 30% chance to generate AI scenario for more variety
          if (Math.random() < 0.3) {
            aiService.generateRandomScenario(pair.male, updatedHistory).then(aiScenario => {
              if (aiScenario) {
                // Store AI-generated scenario temporarily
                (scenarioService as any).aiGeneratedScenario = aiScenario;
              }
            });
          }
          
          const next = scenarioService.selectNextScenario(newAttributesMale, newStatusMale, pair.male.career, updatedHistory);
          if (next) {
            const { outcomes, ...rest } = next;
            nextScenario = rest as Scenario;
            localService.updateAvatar(pair.male.id, { currentScenario: next.id });
            localService.updateAvatar(pair.female.id, { currentScenario: next.id });
            
            // 生成下一个场景的漫画分镜
            nextComicFrames = generateComicFrames(
              next,
              pair.male.name,
              pair.female.name,
              aiResult.action,
              aiOutcome.description,
              aiOutcome.emotion
            );
          }
        }

        return {
          data: {
            action: {
              action: aiResult.action,
              reasoning: aiResult.reasoning,
              selectedChoice,
            },
            outcome: {
              description: aiOutcome.description,
              attributesChange: aiOutcome.attributesChange,
              statusChange: aiOutcome.statusChange,
              emotion: aiOutcome.emotion,
            },
            newAttributes: newAttributesMale,
            newStatus: newStatusMale,
            nextScenario,
            gameEvent,
            isGameOver,
            comicFrames: nextComicFrames,
          },
        };
      });
    });
  },

  getHistory: (avatarId: string): Promise<{ data: { events: GameEvent[] } }> => {
    const events = localService.getGameHistory(avatarId);
    return Promise.resolve({ data: { events } });
  },

  getScenarios: (): Promise<{ data: { scenarios: Scenario[] } }> => {
    const scenarios = scenarioService.getScenariosForDisplay();
    return Promise.resolve({ data: { scenarios } });
  },
};

// Keep a default export for compatibility
export default {
  authAPI,
  avatarAPI,
  gameAPI,
};
