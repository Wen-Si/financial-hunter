import { Avatar, AvatarAttributes, Career, Status, Scenario, Choice, GameEvent, CharacterPair, EmotionType } from '../types';
// 使用智谱AI GLM-4.5-Flash模型
import { callGLM } from './streamService';

// ==========================================
// Parse character description
// ==========================================
export async function parseCharacterDescription(
  description: string
): Promise<{
  attributes: AvatarAttributes;
  career: Career;
}> {
  // Try AI parsing first
  const systemPrompt = `你是一个金融职场角色属性分析专家。根据用户提供的角色描述，分析并生成角色的属性值和职业信息。

请严格按照以下JSON格式返回（不要包含任何其他文字）：
{
  "attributes": {
    "品格": <1-100的整数>,
    "情商": <1-100的整数>,
    "专业知识": <1-100的整数>,
    "人脉": <1-100的整数>,
    "抗压能力": <1-100的整数>,
    "运气": <1-100的整数>
  },
  "career": {
    "当前职位": "<职位名称>",
    "目标方向": "<目标方向>",
    "工作年限": <数字>,
    "所属机构": "<机构名称>"
  }
}

属性值说明：
- 品格：正直、诚信、道德水准
- 情商：沟通、人际关系、情绪管理
- 专业知识：金融知识、分析能力、证书资质
- 人脉：社交网络、行业关系
- 抗压能力：心理韧性、压力管理
- 运气：随机因素，一般设为50左右

根据描述中的信息合理推断，描述中未提及的属性设为50。`;

  const aiResult = await callGLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: description },
  ], 0.7);

  if (aiResult) {
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = aiResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Validate values - no upper limit but max 1000
        const attrKeys: (keyof AvatarAttributes)[] = ['品格', '情商', '专业知识', '人脉', '抗压能力', '运气'];
        for (const key of attrKeys) {
          if (typeof parsed.attributes?.[key] !== 'number' || parsed.attributes[key] < 1 || parsed.attributes[key] > 1000) {
            parsed.attributes[key] = 50;
          }
        }
        return {
          attributes: parsed.attributes,
          career: {
            当前职位: parsed.career?.当前职位 || '金融从业者',
            目标方向: parsed.career?.目标方向 || '金融行业高管',
            工作年限: typeof parsed.career?.工作年限 === 'number' ? parsed.career.工作年限 : 3,
            所属机构: parsed.career?.所属机构 || '某金融机构',
          },
        };
      }
    } catch (e) {
      console.warn('Failed to parse AI response:', e);
    }
  }

  // Fallback: local keyword matching
  return localKeywordParse(description);
}

function localKeywordParse(description: string): {
  attributes: AvatarAttributes;
  career: Career;
} {
  const attributes: AvatarAttributes = {
    品格: 50,
    情商: 50,
    专业知识: 50,
    人脉: 50,
    抗压能力: 50,
    运气: 50,
  };

  const career: Career = {
    当前职位: '金融从业者',
    目标方向: '金融行业高管',
    工作年限: 3,
    所属机构: '某金融机构',
  };

  // Parse attributes based on keywords
  const lowerDesc = description.toLowerCase();

  // 品格
  if (/正直|诚信|道德|原则|底线/.test(lowerDesc)) attributes.品格 += 15;
  if (/严谨|细致|认真|负责/.test(lowerDesc)) attributes.品格 += 10;
  if (/圆滑|灵活|变通/.test(lowerDesc)) attributes.品格 -= 5;

  // 情商
  if (/沟通|说服|外向|开朗|善于/.test(lowerDesc)) attributes.情商 += 15;
  if (/内敛|沉稳|沉默/.test(lowerDesc)) attributes.情商 -= 5;
  if (/人际关系|社交/.test(lowerDesc)) attributes.情商 += 10;

  // 专业知识
  if (/CFA|CPA|FRM|硕士|博士|名校/.test(lowerDesc)) attributes.专业知识 += 15;
  if (/分析|研究|风控|评估/.test(lowerDesc)) attributes.专业知识 += 10;
  if (/经验|资深|多年/.test(lowerDesc)) attributes.专业知识 += 10;

  // 人脉
  if (/人脉|关系|网络|广泛/.test(lowerDesc)) attributes.人脉 += 15;
  if (/熟人|认识|联系/.test(lowerDesc)) attributes.人脉 += 10;

  // 抗压能力
  if (/抗压|坚韧|承受|压力/.test(lowerDesc)) attributes.抗压能力 += 15;
  if (/创业|失败|坚持|从未放弃/.test(lowerDesc)) attributes.抗压能力 += 10;

  // 运气
  attributes.运气 = 40 + Math.floor(Math.random() * 20); // 40-60

  // Clamp all values
  const attrKeys: (keyof AvatarAttributes)[] = ['品格', '情商', '专业知识', '人脉', '抗压能力', '运气'];
  for (const key of attrKeys) {
    attributes[key] = Math.max(10, Math.min(90, attributes[key]));
  }

  // Parse career
  if (/投行|investment banking/.test(lowerDesc)) {
    career.当前职位 = '投行分析师';
    career.所属机构 = '某头部券商';
  } else if (/基金|fund|基金经理/.test(lowerDesc)) {
    career.当前职位 = '基金经理';
    career.所属机构 = '某基金公司';
  } else if (/银行|bank/.test(lowerDesc)) {
    career.当前职位 = '银行客户经理';
    career.所属机构 = '某大型银行';
  } else if (/保险|insurance/.test(lowerDesc)) {
    career.当前职位 = '保险精算师';
    career.所属机构 = '某保险公司';
  } else if (/风控|risk/.test(lowerDesc)) {
    career.当前职位 = '风控经理';
    career.所属机构 = '某金融机构';
  } else if (/创业|startup/.test(lowerDesc)) {
    career.当前职位 = '创业者';
    career.所属机构 = '自创公司';
  } else if (/监管|regulator/.test(lowerDesc)) {
    career.当前职位 = '监管官员';
    career.所属机构 = '监管机构';
  }

  // Parse work years
  const yearMatch = description.match(/(\d+)\s*年/);
  if (yearMatch) {
    career.工作年限 = parseInt(yearMatch[1], 10);
  }

  return { attributes, career };
}

// ==========================================
// AI实时生成行动结果和理由
// ==========================================
export async function generateAIOutcome(
  avatar: Avatar,
  scenario: Scenario,
  selectedChoice: Choice,
  history: GameEvent[]
): Promise<{
  description: string;
  reasoning: string;
  attributesChange: Partial<AvatarAttributes>;
  statusChange: Partial<Status>;
  emotion: EmotionType;
}> {
  const systemPrompt = `你是金融职场模拟游戏的AI剧情生成引擎。你需要根据角色、场景和选择，实时生成独特的行动结果和理由。

重要规则：
1. 每次生成的结果必须不同，要有创意和随机性
2. 结果要符合金融职场的现实逻辑
3. 要考虑角色的属性特点（高品格角色更容易有好结果，高运气角色有意外惊喜等）
4. 属性变化要有增有减，体现trade-off
5. 情绪要多样化：joy(欢乐)、conflict(冲突)、sadness(悲伤)、tension(紧张)、harmony(和谐)、neutral(平静)

请严格按照以下JSON格式返回：
{
  "description": "<详细描述行动结果，100-200字，要有情节和细节>",
  "reasoning": "<AI分析角色决策的理由，50-100字，要结合角色性格>",
  "attributesChange": {
    "品格": <变化值，-15到15>,
    "情商": <变化值，-15到15>,
    "专业知识": <变化值，-15到15>,
    "人脉": <变化值，-15到15>,
    "抗压能力": <变化值，-15到15>,
    "运气": <变化值，-10到10>
  },
  "statusChange": {
    "金钱": <变化值，-30到30>,
    "心情": <变化值，-20到20>,
    "健康": <变化值，-15到15>,
    "声望": <变化值，-20到20>
  },
  "emotion": "<情绪类型>"
}

生成原则：
- 结果要有惊喜感，不要平淡
- 可以有意外转折（好运或坏运）
- 属性变化总和应该在-20到20之间
- 状态变化要有正有负`;

  const recentHistory = history.slice(-3).map(
    (h) => `[${h.scenarioTitle}] ${h.result.slice(0, 50)}...`
  ).join('\n');

  const userPrompt = `角色信息：
- 姓名：${avatar.name}
- 当前属性：品格${avatar.attributes.品格}、情商${avatar.attributes.情商}、专业知识${avatar.attributes.专业知识}、人脉${avatar.attributes.人脉}、抗压能力${avatar.attributes.抗压能力}、运气${avatar.attributes.运气}
- 当前状态：金钱${avatar.status.金钱}、心情${avatar.status.心情}、健康${avatar.status.健康}、声望${avatar.status.声望}
- 职业：${avatar.career.当前职位}

当前场景：【${scenario.title}】（${scenario.category}）
场景描述：${scenario.description}
背景信息：${scenario.context}

选择的行动：${selectedChoice.text}

${recentHistory ? `最近经历：\n${recentHistory}` : ''}

请生成这个行动的结果。要有创意，不要生成平淡的结果！`;

  const aiResult = await callGLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], 0.9); // 高温度增加随机性

  if (aiResult) {
    try {
      const jsonMatch = aiResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // 验证和清理数据
        const attributesChange: Partial<AvatarAttributes> = {};
        const statusChange: Partial<Status> = {};
        
        // 只保留有效的属性变化
        ['品格', '情商', '专业知识', '人脉', '抗压能力', '运气'].forEach(key => {
          const val = parsed.attributesChange?.[key];
          if (typeof val === 'number' && val !== 0) {
            attributesChange[key as keyof AvatarAttributes] = Math.max(-20, Math.min(20, val));
          }
        });
        
        ['金钱', '心情', '健康', '声望'].forEach(key => {
          const val = parsed.statusChange?.[key];
          if (typeof val === 'number' && val !== 0) {
            statusChange[key as keyof Status] = Math.max(-30, Math.min(30, val));
          }
        });
        
        // 确保有增有减
        const attrValues = Object.values(attributesChange);
        if (attrValues.length > 0 && attrValues.every(v => (v as number) > 0)) {
          // 全部为正，随机减少一个
          const keys = Object.keys(attributesChange) as (keyof AvatarAttributes)[];
          const randomKey = keys[Math.floor(Math.random() * keys.length)];
          attributesChange[randomKey] = -Math.floor(Math.random() * 8) - 2;
        }
        
        return {
          description: parsed.description || '行动产生了意想不到的结果。',
          reasoning: parsed.reasoning || '基于当前情况做出的判断。',
          attributesChange,
          statusChange,
          emotion: ['joy', 'conflict', 'sadness', 'tension', 'harmony', 'neutral'].includes(parsed.emotion) 
            ? parsed.emotion as EmotionType 
            : 'neutral',
        };
      }
    } catch (e) {
      console.warn('Failed to parse AI outcome:', e);
    }
  }

  // Fallback: 生成随机结果
  return generateRandomOutcome(avatar, selectedChoice);
}

// 生成随机结果（备用）
function generateRandomOutcome(
  avatar: Avatar,
  selectedChoice: Choice
): {
  description: string;
  reasoning: string;
  attributesChange: Partial<AvatarAttributes>;
  statusChange: Partial<Status>;
  emotion: EmotionType;
} {
  const outcomes = [
    {
      desc: '你的行动取得了意想不到的成功，不仅解决了当前问题，还获得了额外的机会。',
      reason: '果断的决策和精准的判断带来了好运。',
      emotion: 'joy' as EmotionType,
    },
    {
      desc: '行动过程中出现了一些波折，但最终结果还在可控范围内。',
      reason: '虽然遇到了困难，但凭借经验化解了危机。',
      emotion: 'tension' as EmotionType,
    },
    {
      desc: '这次行动让你看清了一些人的真面目，虽然损失不大，但心情受到影响。',
      reason: '过于信任他人导致了被动的局面。',
      emotion: 'sadness' as EmotionType,
    },
    {
      desc: '你的行动引发了同事的不满，团队关系变得紧张。',
      reason: '决策时考虑不够周全，忽视了团队感受。',
      emotion: 'conflict' as EmotionType,
    },
    {
      desc: '一切进展顺利，各方配合默契，达成了预期目标。',
      reason: '充分的准备和良好的沟通确保了成功。',
      emotion: 'harmony' as EmotionType,
    },
  ];
  
  const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
  
  // 随机属性变化
  const attributesChange: Partial<AvatarAttributes> = {};
  const attrKeys: (keyof AvatarAttributes)[] = ['品格', '情商', '专业知识', '人脉', '抗压能力'];
  
  // 随机选择2-3个属性变化
  const numChanges = 2 + Math.floor(Math.random() * 2);
  const shuffled = [...attrKeys].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < numChanges; i++) {
    const key = shuffled[i];
    const isPositive = Math.random() > 0.4; // 60%概率正面
    attributesChange[key] = isPositive 
      ? Math.floor(Math.random() * 12) + 3 
      : -(Math.floor(Math.random() * 10) + 2);
  }
  
  // 随机状态变化
  const statusChange: Partial<Status> = {
    金钱: Math.floor(Math.random() * 20) - 5,
    心情: Math.floor(Math.random() * 15) - 5,
    声望: Math.floor(Math.random() * 15) - 3,
  };
  
  return {
    description: outcome.desc,
    reasoning: outcome.reason,
    attributesChange,
    statusChange,
    emotion: outcome.emotion,
  };
}

// ==========================================
// Generate AI action (选择方案)
// ==========================================
export async function generateAIAction(
  avatar: Avatar,
  scenario: Scenario,
  history: GameEvent[]
): Promise<{
  action: string;
  reasoning: string;
  selectedChoice?: Choice;
}> {
  const systemPrompt = `你是金融职场模拟游戏的AI决策引擎。你需要根据角色的属性、状态和当前场景，做出最符合角色性格的决策。

角色信息：
- 姓名：${avatar.name}
- 属性：品格${avatar.attributes.品格}、情商${avatar.attributes.情商}、专业知识${avatar.attributes.专业知识}、人脉${avatar.attributes.人脉}、抗压能力${avatar.attributes.抗压能力}、运气${avatar.attributes.运气}
- 状态：金钱${avatar.status.金钱}、心情${avatar.status.心情}、健康${avatar.status.健康}、声望${avatar.status.声望}
- 职业：${avatar.career.当前职位}，${avatar.career.所属机构}
- 角色描述：${avatar.characterDescription}

请严格按照以下JSON格式返回（不要包含任何其他文字）：
{
  "selectedChoiceId": "<选择的选项ID>",
  "action": "<角色采取的具体行动描述，50-100字，要有细节和场景感>",
  "reasoning": "<决策理由，结合角色性格和当前处境分析，50-100字，要独特不要模板化>"
}

决策原则：
1. 选择要符合角色的性格特点和属性水平
2. 高品格角色倾向合规和正直的选择
3. 高情商角色倾向沟通和协调的选择
4. 高专业知识角色倾向专业和创新的解决方案
5. 考虑角色当前状态（低心情时可能做出冲动的决定等）
6. 每次的理由都要不同，要有创意`;

  const recentHistory = history.slice(-5).map(
    (h) => `[${h.scenarioTitle}] ${h.result}`
  ).join('\n');

  const userPrompt = `当前场景：
【${scenario.title}】（${scenario.category}，难度${scenario.difficulty}/5）
${scenario.description}

背景信息：
${scenario.context}

可选方案：
${scenario.choices.map((c) => `${c.id}: ${c.text}`).join('\n')}

${recentHistory ? `最近经历：\n${recentHistory}` : ''}

请为${avatar.name}做出决策。要有创意，不要生成模板化的理由！`;

  const aiResult = await callGLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], 0.85);

  if (aiResult) {
    try {
      const jsonMatch = aiResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Find the selected choice
        const selectedChoice = scenario.choices.find(
          (c) => c.id === parsed.selectedChoiceId
        );

        return {
          action: parsed.action || `选择了方案：${selectedChoice?.text || '未知'}`,
          reasoning: parsed.reasoning || '基于当前情况做出的判断',
          selectedChoice: selectedChoice || scenario.choices[0],
        };
      }
    } catch (e) {
      console.warn('Failed to parse AI action response:', e);
    }
  }

  // Fallback: random choice with basic reasoning
  return randomFallback(avatar, scenario);
}

function randomFallback(avatar: Avatar, scenario: Scenario): {
  action: string;
  reasoning: string;
  selectedChoice: Choice;
} {
  // Weighted random based on attributes
  const weights = scenario.choices.map((choice) => {
    let weight = 1;
    const text = choice.text;

    // Higher 品格 -> prefer integrity options
    if (/合规|正直|诚信|底线|举报|报告/.test(text) && avatar.attributes.品格 > 60) weight += 2;
    // Higher 情商 -> prefer communication options
    if (/沟通|协商|协调|交流|安抚/.test(text) && avatar.attributes.情商 > 60) weight += 2;
    // Higher 专业知识 -> prefer professional options
    if (/分析|研究|专业|模型|优化/.test(text) && avatar.attributes.专业知识 > 60) weight += 2;
    // Higher 人脉 -> prefer networking options
    if (/人脉|关系|合作|联系/.test(text) && avatar.attributes.人脉 > 60) weight += 2;
    // Higher 抗压能力 -> prefer bold options
    if (/坚持|承担|果断|直面/.test(text) && avatar.attributes.抗压能力 > 60) weight += 1;

    return weight;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  let selectedIndex = 0;
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      selectedIndex = i;
      break;
    }
  }

  const selectedChoice = scenario.choices[selectedIndex];

  // 多样化的理由
  const reasoningTemplates = [
    '考虑到当前的处境和自身的优势，选择了这个方案。',
    '基于过往经验和直觉，认为这个选择最符合长远利益。',
    '在权衡利弊后，决定采取这个策略。',
    '受到近期经历的影响，倾向于这个方向。',
    '综合分析了各种因素，认为这是最优解。',
  ];

  return {
    action: `${avatar.name}决定：${selectedChoice.text}`,
    reasoning: reasoningTemplates[Math.floor(Math.random() * reasoningTemplates.length)],
    selectedChoice,
  };
}

// ==========================================
// Generate cooperative action for character pair
// ==========================================
export async function generateCooperativeAction(
  pair: CharacterPair,
  scenario: Scenario,
  history: GameEvent[]
): Promise<{
  action: string;
  reasoning: string;
  selectedChoice?: Choice;
}> {
  const systemPrompt = `你是金融职场模拟游戏的AI决策引擎。两个搭档需要协同合作来应对挑战。

男性角色：
- 姓名：${pair.male.name}
- 属性：品格${pair.male.attributes.品格}、情商${pair.male.attributes.情商}、专业知识${pair.male.attributes.专业知识}、人脉${pair.male.attributes.人脉}、抗压能力${pair.male.attributes.抗压能力}
- 性格：${pair.male.characterDescription}

女性角色：
- 姓名：${pair.female.name}
- 属性：品格${pair.female.attributes.品格}、情商${pair.female.attributes.情商}、专业知识${pair.female.attributes.专业知识}、人脉${pair.female.attributes.人脉}、抗压能力${pair.female.attributes.抗压能力}
- 性格：${pair.female.characterDescription}

关系状态：
- 和谐度：${pair.relationship.harmony}/100
- 信任度：${pair.relationship.trust}/100
- 冲突次数：${pair.relationship.conflicts}
- 欢乐时刻：${pair.relationship.joyfulMoments}

当前整体情绪：${pair.currentEmotion === 'joy' ? '欢乐' : pair.currentEmotion === 'conflict' ? '冲突' : pair.currentEmotion === 'sadness' ? '悲伤' : pair.currentEmotion === 'tension' ? '紧张' : '平静'}

请按照以下JSON格式返回决策结果：
{
  "selectedChoiceId": "<选择的选项ID>",
  "action": "<描述两人如何协同合作，80-150字，要有互动和对话感>",
  "reasoning": "<分析两人的决策过程和合作方式，80-150字，要体现两人的性格差异和互补>"
}

决策原则：
1. 两个角色应该协同合作，发挥各自优势
2. 考虑两人当前的和谐度和信任度
3. 发挥男性角色的优势（通常是专业知识或抗压能力）
4. 发挥女性角色的优势（通常是情商或人脉）
5. 决策应该体现两人的互补性
6. 每次的理由都要不同，要有创意和真实感`;

  const recentHistory = history.slice(-5).map(
    (h) => `[${h.scenarioTitle}] ${h.result}`
  ).join('\n');

  const userPrompt = `当前场景：
【${scenario.title}】（${scenario.category}，难度${scenario.difficulty}/5）
${scenario.description}

背景信息：
${scenario.context}

可选方案：
${scenario.choices.map((c) => `${c.id}: ${c.text}`).join('\n')}

${recentHistory ? `最近经历：\n${recentHistory}` : ''}

请为${pair.male.name}和${pair.female.name}这对搭档做出协同决策。要有创意，体现两人的互动！`;

  try {
    const aiResult = await callGLM([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], 0.9);

    if (aiResult) {
      const jsonMatch = aiResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Find the selected choice
        const selectedChoice = scenario.choices.find(
          (c) => c.id === parsed.selectedChoiceId
        );

        return {
          action: parsed.action || `${pair.male.name}和${pair.female.name}选择了方案`,
          reasoning: parsed.reasoning || '两人基于各自优势做出协同决策',
          selectedChoice: selectedChoice || scenario.choices[0],
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse cooperative AI action:', e);
  }

  // Fallback: 两个角色各自加权随机选择，取平均
  const maleChoice = randomFallback(pair.male, scenario);
  const femaleChoice = randomFallback(pair.female, scenario);

  // 如果两人选择不同，综合描述
  if (maleChoice.selectedChoice.id !== femaleChoice.selectedChoice.id) {
    return {
      action: `${pair.male.name}与${pair.female.name}经过讨论，决定综合两人的建议：${maleChoice.selectedChoice.text}`,
      reasoning: `${pair.male.name}凭借专业能力做出判断，${pair.female.name}从人际角度提出补充，两人协商后达成一致。`,
      selectedChoice: maleChoice.selectedChoice,
    };
  }

  return {
    action: `${pair.male.name}和${pair.female.name}一致认为：${maleChoice.selectedChoice.text}`,
    reasoning: `两人基于相互信任，选择了共同认可的方案。`,
    selectedChoice: maleChoice.selectedChoice,
  };
}

// ==========================================
// AI实时生成场景（情节随机化）
// ==========================================
export async function generateRandomScenario(
  avatar: Avatar,
  history: GameEvent[]
): Promise<{
  id: string;
  category: string;
  difficulty: number;
  title: string;
  description: string;
  context: string;
  choices: { id: string; text: string }[];
} | null> {
  const systemPrompt = `你是金融职场模拟游戏的AI场景生成引擎。你需要根据角色信息，实时生成一个独特的金融职场场景。

重要规则：
1. 每次生成的场景必须不同，要有创意
2. 场景要基于真实的金融业务（投行、基金、银行、保险、风控等）
3. 场景要有冲突和抉择，不能平淡
4. 难度要适中，符合角色当前状态
5. 四个选项要有明显差异，体现不同的价值观和策略

请严格按照以下JSON格式返回：
{
  "category": "<场景分类：投行/基金/银行/保险/风控/监管/危机等>",
  "difficulty": <1-5的难度>,
  "title": "<场景标题，15-30字>",
  "description": "<场景描述，100-150字，要有情节和冲突>",
  "context": "<背景信息，80-120字>",
  "choices": [
    { "id": "a", "text": "<选项A，20-40字>" },
    { "id": "b", "text": "<选项B，20-40字>" },
    { "id": "c", "text": "<选项C，20-40字>" },
    { "id": "d", "text": "<选项D，20-40字>" }
  ]
}

生成原则：
- 场景类型要多样化（业务挑战、人际关系、道德困境、突发事件等）
- 选项要体现不同的价值观（合规vs灵活、个人vs团队、短期vs长期等）
- 要有真实感和代入感`;

  const recentHistory = history.slice(-3).map(
    (h) => `[${h.scenarioTitle}]`
  ).join(', ');

  const userPrompt = `角色信息：
- 姓名：${avatar.name}
- 职业：${avatar.career.当前职位}，${avatar.career.所属机构}
- 工作年限：${avatar.career.工作年限}年
- 当前属性：品格${avatar.attributes.品格}、情商${avatar.attributes.情商}、专业知识${avatar.attributes.专业知识}
- 当前状态：金钱${avatar.status.金钱}、心情${avatar.status.心情}、声望${avatar.status.声望}

${recentHistory ? `最近经历：${recentHistory}` : ''}

请生成一个全新的金融职场场景。要有创意，不要生成常见的模板场景！`;

  const aiResult = await callGLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], 1.0); // 最高温度，最大化随机性

  if (aiResult) {
    try {
      const jsonMatch = aiResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          id: `ai_generated_${Date.now()}`,
          category: parsed.category || '金融职场',
          difficulty: Math.max(1, Math.min(5, parsed.difficulty || 3)),
          title: parsed.title || '新的挑战',
          description: parsed.description || '一个意外的挑战出现在你面前。',
          context: parsed.context || '你需要做出选择。',
          choices: parsed.choices || [
            { id: 'a', text: '谨慎处理' },
            { id: 'b', text: '果断行动' },
            { id: 'c', text: '寻求帮助' },
            { id: 'd', text: '暂时观望' },
          ],
        };
      }
    } catch (e) {
      console.warn('Failed to parse AI scenario:', e);
    }
  }

  return null;
}

// ==========================================
// Legacy function for compatibility
// ==========================================
export function evaluateOutcome(
  selectedChoice: Choice,
  scenario: any,
  attributes: AvatarAttributes,
  status: Status
): {
  description: string;
  attributesChange: Partial<AvatarAttributes>;
  statusChange: Partial<Status>;
} {
  // This function is kept for compatibility but should not be used
  // Use generateAIOutcome instead for AI-generated results
  const outcome = scenario.outcomes?.[selectedChoice.id];

  if (!outcome) {
    return {
      description: '你做出了选择，但结果尚不明朗。',
      attributesChange: {},
      statusChange: {},
    };
  }

  return {
    description: outcome.description,
    attributesChange: outcome.attributesChange || {},
    statusChange: outcome.statusChange || {},
  };
}
