// 用户类型
export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  lastLoginAt: string;
}

// 数字人属性
export interface AvatarAttributes {
  品格: number;      // 0-100
  情商: number;     // 0-100
  专业知识: number;  // 0-100
  人脉: number;     // 0-100
  抗压能力: number;  // 0-100
  运气: number;     // 0-100
}

// 职业信息
export interface Career {
  当前职位: string;
  目标方向: string;
  工作年限: number;
  所属机构: string;
}

// 状态信息
export interface Status {
  金钱: number;
  心情: number;
  健康: number;
  声望: number;
}

// 游戏事件
export interface GameEvent {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  action: string;
  result: string;
  timestamp: string;
}

// 数字人
export interface Avatar {
  id: string;
  userId: string;
  name: string;
  characterDescription: string;
  attributes: AvatarAttributes;
  career: Career;
  status: Status;
  currentScenario: string | null;
  gameLog: GameEvent[];
  createdAt: string;
  updatedAt: string;
}

// 游戏历史记录
export interface GameHistory {
  id: string;
  avatarId: string;
  scenarioId: string;
  action: string;
  result: string;
  attributesChange: Partial<AvatarAttributes>;
  statusChange: Partial<Status>;
  createdAt: string;
}

// 场景选项
export interface Choice {
  id: string;
  text: string;
  requiredAttributes?: Partial<AvatarAttributes>;
}

// 场景结果
export interface Outcome {
  description: string;
  attributesChange: Partial<AvatarAttributes>;
  statusChange: Partial<Status>;
  nextScenarios?: string[];
}

// 场景
export interface Scenario {
  id: string;
  category: '投行' | '基金' | '银行' | '保险' | '监管' | '风控' | '职场';
  difficulty: 1 | 2 | 3 | 4 | 5;
  title: string;
  description: string;
  triggers: {
    attributes?: Partial<AvatarAttributes>;
    status?: Partial<Status>;
    career?: Partial<Career>;
  };
  context: string;
  choices: Choice[];
  outcomes: Record<string, Outcome>;
}

// AI决策请求
export interface AIActionRequest {
  avatar: Avatar;
  scenario: Scenario;
  history: GameEvent[];
}

// AI决策响应
export interface AIActionResponse {
  action: string;
  reasoning: string;
  selectedChoice?: Choice;
}
