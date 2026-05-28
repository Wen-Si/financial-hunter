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
} from '../types';
import * as localService from './localStorage';
import * as aiService from './aiService';
import * as scenarioService from './scenarioService';

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
    const user = localService.getCurrentUser();
    if (!user) return Promise.reject(new Error('未登录'));

    // Use AI to parse character description
    return aiService.parseCharacterDescription(characterDescription).then((parsed) => {
      return localService.createAvatar(user.id, name, characterDescription, parsed.attributes, parsed.career)
        .then((result) => ({ data: result }));
    });
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

export const gameAPI = {
  start: (avatarId: string): Promise<{ data: GameStartResponse }> => {
    const avatar = localService.getAvatar(avatarId);
    if (!avatar) return Promise.reject(new Error('角色不存在'));

    // Select initial scenario
    const history = localService.getGameHistory(avatarId);
    const scenario = scenarioService.selectRelevantScenario(
      avatar.attributes,
      avatar.status,
      avatar.career,
      history
    );

    if (!scenario) {
      return Promise.reject(new Error('没有可用的场景'));
    }

    // Update avatar's current scenario
    localService.updateAvatar(avatarId, { currentScenario: scenario.id });

    const { outcomes, ...scenarioWithoutOutcomes } = scenario;

    return Promise.resolve({
      data: {
        message: '游戏开始',
        scenario: scenarioWithoutOutcomes as Scenario,
        avatar: {
          id: avatar.id,
          name: avatar.name,
          attributes: avatar.attributes,
          career: avatar.career,
          status: avatar.status,
        },
      },
    });
  },

  getCurrent: (avatarId: string): Promise<{ data: { currentScenario: Scenario | null; avatar: Avatar } }> => {
    const avatar = localService.getAvatar(avatarId);
    if (!avatar) return Promise.reject(new Error('角色不存在'));

    let currentScenario: Scenario | null = null;
    if (avatar.currentScenario) {
      const found = scenarioService.scenarios.find((s) => s.id === avatar.currentScenario);
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

      // Evaluate outcome
      const outcome = aiService.evaluateOutcome(selectedChoice, scenario, avatar.attributes, avatar.status);

      // Apply changes
      const newAttributes = applyChanges(
        avatar.attributes as unknown as Record<string, number>,
        outcome.attributesChange as unknown as Partial<Record<string, number>>
      ) as unknown as AvatarAttributes;

      const newStatus = applyChanges(
        avatar.status as unknown as Record<string, number>,
        outcome.statusChange as unknown as Partial<Record<string, number>>
      ) as unknown as Status;

      // Check game over
      const isGameOver = checkGameOver(newStatus);

      // Save game event
      const gameEvent: GameEvent = {
        id: generateId(),
        scenarioId: scenario.id,
        scenarioTitle: scenario.title,
        action: aiResult.action,
        result: outcome.description,
        timestamp: new Date().toISOString(),
      };
      localService.saveGameEvent(avatarId, gameEvent);

      // Update avatar
      const updatedHistory = [...history, gameEvent];
      localService.updateAvatar(avatarId, {
        attributes: newAttributes,
        status: newStatus,
        gameLog: updatedHistory,
      });

      // Select next scenario
      let nextScenario: Scenario | null = null;
      if (!isGameOver) {
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
          outcome,
          newAttributes,
          newStatus,
          nextScenario,
          gameEvent,
          isGameOver,
        },
      };
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
