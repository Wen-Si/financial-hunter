// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  created_at?: string;
  last_login_at?: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

// 数字人相关类型
export interface AvatarAttributes {
  品格: number;
  情商: number;
  专业知识: number;
  人脉: number;
  抗压能力: number;
  运气: number;
}

export interface Career {
  当前职位: string;
  目标方向: string;
  工作年限: number;
  所属机构: string;
}

export interface Status {
  金钱: number;
  心情: number;
  健康: number;
  声望: number;
}

export interface GameEvent {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  action: string;
  result: string;
  timestamp: string;
}

export interface Avatar {
  id: string;
  userId: string;
  name: string;
  characterDescription: string;
  avatarUrl?: string; // 随机生成的头像URL
  attributes: AvatarAttributes;
  career: Career;
  status: Status;
  currentScenario: string | null;
  gameLog: GameEvent[];
  createdAt: string;
  updatedAt: string;
}

// 场景相关类型
export interface Choice {
  id: string;
  text: string;
}

export interface Outcome {
  description: string;
  attributesChange: Partial<AvatarAttributes>;
  statusChange: Partial<Status>;
}

export interface Scenario {
  id: string;
  category: string;
  difficulty: number;
  title: string;
  description: string;
  context: string;
  choices: Choice[];
}

// 游戏相关类型
export interface GameActionResponse {
  action: {
    action: string;
    reasoning: string;
    selectedChoice?: Choice;
  };
  outcome: {
    description: string;
    attributesChange: Partial<AvatarAttributes>;
    statusChange: Partial<Status>;
  };
  newAttributes: AvatarAttributes;
  newStatus: Status;
  nextScenario: Scenario | null;
  gameEvent: GameEvent;
  isGameOver: boolean;
}

export interface GameStartResponse {
  message: string;
  scenario: Scenario;
  avatar: {
    id: string;
    name: string;
    attributes: AvatarAttributes;
    career: Career;
    status: Status;
  };
}
