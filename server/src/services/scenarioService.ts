import { AvatarAttributes, Status, Career, GameEvent, Scenario } from '../types';
import { scenarios } from '../scenarios';

// 根据角色状态选择合适的场景
export function selectRelevantScenario(
  attributes: AvatarAttributes,
  status: Status,
  career: Career,
  history: GameEvent[]
): Scenario | null {
  // 过滤掉最近5个历史场景
  const recentScenarioIds = history.slice(-5).map(e => e.scenarioId);

  // 根据属性和状态计算场景匹配度
  const scoredScenarios = scenarios.map(scenario => {
    let score = 100 - scenario.difficulty * 5; // 基础分，难度越低越容易触发

    // 根据触发条件评分
    if (scenario.triggers.attributes) {
      for (const [key, value] of Object.entries(scenario.triggers.attributes)) {
        const attrKey = key as keyof AvatarAttributes;
        const attrValue = attributes[attrKey] || 50;
        if (attrValue >= value) {
          score += 20;
        } else if (attrValue >= value - 20) {
          score += 10;
        }
      }
    }

    if (scenario.triggers.status) {
      for (const [key, value] of Object.entries(scenario.triggers.status)) {
        const statusKey = key as keyof Status;
        const statusValue = status[statusKey] || 50;
        if (statusValue <= value) {
          score += 15;
        }
      }
    }

    if (scenario.triggers.career) {
      if (scenario.triggers.career.当前职位 === career.当前职位) {
        score += 25;
      }
    }

    // 惩罚最近出现的场景
    if (recentScenarioIds.includes(scenario.id)) {
      score -= 50;
    }

    // 根据心情状态调整
    if (status.心情 < 30) {
      // 低心情时更可能触发负面场景
      if (scenario.category === '职场') {
        score += 20;
      }
    }

    // 根据金钱状态调整
    if (status.金钱 < 30) {
      // 缺钱时更可能触发经济相关场景
      if (scenario.title.includes('金钱') || scenario.title.includes('薪酬') || scenario.title.includes('奖金')) {
        score += 25;
      }
    }

    return { scenario, score };
  });

  // 按分数排序
  scoredScenarios.sort((a, b) => b.score - a.score);

  // 从前10个候选场景中随机选择
  const topScenarios = scoredScenarios.slice(0, 10);
  const totalScore = topScenarios.reduce((sum, s) => sum + s.score, 0);
  let random = Math.random() * totalScore;

  for (const { scenario, score } of topScenarios) {
    random -= score;
    if (random <= 0) {
      return scenario;
    }
  }

  return scoredScenarios[0]?.scenario || scenarios[0];
}

// 选择下一个场景
export function selectNextScenario(
  attributes: AvatarAttributes,
  status: Status,
  career: Career,
  history: GameEvent[]
): Scenario | null {
  // 检查是否游戏结束
  if (status.健康 <= 0 || status.心情 <= 0 || status.声望 <= 0) {
    return null;
  }

  return selectRelevantScenario(attributes, status, career, history);
}

// 获取场景统计
export function getScenarioStats() {
  const categoryCount: Record<string, number> = {};
  const difficultyCount: Record<number, number> = {};

  for (const scenario of scenarios) {
    categoryCount[scenario.category] = (categoryCount[scenario.category] || 0) + 1;
    difficultyCount[scenario.difficulty] = (difficultyCount[scenario.difficulty] || 0) + 1;
  }

  return {
    total: scenarios.length,
    byCategory: categoryCount,
    byDifficulty: difficultyCount
  };
}
