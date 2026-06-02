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

  // 根据角色属性确定分析角度（确保两个角色从不同角度出发）
  const getAnalysisAngle = () => {
    const attrs = speakerInfo.attributes;
    const otherAttrs = otherInfo.attributes;
    
    // 找出该角色相对较强的属性（与搭档相比）
    const advantages = [];
    if (attrs.专业知识 > otherAttrs.专业知识) advantages.push('专业');
    if (attrs.情商 > otherAttrs.情商) advantages.push('情商');
    if (attrs.人脉 > otherAttrs.人脉) advantages.push('人脉');
    if (attrs.品格 > otherAttrs.品格) advantages.push('品格');
    if (attrs.抗压能力 > otherAttrs.抗压能力) advantages.push('抗压');
    if (attrs.运气 > otherAttrs.运气) advantages.push('直觉');
    
    // 根据优势属性确定分析角度
    if (advantages.includes('专业')) {
      return '从专业分析角度：关注数据、模型、风险评估、合规要求、技术细节等专业层面';
    } else if (advantages.includes('情商')) {
      return '从人际洞察角度：关注各方利益相关者的情绪、关系维护、沟通策略、团队氛围';
    } else if (advantages.includes('人脉')) {
      return '从资源网络角度：关注行业关系、信息渠道、外部支持、潜在合作机会';
    } else if (advantages.includes('品格')) {
      return '从道德伦理角度：关注长期声誉、价值观、社会责任、职业道德底线';
    } else if (advantages.includes('抗压')) {
      return '从执行落地角度：关注操作可行性、时间压力、应急预案、执行风险';
    } else {
      return '从直觉判断角度：关注市场感觉、时机把握、机会窗口、灵活应变';
    }
  };

  // 根据对话阶段确定具体策略
  const getPhaseStrategy = () => {
    if (progressRatio <= 0.4) {
      // 早期：提出不同分析框架
      return '提出你的核心分析框架，与搭档形成互补视角。不要重复对方的思路，而是从另一个维度切入问题。';
    } else if (progressRatio <= 0.7) {
      // 中期：质疑或补充
      return '针对搭档的观点提出质疑或补充，可以从他忽略的角度切入。允许有激烈交锋，但要有建设性。';
    } else {
      // 后期：整合或坚持
      return '基于前面的讨论，给出你的最终立场。可以整合双方观点，也可以坚持己见并说明理由。';
    }
  };

  const analysisAngle = getAnalysisAngle();
  const phaseStrategy = getPhaseStrategy();

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

【你的分析角度 - 必须遵守】
${analysisAngle}

【阶段策略】
${phaseStrategy}

【表达方式 - 灵活选择，由AI根据上下文决定】
根据当前情境和角色特点，选择以下一种或多种表达方式：

1. **量化分析/数据说话**：
   - 使用具体数字、百分比、金额等
   - 例如："这个方案ROI只有3.2%，低于我们的门槛5%"
   - 例如："根据模型测算，风险敞口大约2000万"

2. **举例说明（可虚拟）**：
   - 引用过往案例、行业经验、听说过的故事
   - 例如："我之前在投行见过类似的deal，最后亏了30%"
   - 例如："记得2021年某基金就是因为这个策略爆仓的"

3. **诙谐幽默/俏皮话**：
   - 适当的职场幽默、自嘲、轻松的比喻
   - 例如："这方案要是能成，我请你吃一个月的火锅"
   - 例如："我的直觉告诉我...好吧，我的直觉上次也错了"
   - 例如："这风险比我家猫还难控制"

4. **专业严谨**：
   - 标准金融术语、合规要求、风控指标
   - 适用于高专业知识属性角色

5. **情感共鸣**：
   - 表达担忧、兴奋、压力等真实情绪
   - 适用于高情商属性角色

【核心要求 - 必须遵守】
1. **差异化视角**：必须与搭档从不同角度分析问题，形成互补而非重复
2. **基于角色属性发言**：高专业知识角色要展现专业分析，高情商角色要体现人际洞察，高品格角色要关注道德底线
3. **给出具体判断**：不要只说"我觉得"，要说"我认为应该...因为..."，提供具体分析和理由
4. **可以有失误**：角色不是完美的，可能判断错误、情绪化、计算失误（根据运气属性）
5. **真实争论**：
   - 早期：各自提出不同分析角度，形成互补视角
   - 中期：激烈争论，观点交锋，互相质疑对方忽略的因素
   - 后期：可能妥协、坚持己见、或找到折中方案
6. **情绪真实**：压力大时可能急躁，被质疑时可能 defensive，达成共识时可能欣慰
7. **直接输出对话内容**，不要加角色名前缀
8. 每轮30-80字，要有实质内容
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

// ==========================================
// 步骤7：生成闯关成功后的AI总结点评
// ==========================================
export async function* generateSuccessReview(
  pair: CharacterPair,
  scenario: Scenario,
  dialogueHistory: DialogueMessage[],
  result: CaseResult
): AsyncGenerator<string> {
  const systemPrompt = `你是金融职场模拟游戏的AI点评师。案例已成功通关，你需要对案例和角色表现进行专业总结点评。

点评风格要求：
1. **专业但不失幽默**：可以用轻松的语气，适当的职场梗
2. **具体且有洞察**：指出角色在对话中展现的优点和不足
3. **有数据支撑**：引用对话中的关键判断、数据、观点
4. **建设性**：给出未来可以改进的方向

点评结构：
1. 案例回顾（30-50字）：简要总结案例核心挑战
2. 角色表现点评（80-120字）：
   - 男性角色：分析其决策思路、专业展现、团队协作
   - 女性角色：分析其决策思路、专业展现、团队协作
3. 亮点总结（40-60字）：本轮最精彩的表现或判断
4. 成长建议（30-50字）：给两位角色的职业发展建议

总字数控制在200-300字。`;

  const dialogueSummary = dialogueHistory.map((msg) => {
    const name = msg.role === 'male' ? pair.male.name : msg.role === 'female' ? pair.female.name : msg.thirdParty?.name || '旁白';
    return `${name}：${msg.content.slice(0, 80)}`;
  }).join('\n');

  const userPrompt = `案例信息：
标题：${scenario.title}
描述：${scenario.description}
分类：${scenario.category}
难度：${scenario.difficulty}/5

角色信息：
- ${pair.male.name}（男）：${pair.male.career.当前职位}，性格：${pair.male.characterDescription}
- ${pair.female.name}（女）：${pair.female.career.当前职位}，性格：${pair.female.characterDescription}

对话记录：
${dialogueSummary}

案例结果：
${result.description}

情绪基调：${result.emotion}

请生成专业且有趣的总结点评：直接输出点评内容，不要加标题。`;

  yield* streamGLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], { temperature: 0.9, maxTokens: 600 });
}

// ==========================================
// 步骤8：生成闯关失败后的AI剖析
// ==========================================
export async function* generateFailureAnalysis(
  pair: CharacterPair,
  scenario: Scenario,
  dialogueHistory: DialogueMessage[],
  failureReason: string
): AsyncGenerator<string> {
  const systemPrompt = `你是金融职场模拟游戏的AI分析师。案例闯关失败，你需要对失败原因进行详尽剖析。

剖析风格要求：
1. **专业且客观**：基于对话内容分析，不回避问题
2. **具体且有深度**：指出具体哪轮对话、哪个判断出了问题
3. **有同理心**：理解角色的压力和局限，不苛责
4. **有建设性**：给出明确的改进方向

剖析结构：
1. 失败原因诊断（60-100字）：
   - 核心问题是什么
   - 是哪个环节出了错
2. 对话过程复盘（80-120字）：
   - 回顾关键决策点
   - 分析哪些判断是失误的
   - 指出被忽略的风险因素
3. 角色表现分析（60-80字）：
   - 两位角色各自的优点和不足
   - 协作中的问题
4. 改进建议（50-80字）：
   - 如果重新挑战，应该怎么做
   - 需要提升的能力或注意的要点

总字数控制在250-350字。语气要专业但鼓励性，不要打击玩家积极性。`;

  const dialogueSummary = dialogueHistory.map((msg) => {
    const name = msg.role === 'male' ? pair.male.name : msg.role === 'female' ? pair.female.name : msg.thirdParty?.name || '旁白';
    return `${name}：${msg.content.slice(0, 80)}`;
  }).join('\n');

  const userPrompt = `案例信息：
标题：${scenario.title}
描述：${scenario.description}
分类：${scenario.category}
难度：${scenario.difficulty}/5

角色信息：
- ${pair.male.name}（男）：${pair.male.career.当前职位}，性格：${pair.male.characterDescription}
- ${pair.female.name}（女）：${pair.female.career.当前职位}，性格：${pair.female.characterDescription}

对话记录：
${dialogueSummary}

失败原因：
${failureReason}

角色当前状态：
${pair.male.name}：金钱${pair.male.status.金钱} 心情${pair.male.status.心情} 健康${pair.male.status.健康} 声望${pair.male.status.声望}
${pair.female.name}：金钱${pair.female.status.金钱} 心情${pair.female.status.心情} 健康${pair.female.status.健康} 声望${pair.female.status.声望}

请生成详尽的失败剖析：直接输出剖析内容，不要加标题。`;

  yield* streamGLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], { temperature: 0.85, maxTokens: 700 });
}
