import { AvatarAttributes, Avatar, Scenario, Choice, Outcome } from '../types';

// 解析角色描述，生成初始属性
export async function parseCharacterDescription(description: string): Promise<AvatarAttributes> {
  // 默认属性
  const defaultAttributes: AvatarAttributes = {
    品格: 50,
    情商: 50,
    专业知识: 50,
    人脉: 50,
    抗压能力: 50,
    运气: 50
  };

  const desc = description.toLowerCase();

  // 分析品格
  if (desc.includes('正直') || desc.includes('诚信') || desc.includes('道德') || desc.includes('诚实')) {
    defaultAttributes.品格 += 20;
  }
  if (desc.includes('狡猾') || desc.includes('投机') || desc.includes('自私') || desc.includes('贪婪')) {
    defaultAttributes.品格 -= 20;
  }

  // 分析情商
  if (desc.includes('善于交际') || desc.includes('圆滑') || desc.includes('人脉广') || desc.includes('外向')) {
    defaultAttributes.情商 += 25;
  }
  if (desc.includes('内向') || desc.includes('不善交际') || desc.includes('社恐')) {
    defaultAttributes.情商 -= 15;
  }

  // 分析专业知识
  if (desc.includes('名校') || desc.includes('博士') || desc.includes('硕士') || desc.includes('CFA') || desc.includes('CPA')) {
    defaultAttributes.专业知识 += 25;
  }
  if (desc.includes('资深') || desc.includes('经验丰富') || desc.includes('专家')) {
    defaultAttributes.专业知识 += 15;
  }

  // 分析人脉
  if (desc.includes('世家') || desc.includes('背景') || desc.includes('资源') || desc.includes('人脉广')) {
    defaultAttributes.人脉 += 30;
  }

  // 分析抗压能力
  if (desc.includes('坚韧') || desc.includes('抗压') || desc.includes('冷静') || desc.includes('沉着')) {
    defaultAttributes.抗压能力 += 25;
  }
  if (desc.includes('敏感') || desc.includes('脆弱') || desc.includes('焦虑')) {
    defaultAttributes.抗压能力 -= 15;
  }

  // 确保值在0-100范围内
  for (const key of Object.keys(defaultAttributes) as (keyof AvatarAttributes)[]) {
    defaultAttributes[key] = Math.max(0, Math.min(100, defaultAttributes[key]));
  }

  return defaultAttributes;
}

// ==========================================
// NVIDIA API 多模型配置
// 集成 GLM-5.2 / DeepSeek-V4-Pro / DeepSeek-V4-Flash / Kimi-K2.6 / MiniMax-M3
// ==========================================
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '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';
const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 30000;

const NVIDIA_MODELS = {
  DEEPSEEK_V4_PRO: 'deepseek-ai/deepseek-v4-pro',
  GLM_5_2: 'z-ai/glm-5.2',
  DEEPSEEK_V4: 'deepseek-ai/deepseek-v4-flash',
  KIMI_K2: 'moonshotai/kimi-k2.6',
  MINIMAX_M3: 'minimaxai/minimax-m3',
} as const;

// 候选模型列表（按优先级排列，主模型失败自动降级到备选）
const SERVER_MODEL_FALLBACK = [
  NVIDIA_MODELS.DEEPSEEK_V4_PRO,
  NVIDIA_MODELS.KIMI_K2,
  NVIDIA_MODELS.DEEPSEEK_V4,
  NVIDIA_MODELS.GLM_5_2,
  NVIDIA_MODELS.MINIMAX_M3,
];

// 调用NVIDIA API（支持多模型自动降级）
async function callNVIDIA(
  messages: { role: string; content: string }[],
  temperature: number = 0.8,
  maxTokens: number = 500
): Promise<string | null> {
  for (const model of SERVER_MODEL_FALLBACK) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(NVIDIA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: false,
          top_p: 0.95,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`NVIDIA API [${model}] error:`, response.status, response.statusText);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        return content;
      }
      console.warn(`NVIDIA API [${model}] returned empty content`);
    } catch (err) {
      console.warn(`NVIDIA API [${model}] exception:`, err);
    }
  }
  return null;
}

// 生成AI行动
export async function generateAIAction(
  avatar: Avatar,
  scenario: Scenario,
  history: { scenarioId: string; action: string }[]
): Promise<{ action: string; reasoning: string; selectedChoice?: Choice }> {
  const systemPrompt = `你是"金融猎手"游戏的AI引擎。你的任务是模拟一个金融从业者在复杂职场环境中的决策过程。

当前数字人的角色设定：
- 名字：${avatar.name}
- 性格描述：${avatar.characterDescription}
- 当前属性：
  * 品格: ${avatar.attributes.品格} (0-100，越高越正直)
  * 情商: ${avatar.attributes.情商} (0-100，越高越善于人际交往)
  * 专业知识: ${avatar.attributes.专业知识} (0-100，越高越专业)
  * 人脉: ${avatar.attributes.人脉} (0-100，越高关系越广)
  * 抗压能力: ${avatar.attributes.抗压能力} (0-100，越高越能应对压力)
  * 运气: ${avatar.attributes.运气} (0-100，影响随机事件)
- 当前状态：
  * 金钱: ${avatar.status.金钱}/100
  * 心情: ${avatar.status.心情}/100
  * 健康: ${avatar.status.健康}/100
  * 声望: ${avatar.status.声望}/100
- 当前职位: ${avatar.career.当前职位}
- 所属机构: ${avatar.career.所属机构}
- 工作年限: ${avatar.career.工作年限}年
- 目标方向: ${avatar.career.目标方向}

请根据上述信息，从给定的选项中选择最合适的行动，并解释你的决策理由。
注意：你的选择应该符合角色的性格设定和当前状态。`;

  const userPrompt = `
当前场景：【${scenario.title}】
场景描述：${scenario.description}
场景背景：${scenario.context}

可选行动：
${scenario.choices.map((choice, index) => `${index + 1}. ${choice.text}`).join('\n')}

请做出你的选择，并说明理由。格式如下：
选择：[选择的序号]
理由：[你的决策理由]
`;

  try {
    const content = await callNVIDIA([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], 0.7, 500);

    if (content) {
      // 解析AI的决策
      const choiceMatch = content.match(/选择[：:]\s*(\d+)/);
      const selectedIndex = choiceMatch ? parseInt(choiceMatch[1]) - 1 : Math.floor(Math.random() * scenario.choices.length);
      const selectedChoice = scenario.choices[selectedIndex] || scenario.choices[0];

      const reasoningMatch = content.match(/理由[：:]\s*([\s\S]*?)(?:$|(?=\n\n))/);
      const reasoning = reasoningMatch ? reasoningMatch[1].trim() : '根据当前情况做出的决策';

      return {
        action: selectedChoice.text,
        reasoning,
        selectedChoice
      };
    }
  } catch (error) {
    console.error('AI行动生成失败，使用随机选择:', error);
  }

  // 如果所有模型都失败，使用随机选择
  const randomIndex = Math.floor(Math.random() * scenario.choices.length);
  return {
    action: scenario.choices[randomIndex].text,
    reasoning: '由于AI服务暂时不可用，采用默认决策策略',
    selectedChoice: scenario.choices[randomIndex]
  };
}

// 评估结果
export function evaluateOutcome(
  choice: Choice,
  scenario: Scenario,
  currentAttributes: AvatarAttributes,
  currentStatus: { 金钱: number; 心情: number; 健康: number; 声望: number }
): Outcome & { attributesChange: Partial<AvatarAttributes>; statusChange: Partial<{ 金钱: number; 心情: number; 健康: number; 声望: number }> } {
  const outcome = scenario.outcomes[choice.id] || {
    description: '事件结束，结果未知',
    attributesChange: {},
    statusChange: {}
  };

  // 添加随机因素（基于运气属性）
  const luckFactor = (currentAttributes.运气 - 50) / 100;

  const attributesChange: Partial<AvatarAttributes> = {};
  const statusChange: Partial<{ 金钱: number; 心情: number; 健康: number; 声望: number }> = {};

  // 计算属性变化（加入运气因素）
  for (const [key, value] of Object.entries(outcome.attributesChange)) {
    const randomFactor = 1 + (Math.random() - 0.5) * 0.4; // ±20%随机波动
    const luckBonus = value > 0 ? luckFactor * 5 : -luckFactor * 5;
    (attributesChange as any)[key] = Math.round((value + luckBonus) * randomFactor);
  }

  // 计算状态变化
  for (const [key, value] of Object.entries(outcome.statusChange)) {
    const randomFactor = 1 + (Math.random() - 0.5) * 0.3; // ±15%随机波动
    const luckBonus = value > 0 ? luckFactor * 3 : -luckFactor * 3;
    (statusChange as any)[key] = Math.round((value + luckBonus) * randomFactor);
  }

  return {
    ...outcome,
    attributesChange,
    statusChange
  };
}
