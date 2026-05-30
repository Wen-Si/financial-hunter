// ==========================================
// 多轮对话AI生成服务
// 每个案例通过男女角色多轮对话完成
// ==========================================

import { streamGLM, callGLM } from './streamService';
import { CharacterPair, Scenario, EmotionType } from '../types';

// 第三方角色类型
export type ThirdPartyRole = 
  | 'boss'           // 上司
  | 'colleague'      // 其他部门员工
  | 'regulator'      // 监管部门员工
  | 'peer'           // 同业员工
  | 'competitor'     // 竞争对手
  | 'client'         // 客户
  | 'partner';       // 合作伙伴

// 第三方角色信息
export interface ThirdPartyCharacter {
  id: string;
  role: ThirdPartyRole;
  name: string;
  title: string;
  description: string;
}

// 对话消息类型
export interface DialogueMessage {
  role: 'male' | 'female' | 'narrator' | 'thirdParty';
  content: string;
  emotion?: EmotionType;
  thirdParty?: ThirdPartyCharacter;  // 当role为'thirdParty'时使用
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

  // 分析当前对话阶段
  const progressRatio = roundNumber / totalRounds;
  let phase = '早期分析';
  if (progressRatio > 0.4) phase = '中期争论';
  if (progressRatio > 0.7) phase = '后期决策';

  // 随机决定是否要犯错（20%概率）
  const shouldMakeMistake = Math.random() < 0.2 && progressRatio < 0.8;
  const mistakeHint = shouldMakeMistake ? '本轮你可以犯一个错误（判断失误、计算错误、情绪化反应等），让对话更真实。' : '';

  const systemPrompt = `你是金融职场模拟游戏的AI角色扮演引擎。你需要深度扮演${speakerInfo.name}进行对话。

【角色设定】
- 姓名：${speakerInfo.name}
- 性别：${speaker === 'male' ? '男' : '女'}
- 职业：${speakerInfo.career.当前职位}
- 性格：${speakerInfo.characterDescription}
- 六维属性：品格${speakerInfo.attributes.品格}、情商${speakerInfo.attributes.情商}、专业知识${speakerInfo.attributes.专业知识}、人脉${speakerInfo.attributes.人脉}、抗压能力${speakerInfo.attributes.抗压能力}、运气${speakerInfo.attributes.运气}

【搭档信息】
- 姓名：${otherInfo.name}
- 性格：${otherInfo.characterDescription}
- 你们的关系：和谐度${pair.relationship.harmony}/100，信任度${pair.relationship.trust}/100

【当前案例】
- 标题：${scenario.title}
- 描述：${scenario.description}
- 难度：${scenario.difficulty}/5

【对话状态】
- 当前阶段：${phase}（第${roundNumber}轮/共${totalRounds}轮）
- 当前情绪：${pair.currentEmotion}

【核心要求 - 必须遵守】
1. **基于角色属性发言**：高专业知识角色要展现专业分析，高情商角色要体现人际洞察，高品格角色要关注道德底线
2. **给出具体判断**：不要只说"我觉得"，要说"我认为应该...因为..."，提供具体分析和理由
3. **可以有失误**：角色不是完美的，可能判断错误、情绪化、计算失误（根据运气属性）
4. **真实争论**：
   - 早期：各自提出不同分析角度，可能有分歧
   - 中期：激烈争论，观点交锋，互相质疑
   - 后期：可能妥协、坚持己见、或找到折中方案
5. **情绪真实**：压力大时可能急躁，被质疑时可能 defensive，达成共识时可能欣慰
6. **直接输出对话内容**，不要加角色名前缀
7. 每轮30-80字，要有实质内容
${mistakeHint}`;

  const userPrompt = `${historySummary ? `【对话历史】\n${historySummary}\n\n` : ''}【当前任务】
请${speakerInfo.name}基于你的角色属性和当前阶段，对案例"${scenario.title}"发表具体看法。

要求：
- 如果是早期：提出你的分析和初步判断
- 如果是中期：回应对方的观点，可以同意、反驳或提出新角度
- 如果是后期：做出决策或总结
- 要体现你的性格特点（${speakerInfo.characterDescription}）
- 可以直接说出你的担忧、犹豫、自信或不确定

直接开始说话：`;

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

// ==========================================
// 步骤5：AI决定是否引入第三方角色
// ==========================================
export async function shouldIntroduceThirdParty(
  pair: CharacterPair,
  scenario: Scenario,
  dialogueHistory: DialogueMessage[],
  roundNumber: number,
  totalRounds: number
): Promise<ThirdPartyCharacter | null> {
  // 前3轮不引入新角色，让男女主角先讨论
  if (roundNumber <= 3) return null;
  
  // 最后3轮不引入新角色，让男女主角做最终决策
  if (roundNumber >= totalRounds - 2) return null;
  
  // 已经有第三方角色在对话中，不再引入
  const hasThirdParty = dialogueHistory.some(msg => msg.role === 'thirdParty');
  if (hasThirdParty) return null;
  
  // 30%概率引入新角色（由AI决定具体时机和角色）
  if (Math.random() > 0.3) return null;

  const systemPrompt = `你是金融职场模拟游戏的AI导演。根据当前对话进度和案例情况，决定是否引入第三方角色。

可选角色类型：
- boss：上司（严厉、权威、关注结果）
- colleague：其他部门员工（协作、推诿、信息不对称）
- regulator：监管部门员工（合规、审查、质询）
- peer：同业员工（竞争、合作、信息交换）
- competitor：竞争对手（敌意、试探、商业间谍）
- client：客户（需求、投诉、谈判）
- partner：合作伙伴（协商、利益分配、风险共担）

请返回JSON格式（如果决定不引入，返回null）：
{
  "shouldIntroduce": true,
  "role": "<boss/colleague/regulator/peer/competitor/client/partner>",
  "name": "<角色姓名>",
  "title": "<职位/头衔>",
  "description": "<简短描述，20-30字>"
}

或
{"shouldIntroduce": false}

引入原则：
- 案例涉及合规问题 → regulator
- 需要跨部门协作 → colleague
- 涉及客户投诉 → client
- 有商业竞争 → competitor/peer
- 需要高层决策 → boss
- 需要外部合作 → partner`;

  const historySummary = dialogueHistory.slice(-5).map((msg) => {
    const name = msg.role === 'male' ? pair.male.name : msg.role === 'female' ? pair.female.name : msg.thirdParty?.name || '旁白';
    return `${name}：${msg.content.slice(0, 60)}`;
  }).join('\n');

  const userPrompt = `案例：${scenario.title}
描述：${scenario.description}
当前轮数：${roundNumber}/${totalRounds}

最近对话：
${historySummary}

请决定是否引入第三方角色。`;

  try {
    const result = await callGLM([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], 0.9);

    if (result) {
      const match = result.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.shouldIntroduce && parsed.role) {
          return {
            id: `third_${Date.now()}`,
            role: parsed.role,
            name: parsed.name || '未知',
            title: parsed.title || '相关人员',
            description: parsed.description || '',
          };
        }
      }
    }
  } catch (e) {
    console.warn('Failed to determine third party:', e);
  }

  return null;
}

// ==========================================
// 步骤6：流式生成第三方角色对话
// ==========================================
export async function* generateThirdPartyDialogue(
  pair: CharacterPair,
  scenario: Scenario,
  thirdParty: ThirdPartyCharacter,
  dialogueHistory: DialogueMessage[],
  roundNumber: number,
  totalRounds: number
): AsyncGenerator<string> {
  const systemPrompt = `你是金融职场模拟游戏的AI角色扮演引擎。你需要扮演第三方角色进行对话。

角色信息：
- 姓名：${thirdParty.name}
- 身份：${thirdParty.title}
- 类型：${thirdParty.role}
- 描述：${thirdParty.description}

主角信息：
- ${pair.male.name}（男）：${pair.male.career.当前职位}
- ${pair.female.name}（女）：${pair.female.career.当前职位}

当前案例：${scenario.title}
案例描述：${scenario.description}

对话进度：第${roundNumber}轮/共${totalRounds}轮

重要规则：
1. 直接输出${thirdParty.name}说的话，不要加"${thirdParty.name}："前缀
2. 每轮对话30-80字
3. 说话风格要符合角色身份（${thirdParty.role}）
4. 第三方角色只出现1-2轮，推动剧情发展
5. 对话要有真实感，体现角色的立场和利益
6. 不要输出旁白、动作描写，只输出对话内容`;

  const historySummary = dialogueHistory.slice(-6).map((msg) => {
    const name = msg.role === 'male' ? pair.male.name : msg.role === 'female' ? pair.female.name : msg.thirdParty?.name || '旁白';
    return `${name}：${msg.content.slice(0, 60)}`;
  }).join('\n');

  const userPrompt = `${historySummary ? `之前的对话：\n${historySummary}\n\n` : ''}请${thirdParty.name}（${thirdParty.title}）发言（第${roundNumber}轮）。直接说出对话内容。`;

  yield* streamGLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], { temperature: 0.9, maxTokens: 200 });
}
