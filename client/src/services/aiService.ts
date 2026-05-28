import { Avatar, AvatarAttributes, Career, Status, Scenario, Choice, GameEvent } from '../types';

const GLM_API_KEY = '7b8a15f57d2941a69fcce60f49f7c6ff.SiMrZjCdyOmdtzLr';
const GLM_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

// ==========================================
// GLM API call helper
// ==========================================
async function callGLM(messages: { role: string; content: string }[]): Promise<string | null> {
  try {
    const response = await fetch(GLM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.warn('GLM API call failed:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.warn('GLM API call error:', err);
    return null;
  }
}

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
  ]);

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
// Generate AI action
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
  const systemPrompt = `你是一个金融职场模拟游戏的AI决策引擎。你需要根据角色的属性、状态和当前场景，做出最符合角色性格的决策。

角色信息：
- 姓名：${avatar.name}
- 属性：品格${avatar.attributes.品格}、情商${avatar.attributes.情商}、专业知识${avatar.attributes.专业知识}、人脉${avatar.attributes.人脉}、抗压能力${avatar.attributes.抗压能力}、运气${avatar.attributes.运气}
- 状态：金钱${avatar.status.金钱}、心情${avatar.status.心情}、健康${avatar.status.健康}、声望${avatar.status.声望}
- 职业：${avatar.career.当前职位}，${avatar.career.所属机构}
- 角色描述：${avatar.characterDescription}

请严格按照以下JSON格式返回（不要包含任何其他文字）：
{
  "selectedChoiceId": "<选择的选项ID>",
  "action": "<角色采取的具体行动描述，50-100字>",
  "reasoning": "<决策理由，结合角色性格和当前处境分析，50-100字>"
}

决策原则：
1. 选择要符合角色的性格特点和属性水平
2. 高品格角色倾向合规和正直的选择
3. 高情商角色倾向沟通和协调的选择
4. 高专业知识角色倾向专业和创新的解决方案
5. 考虑角色当前状态（低心情时可能做出冲动的决定等）`;

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

请为${avatar.name}做出决策。`;

  const aiResult = await callGLM([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

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

  const reasoningMap: Record<string, string> = {
    '合规|正直|诚信': '基于自身的道德底线和职业操守，选择了坚持原则的方案。',
    '沟通|协商': '考虑到人际关系和沟通能力，选择了通过协调解决问题的方案。',
    '分析|研究': '凭借专业知识和分析能力，选择了基于数据和研究的方案。',
    '坚持|承担': '依靠强大的抗压能力，选择了直面挑战的方案。',
  };

  let reasoning = '综合考虑当前情况和自身能力，做出了这个决定。';
  for (const [pattern, text] of Object.entries(reasoningMap)) {
    if (new RegExp(pattern).test(selectedChoice.text)) {
      reasoning = text;
      break;
    }
  }

  return {
    action: `${avatar.name}决定：${selectedChoice.text}`,
    reasoning,
    selectedChoice,
  };
}

// ==========================================
// Evaluate outcome
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
  const outcome = scenario.outcomes?.[selectedChoice.id];

  if (!outcome) {
    return {
      description: '你做出了选择，但结果尚不明朗。',
      attributesChange: {},
      statusChange: {},
    };
  }

  // Apply luck factor to attribute changes
  const luckFactor = attributes.运气 / 100; // 0-1
  const attributesChange: Partial<AvatarAttributes> = { ...outcome.attributesChange };
  const statusChange: Partial<Status> = { ...outcome.statusChange };

  // Luck can slightly amplify positive changes or reduce negative ones
  const attrKeys: (keyof AvatarAttributes)[] = ['品格', '情商', '专业知识', '人脉', '抗压能力', '运气'];
  for (const key of attrKeys) {
    if (attributesChange[key] !== undefined) {
      const change = attributesChange[key]!;
      if (change > 0) {
        // Positive change: luck adds a small bonus
        const bonus = Math.floor(Math.random() * luckFactor * 5);
        attributesChange[key] = change + bonus;
      } else if (change < 0) {
        // Negative change: luck can reduce the penalty slightly
        const reduction = Math.floor(Math.random() * luckFactor * 3);
        attributesChange[key] = change + reduction;
      }
    }
  }

  // Apply status changes with luck
  const statusKeys: (keyof Status)[] = ['金钱', '心情', '健康', '声望'];
  for (const key of statusKeys) {
    if (statusChange[key] !== undefined) {
      const change = statusChange[key]!;
      if (change > 0) {
        const bonus = Math.floor(Math.random() * luckFactor * 3);
        statusChange[key] = change + bonus;
      } else if (change < 0) {
        const reduction = Math.floor(Math.random() * luckFactor * 2);
        statusChange[key] = change + reduction;
      }
    }
  }

  return {
    description: outcome.description,
    attributesChange,
    statusChange,
  };
}
