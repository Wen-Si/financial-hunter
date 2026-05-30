// ==========================================
// 多轮对话AI生成服务
// 每个案例通过男女角色多轮对话完成
// ==========================================

import { streamGLM, callGLM } from './streamService';
import { CharacterPair, Scenario, EmotionType } from '../types';

// 对话消息类型
export interface DialogueMessage {
  role: 'male' | 'female' | 'narrator';
  content: string;
  emotion?: EmotionType;
}

// 案例对话结果
export interface CaseResult {
  description: string;
  reasoning: string;
  attributesChange: Record<string, number>;
  statusChange: Record<string, number>;
  emotion: EmotionType;
}

// ==========================================
// 步骤1：流式生成案例介绍（旁白）
// ==========================================
export async function* generateCaseIntroduction(
  scenario: Scenario,
  pair: CharacterPair
): AsyncGenerator<string> {
  const systemPrompt = `你是金融职场模拟游戏的旁白。你需要生动地介绍当前案例的背景和挑战。

角色信息：
- 男性角色：${pair.male.name}（${pair.male.career.当前职位}）
- 女性角色：${pair.female.name}（${pair.female.career.当前职位}）

请用200-300字生动描述这个案例的背景，营造紧张感和代入感。直接输出旁白文本，不要加任何前缀。`;

  const userPrompt = `案例标题：${scenario.title}
案例描述：${scenario.description}
背景信息：${scenario.context}

请为这个案例写一段引人入胜的开场旁白。`;

  yield* streamGLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], { temperature: 0.9, maxTokens: 500 });
}

// ==========================================
// 步骤2：确定对话轮数和发言顺序
// ==========================================
export async function determineDialogueStructure(
  scenario: Scenario,
  pair: CharacterPair
): Promise<{
  totalRounds: number;
  firstSpeaker: 'male' | 'female';
}> {
  const systemPrompt = `你是一个游戏系统。根据案例难度确定对话轮数。

规则：
- 难度1-2：10-12轮对话
- 难度3：13-16轮对话
- 难度4：17-20轮对话
- 难度5：21-25轮对话

请返回JSON格式：
{"totalRounds": <数字>, "firstSpeaker": "<male或female>"}

firstSpeaker随机选择，不要有偏好。`;

  const userPrompt = `案例：${scenario.title}
难度：${scenario.difficulty}/5
分类：${scenario.category}`;

  try {
    const result = await callGLM([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], 0.9);

    if (result) {
      const match = result.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          totalRounds: Math.max(10, Math.min(25, parsed.totalRounds || 12)),
          firstSpeaker: parsed.firstSpeaker === 'female' ? 'female' : 'male',
        };
      }
    }
  } catch (e) {
    console.warn('Failed to determine dialogue structure:', e);
  }

  // 备用逻辑
  const baseRounds = 10 + (scenario.difficulty - 1) * 3;
  const totalRounds = baseRounds + Math.floor(Math.random() * 4);
  const firstSpeaker: 'male' | 'female' = Math.random() > 0.5 ? 'male' : 'female';

  return { totalRounds, firstSpeaker };
}

// ==========================================
// 步骤3：流式生成单轮对话
// ==========================================
export async function* generateSingleDialogue(
  pair: CharacterPair,
  scenario: Scenario,
  speaker: 'male' | 'female',
  dialogueHistory: DialogueMessage[],
  roundNumber: number,
  totalRounds: number
): AsyncGenerator<string> {
  const speakerInfo = speaker === 'male' ? pair.male : pair.female;
  const otherInfo = speaker === 'male' ? pair.female : pair.male;

  // 构建对话历史摘要
  const historySummary = dialogueHistory.slice(-8).map((msg) => {
    const name = msg.role === 'male' ? pair.male.name : msg.role === 'female' ? pair.female.name : '旁白';
    return `${name}：${msg.content.slice(0, 80)}`;
  }).join('\n');

  const systemPrompt = `你是金融职场模拟游戏的AI角色扮演引擎。你需要扮演${speakerInfo.name}进行对话。

角色信息：
- 姓名：${speakerInfo.name}
- 性别：${speaker === 'male' ? '男' : '女'}
- 职业：${speakerInfo.career.当前职位}
- 性格：${speakerInfo.characterDescription}
- 属性：品格${speakerInfo.attributes.品格}、情商${speakerInfo.attributes.情商}、专业知识${speakerInfo.attributes.专业知识}、人脉${speakerInfo.attributes.人脉}、抗压能力${speakerInfo.attributes.抗压能力}

搭档信息：
- 姓名：${otherInfo.name}
- 性格：${otherInfo.characterDescription}

当前案例：${scenario.title}
案例描述：${scenario.description}

关系状态：
- 和谐度：${pair.relationship.harmony}/100
- 当前情绪：${pair.currentEmotion}

对话进度：第${roundNumber}轮/共${totalRounds}轮

重要规则：
1. 直接输出${speakerInfo.name}说的话，不要加"${speakerInfo.name}："前缀
2. 每轮对话30-80字
3. 说话风格要符合角色性格
4. 早期对话是分析讨论，中期是方案争论，后期是决策和执行
5. 要体现两人之间的合作、分歧或冲突
6. 对话要有真实感，像真实职场中的人
7. 不要输出旁白、动作描写，只输出对话内容`;

  const userPrompt = `${historySummary ? `之前的对话：\n${historySummary}\n\n` : ''}请${speakerInfo.name}发言（第${roundNumber}轮，共${totalRounds}轮）。直接说出对话内容。`;

  yield* streamGLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], { temperature: 0.95, maxTokens: 200 });
}

// ==========================================
// 步骤4：生成案例结果（流式）
// ==========================================
export async function* generateCaseResult(
  pair: CharacterPair,
  scenario: Scenario,
  dialogueHistory: DialogueMessage[]
): AsyncGenerator<string> {
  const systemPrompt = `你是金融职场模拟游戏的AI裁判。根据男女角色的多轮对话，生成案例的最终结果。

角色信息：
- ${pair.male.name}（男）：${pair.male.career.当前职位}
- ${pair.female.name}（女）：${pair.female.career.当前职位}

请返回JSON格式：
{
  "description": "<结果描述，100-200字，要有情节和细节>",
  "reasoning": "<AI分析两人决策的理由，50-100字>",
  "attributesChange": {
    "品格": <变化值-15到15>,
    "情商": <变化值-15到15>,
    "专业知识": <变化值-15到15>,
    "人脉": <变化值-15到15>,
    "抗压能力": <变化值-15到15>,
    "运气": <变化值-10到10>
  },
  "statusChange": {
    "金钱": <变化值-30到30>,
    "心情": <变化值-20到20>,
    "健康": <变化值-15到15>,
    "声望": <变化值-20到20>
  },
  "emotion": "<joy/conflict/sadness/tension/harmony/neutral>"
}

规则：
- 属性变化要有增有减
- 情绪要多样化
- 结果要有创意和惊喜`;

  const dialogueSummary = dialogueHistory.slice(-15).map((msg) => {
    const name = msg.role === 'male' ? pair.male.name : msg.role === 'female' ? pair.female.name : '旁白';
    return `${name}：${msg.content.slice(0, 60)}`;
  }).join('\n');

  const userPrompt = `案例：${scenario.title}
描述：${scenario.description}

对话记录：
${dialogueSummary}

请生成案例结果。`;

  yield* streamGLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], { temperature: 0.85, maxTokens: 800 });
}
